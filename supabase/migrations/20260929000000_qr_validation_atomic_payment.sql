-- Robustez dos fluxos de reserva/pagamento/QR (preparação da demo)
--
-- 1. calculate_commission(price)            — regra de comissão no servidor
-- 2. create_and_pay_reservation(...)        — cria reserva + paga + divide carteiras
--                                             + decrementa stock, tudo numa transação
-- 3. on_reservation_cancelled (trigger)     — repõe stock e reembolsa se estava paga
-- 4. validate_reservation_qr(id)            — classifica o QR: valid / already_used /
--                                             expired / cancelled / not_paid / not_found
-- 5. confirm_pickup(id)                     — valida e marca 'concluida' atomicamente

-- ============================================
-- 1. Comissão (mesma tabela que src/lib/commission.js)
-- ============================================
CREATE OR REPLACE FUNCTION calculate_commission(p_price NUMERIC) RETURNS NUMERIC AS $$
  SELECT CASE
    WHEN p_price <= 100  THEN 0
    WHEN p_price <= 500  THEN 10
    WHEN p_price <= 1000 THEN 25
    WHEN p_price <= 2000 THEN 75
    ELSE LEAST(300, ROUND(p_price * 0.05))
  END;
$$ LANGUAGE sql IMMUTABLE;

-- ============================================
-- 2. Criar reserva e pagar (atómico)
-- ============================================
CREATE OR REPLACE FUNCTION create_and_pay_reservation(
  p_medicine_id INT,
  p_pharmacy_id INT,
  p_method TEXT,
  p_phone TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  m RECORD;
  p RECORD;
  s RECORD;
  v_commission NUMERIC;
  v_total NUMERIC;
  v_reservation reservations%ROWTYPE;
  pharmacy_wallet_id UUID;
  platform_wallet_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Precisa de iniciar sessão para reservar';
  END IF;
  IF p_method NOT IN ('mpesa', 'emola') THEN
    RAISE EXCEPTION 'Método de pagamento inválido';
  END IF;

  SELECT * INTO m FROM medicines WHERE id = p_medicine_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Medicamento não encontrado'; END IF;

  SELECT * INTO p FROM pharmacies WHERE id = p_pharmacy_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Farmácia não encontrada'; END IF;

  -- Bloqueia a linha de stock para evitar reservas concorrentes da última unidade
  SELECT * INTO s FROM pharmacy_stock
  WHERE pharmacy_id = p_pharmacy_id AND medicine_id = p_medicine_id
  FOR UPDATE;
  IF NOT FOUND OR NOT s.available OR s.qty <= 0 THEN
    RAISE EXCEPTION 'Este medicamento já não está disponível nesta farmácia';
  END IF;

  v_commission := calculate_commission(m.price);
  v_total := m.price + v_commission;

  INSERT INTO reservations (
    user_id, medicine_id, medicine_name, pharmacy_id, pharmacy_name, pharmacy_address,
    price, status, commission, total_paid, payment_method, payment_status
  ) VALUES (
    auth.uid(), m.id, m.name, p.id, p.name, p.address,
    m.price, 'pendente', v_commission, v_total, p_method, 'completed'
  ) RETURNING * INTO v_reservation;

  -- Reserva uma unidade
  UPDATE pharmacy_stock
  SET qty = s.qty - 1, available = (s.qty - 1) > 0
  WHERE id = s.id;

  -- Carteiras
  INSERT INTO wallets (pharmacy_id, is_platform) VALUES (p.id, false)
  ON CONFLICT (pharmacy_id) WHERE pharmacy_id IS NOT NULL DO NOTHING;
  SELECT id INTO pharmacy_wallet_id FROM wallets WHERE pharmacy_id = p.id;
  SELECT id INTO platform_wallet_id FROM wallets WHERE is_platform = true;

  UPDATE wallets
  SET balance = balance + m.price, total_earned = total_earned + m.price, updated_at = now()
  WHERE id = pharmacy_wallet_id;
  INSERT INTO wallet_transactions (wallet_id, type, amount, payment_method, reservation_id, description, metadata)
  VALUES (pharmacy_wallet_id, 'payment_in', m.price, p_method, v_reservation.id,
          'Pagamento: ' || m.name, jsonb_build_object('phone', p_phone));

  IF v_commission > 0 THEN
    UPDATE wallets
    SET balance = balance + v_commission, total_earned = total_earned + v_commission, updated_at = now()
    WHERE id = platform_wallet_id;
    INSERT INTO wallet_transactions (wallet_id, type, amount, payment_method, reservation_id, description)
    VALUES (platform_wallet_id, 'commission_in', v_commission, 'commission', v_reservation.id,
            'Comissão: ' || m.name || ' (' || p.name || ')');
  END IF;

  RETURN to_json(v_reservation);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_and_pay_reservation(INT, INT, TEXT, TEXT) TO authenticated;

-- ============================================
-- 3. Cancelamento: repõe stock e reembolsa
-- ============================================
CREATE OR REPLACE FUNCTION on_reservation_cancelled() RETURNS TRIGGER AS $$
DECLARE
  pharmacy_wallet_id UUID;
  platform_wallet_id UUID;
BEGIN
  IF NEW.status = 'cancelada' AND OLD.status <> 'cancelada' THEN
    UPDATE pharmacy_stock
    SET qty = qty + 1, available = true
    WHERE pharmacy_id = NEW.pharmacy_id AND medicine_id = NEW.medicine_id;

    IF OLD.payment_status = 'completed' THEN
      SELECT id INTO pharmacy_wallet_id FROM wallets WHERE pharmacy_id = NEW.pharmacy_id;
      SELECT id INTO platform_wallet_id FROM wallets WHERE is_platform = true;

      IF pharmacy_wallet_id IS NOT NULL THEN
        UPDATE wallets
        SET balance = balance - NEW.price, total_earned = total_earned - NEW.price, updated_at = now()
        WHERE id = pharmacy_wallet_id;
        INSERT INTO wallet_transactions (wallet_id, type, amount, payment_method, reservation_id, description)
        VALUES (pharmacy_wallet_id, 'refund_out', NEW.price, NEW.payment_method, NEW.id,
                'Reembolso: ' || NEW.medicine_name);
      END IF;

      IF NEW.commission > 0 AND platform_wallet_id IS NOT NULL THEN
        UPDATE wallets
        SET balance = balance - NEW.commission, total_earned = total_earned - NEW.commission, updated_at = now()
        WHERE id = platform_wallet_id;
        INSERT INTO wallet_transactions (wallet_id, type, amount, payment_method, reservation_id, description)
        VALUES (platform_wallet_id, 'refund_out', NEW.commission, 'commission', NEW.id,
                'Reembolso comissão: ' || NEW.medicine_name);
      END IF;

      NEW.payment_status := 'refunded';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_reservation_cancelled ON reservations;
CREATE TRIGGER trigger_reservation_cancelled
  BEFORE UPDATE OF status ON reservations
  FOR EACH ROW EXECUTE FUNCTION on_reservation_cancelled();

-- ============================================
-- 4. Validação do QR (só staff da farmácia ou admin)
-- ============================================
CREATE OR REPLACE FUNCTION validate_reservation_qr(p_reservation_id UUID) RETURNS JSON AS $$
DECLARE
  r reservations%ROWTYPE;
  v_result TEXT;
  v_client_name TEXT;
BEGIN
  IF NOT is_pharmacy_staff() THEN
    RAISE EXCEPTION 'Acesso restrito ao pessoal das farmácias';
  END IF;

  SELECT * INTO r FROM reservations WHERE id = p_reservation_id;
  IF NOT FOUND THEN
    RETURN json_build_object('result', 'not_found');
  END IF;

  IF NOT is_admin() AND r.pharmacy_id IS DISTINCT FROM user_pharmacy_id() THEN
    RETURN json_build_object('result', 'wrong_pharmacy', 'pharmacy_name', r.pharmacy_name);
  END IF;

  SELECT COALESCE(raw_user_meta_data ->> 'name', split_part(email, '@', 1))
  INTO v_client_name FROM auth.users WHERE id = r.user_id;

  v_result := CASE
    WHEN r.status = 'concluida' THEN 'already_used'
    WHEN r.status = 'cancelada' THEN 'cancelled'
    WHEN r.payment_status <> 'completed' THEN 'not_paid'
    WHEN r.created_at + interval '24 hours' < now() THEN 'expired'
    ELSE 'valid'
  END;

  RETURN json_build_object(
    'result', v_result,
    'reservation', to_json(r),
    'client_name', v_client_name,
    'expires_at', r.created_at + interval '24 hours'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION validate_reservation_qr(UUID) TO authenticated;

-- ============================================
-- 5. Confirmar levantamento (valida + conclui, atómico)
-- ============================================
CREATE OR REPLACE FUNCTION confirm_pickup(p_reservation_id UUID) RETURNS JSON AS $$
DECLARE
  v JSON;
BEGIN
  -- Bloqueia a reserva para que dois balcões não a concluam ao mesmo tempo
  PERFORM 1 FROM reservations WHERE id = p_reservation_id FOR UPDATE;

  v := validate_reservation_qr(p_reservation_id);
  IF v ->> 'result' <> 'valid' THEN
    RETURN v;
  END IF;

  UPDATE reservations SET status = 'concluida' WHERE id = p_reservation_id;
  RETURN validate_reservation_qr(p_reservation_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION confirm_pickup(UUID) TO authenticated;

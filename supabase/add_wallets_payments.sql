-- Sistema de carteiras digitais e pagamentos simulados
-- Corre este SQL no SQL Editor do Supabase

-- ============================================
-- 1. Colunas de pagamento na tabela reservations
-- ============================================
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS commission NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS total_paid NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending'
  CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded'));

-- ============================================
-- 2. Tabela de carteiras
-- ============================================
CREATE TABLE IF NOT EXISTS wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pharmacy_id INT REFERENCES pharmacies(id) ON DELETE CASCADE,
  is_platform BOOLEAN NOT NULL DEFAULT false,
  balance NUMERIC NOT NULL DEFAULT 0,
  total_earned NUMERIC NOT NULL DEFAULT 0,
  total_withdrawn NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT wallet_kind_check CHECK (
    (pharmacy_id IS NULL AND is_platform = true) OR
    (pharmacy_id IS NOT NULL AND is_platform = false)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS wallets_pharmacy_unique
  ON wallets (pharmacy_id) WHERE pharmacy_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS wallets_platform_unique
  ON wallets ((true)) WHERE is_platform = true;

-- Criar carteira da plataforma se não existir
INSERT INTO wallets (is_platform) VALUES (true)
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. Tabela de transações
-- ============================================
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('payment_in', 'commission_in', 'withdrawal', 'refund_out', 'refund_in')),
  amount NUMERIC NOT NULL,
  payment_method TEXT,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet ON wallet_transactions(wallet_id, created_at DESC);

-- ============================================
-- 4. Função: processar pagamento de reserva
-- ============================================
CREATE OR REPLACE FUNCTION process_reservation_payment(
  p_reservation_id UUID,
  p_method TEXT,
  p_commission NUMERIC,
  p_total NUMERIC
) RETURNS JSON AS $$
DECLARE
  r RECORD;
  pharmacy_wallet_id UUID;
  platform_wallet_id UUID;
  result JSON;
BEGIN
  IF p_method NOT IN ('mpesa', 'emola') THEN
    RAISE EXCEPTION 'Método de pagamento inválido: %', p_method;
  END IF;

  -- Carregar reserva
  SELECT * INTO r FROM reservations WHERE id = p_reservation_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reserva não encontrada';
  END IF;

  IF r.payment_status = 'completed' THEN
    RAISE EXCEPTION 'Esta reserva já foi paga';
  END IF;

  -- Garantir que existe carteira da farmácia
  INSERT INTO wallets (pharmacy_id, is_platform)
  VALUES (r.pharmacy_id, false)
  ON CONFLICT (pharmacy_id) WHERE pharmacy_id IS NOT NULL DO NOTHING;

  SELECT id INTO pharmacy_wallet_id FROM wallets WHERE pharmacy_id = r.pharmacy_id;
  SELECT id INTO platform_wallet_id FROM wallets WHERE is_platform = true;

  -- Creditar farmácia com o valor do medicamento
  UPDATE wallets
  SET balance = balance + r.price,
      total_earned = total_earned + r.price,
      updated_at = now()
  WHERE id = pharmacy_wallet_id;

  INSERT INTO wallet_transactions (wallet_id, type, amount, payment_method, reservation_id, description)
  VALUES (
    pharmacy_wallet_id, 'payment_in', r.price, p_method, p_reservation_id,
    'Pagamento: ' || r.medicine_name
  );

  -- Creditar plataforma com a comissão
  IF p_commission > 0 THEN
    UPDATE wallets
    SET balance = balance + p_commission,
        total_earned = total_earned + p_commission,
        updated_at = now()
    WHERE id = platform_wallet_id;

    INSERT INTO wallet_transactions (wallet_id, type, amount, payment_method, reservation_id, description)
    VALUES (
      platform_wallet_id, 'commission_in', p_commission, 'commission', p_reservation_id,
      'Comissão: ' || r.medicine_name
    );
  END IF;

  -- Marcar reserva como paga
  UPDATE reservations
  SET payment_status = 'completed',
      payment_method = p_method,
      commission = p_commission,
      total_paid = p_total
  WHERE id = p_reservation_id;

  -- Devolver info
  SELECT json_build_object(
    'reservation_id', p_reservation_id,
    'price', r.price,
    'commission', p_commission,
    'total_paid', p_total,
    'method', p_method,
    'paid_at', now()
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION process_reservation_payment(UUID, TEXT, NUMERIC, NUMERIC) TO authenticated;

-- ============================================
-- 5. Função: levantar saldo
-- ============================================
CREATE OR REPLACE FUNCTION withdraw_from_wallet(
  p_wallet_id UUID,
  p_amount NUMERIC,
  p_method TEXT
) RETURNS UUID AS $$
DECLARE
  w RECORD;
  txn_id UUID;
  authorized BOOLEAN;
BEGIN
  IF p_method NOT IN ('mpesa', 'emola') THEN
    RAISE EXCEPTION 'Método inválido';
  END IF;
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Valor inválido';
  END IF;

  SELECT * INTO w FROM wallets WHERE id = p_wallet_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Carteira não encontrada';
  END IF;

  -- Autorização: admin para platform, staff para a sua farmácia
  authorized := (w.is_platform AND is_admin())
             OR (w.pharmacy_id = user_pharmacy_id())
             OR is_admin();

  IF NOT authorized THEN
    RAISE EXCEPTION 'Sem permissão para esta carteira';
  END IF;

  IF w.balance < p_amount THEN
    RAISE EXCEPTION 'Saldo insuficiente (disponível: %)', w.balance;
  END IF;

  UPDATE wallets
  SET balance = balance - p_amount,
      total_withdrawn = total_withdrawn + p_amount,
      updated_at = now()
  WHERE id = p_wallet_id;

  INSERT INTO wallet_transactions (wallet_id, type, amount, payment_method, description)
  VALUES (
    p_wallet_id, 'withdrawal', p_amount, p_method,
    'Levantamento para ' || UPPER(p_method)
  ) RETURNING id INTO txn_id;

  RETURN txn_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION withdraw_from_wallet(UUID, NUMERIC, TEXT) TO authenticated;

-- ============================================
-- 6. RLS
-- ============================================
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Staff vê própria; admin vê todas
DROP POLICY IF EXISTS "Leitura de carteiras" ON wallets;
CREATE POLICY "Leitura de carteiras" ON wallets
  FOR SELECT USING (
    is_admin() OR pharmacy_id = user_pharmacy_id()
  );

DROP POLICY IF EXISTS "Leitura de transações" ON wallet_transactions;
CREATE POLICY "Leitura de transações" ON wallet_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM wallets w
      WHERE w.id = wallet_transactions.wallet_id
        AND (is_admin() OR w.pharmacy_id = user_pharmacy_id())
    )
  );

-- ============================================
-- 7. Realtime
-- ============================================
DO $$
BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'wallets';
  IF NOT FOUND THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE wallets;
  END IF;

  PERFORM 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'wallet_transactions';
  IF NOT FOUND THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE wallet_transactions;
  END IF;
END $$;

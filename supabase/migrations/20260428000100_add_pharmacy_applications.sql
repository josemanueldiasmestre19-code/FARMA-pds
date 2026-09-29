-- Sistema de registo de farmácias com aprovação por admin
-- Corre este SQL no SQL Editor do Supabase

-- ============================================
-- 1. Tabela de pedidos
-- ============================================
CREATE TABLE pharmacy_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pharmacy_name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  hours TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  license_number TEXT NOT NULL,  -- NUIT / Alvará
  owner_name TEXT NOT NULL,
  owner_phone TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  created_pharmacy_id INT REFERENCES pharmacies(id),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, status) DEFERRABLE INITIALLY DEFERRED
);

-- Permitir ter múltiplos pedidos rejeitados/aprovados, mas só um pendente
CREATE UNIQUE INDEX idx_one_pending_per_user
  ON pharmacy_applications (user_id)
  WHERE status = 'pending';

ALTER TABLE pharmacy_applications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. Policies RLS
-- ============================================

-- Utilizador vê os seus próprios pedidos
CREATE POLICY "Utilizador vê seus pedidos" ON pharmacy_applications
  FOR SELECT USING (auth.uid() = user_id);

-- Admin vê todos
CREATE POLICY "Admin vê todos os pedidos" ON pharmacy_applications
  FOR SELECT USING (is_admin());

-- Utilizador pode criar pedido (se não tiver pendente)
CREATE POLICY "Utilizador pode criar pedido" ON pharmacy_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Utilizador pode apagar o seu pedido pendente
CREATE POLICY "Utilizador pode apagar pedido pendente" ON pharmacy_applications
  FOR DELETE USING (auth.uid() = user_id AND status = 'pending');

-- ============================================
-- 3. Function: aprovar pedido (cria farmácia + dá acesso ao staff)
-- ============================================
CREATE OR REPLACE FUNCTION approve_pharmacy_application(app_id UUID)
RETURNS INT AS $$
DECLARE
  app RECORD;
  new_pharmacy_id INT;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  SELECT * INTO app FROM pharmacy_applications
  WHERE id = app_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido não encontrado ou já processado';
  END IF;

  -- Criar farmácia
  INSERT INTO pharmacies (name, address, phone, hours, lat, lng, rating)
  VALUES (app.pharmacy_name, app.address, app.phone, app.hours, app.lat, app.lng, 0)
  RETURNING id INTO new_pharmacy_id;

  -- Criar stock vazio para todos os medicamentos
  INSERT INTO pharmacy_stock (pharmacy_id, medicine_id, available, qty)
  SELECT new_pharmacy_id, id, false, 0 FROM medicines;

  -- Atribuir staff role
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('pharmacy_id', new_pharmacy_id)
  WHERE id = app.user_id;

  -- Marcar pedido como aprovado
  UPDATE pharmacy_applications
  SET status = 'approved',
      reviewed_at = now(),
      reviewed_by = auth.uid(),
      created_pharmacy_id = new_pharmacy_id
  WHERE id = app_id;

  RETURN new_pharmacy_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. Function: rejeitar pedido
-- ============================================
CREATE OR REPLACE FUNCTION reject_pharmacy_application(app_id UUID, reason TEXT)
RETURNS VOID AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  UPDATE pharmacy_applications
  SET status = 'rejected',
      rejection_reason = reason,
      reviewed_at = now(),
      reviewed_by = auth.uid()
  WHERE id = app_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido não encontrado ou já processado';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissões para chamar as functions via RPC
GRANT EXECUTE ON FUNCTION approve_pharmacy_application(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_pharmacy_application(UUID, TEXT) TO authenticated;

-- Activar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE pharmacy_applications;

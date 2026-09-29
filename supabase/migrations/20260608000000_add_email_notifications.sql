-- Sistema de notificações por email
-- Corre este SQL no SQL Editor do Supabase

-- 1. Adicionar coluna contact_email à tabela pharmacies
ALTER TABLE pharmacies
  ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- 2. Actualizar a função approve_pharmacy_application para preencher contact_email
--    com o email do utilizador que registou a farmácia
CREATE OR REPLACE FUNCTION approve_pharmacy_application(app_id UUID)
RETURNS INT AS $$
DECLARE
  app RECORD;
  new_pharmacy_id INT;
  user_email TEXT;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  SELECT * INTO app FROM pharmacy_applications
  WHERE id = app_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido não encontrado ou já processado';
  END IF;

  -- Buscar email do utilizador
  SELECT email INTO user_email FROM auth.users WHERE id = app.user_id;

  -- Criar farmácia com email de contacto
  INSERT INTO pharmacies (name, address, phone, hours, lat, lng, rating, contact_email)
  VALUES (app.pharmacy_name, app.address, app.phone, app.hours, app.lat, app.lng, 0, user_email)
  RETURNING id INTO new_pharmacy_id;

  -- Criar stock vazio
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

-- 3. Para farmácias já existentes (criadas antes deste update), podes definir email manualmente:
-- UPDATE pharmacies SET contact_email = 'email@exemplo.mz' WHERE id = 1;

-- 4. Permitir staff/admin actualizar a sua farmácia (incluindo contact_email)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'pharmacies' AND policyname = 'Staff actualiza sua farmácia'
  ) THEN
    EXECUTE 'CREATE POLICY "Staff actualiza sua farmácia" ON pharmacies
      FOR UPDATE USING (is_admin() OR id = user_pharmacy_id())
      WITH CHECK (is_admin() OR id = user_pharmacy_id())';
  END IF;
END $$;

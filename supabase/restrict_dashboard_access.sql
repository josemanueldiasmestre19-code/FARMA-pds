-- Restringir acesso ao Dashboard de stock
-- Só admin e pessoal da farmácia (com pharmacy_id no app_metadata) pode editar stock
-- Corre este SQL no SQL Editor do Supabase

-- Função: devolve o pharmacy_id do utilizador actual (se for staff)
CREATE OR REPLACE FUNCTION user_pharmacy_id() RETURNS INT AS $$
  SELECT NULLIF((auth.jwt() -> 'app_metadata' ->> 'pharmacy_id'), '')::INT;
$$ LANGUAGE sql STABLE;

-- Função: verifica se é admin OU staff
CREATE OR REPLACE FUNCTION is_pharmacy_staff() RETURNS BOOLEAN AS $$
  SELECT is_admin() OR (auth.jwt() -> 'app_metadata' ->> 'pharmacy_id') IS NOT NULL;
$$ LANGUAGE sql STABLE;

-- Remover a policy antiga que deixava qualquer utilizador autenticado editar stock
DROP POLICY IF EXISTS "Update de stock por utilizadores autenticados" ON pharmacy_stock;

-- Nova policy: admin ou staff da própria farmácia
CREATE POLICY "Staff/admin pode actualizar stock" ON pharmacy_stock
  FOR UPDATE USING (
    is_admin() OR pharmacy_id = user_pharmacy_id()
  ) WITH CHECK (
    is_admin() OR pharmacy_id = user_pharmacy_id()
  );

-- ============================================
-- Como tornar um utilizador staff de uma farmácia:
--
-- UPDATE auth.users
-- SET raw_app_meta_data = raw_app_meta_data || '{"pharmacy_id": 1}'::jsonb
-- WHERE email = 'staff@farmaciapolana.com';
--
-- Substitui pharmacy_id pelo ID da farmácia (vê em Table Editor → pharmacies)
-- O utilizador precisa de fazer logout/login para o token actualizar.
-- ============================================

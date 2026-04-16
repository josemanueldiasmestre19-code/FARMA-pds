-- Políticas de admin para gerir farmácias, medicamentos e stock
-- Corre este SQL no SQL Editor do Supabase
--
-- Para tornar um utilizador admin, corre:
--   UPDATE auth.users
--   SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
--   WHERE email = 'teu@email.com';

-- Função helper para verificar se o utilizador actual é admin
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$ LANGUAGE sql STABLE;

-- Medicines: admins podem INSERT/UPDATE/DELETE
CREATE POLICY "Admin pode criar medicamentos" ON medicines
  FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admin pode actualizar medicamentos" ON medicines
  FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin pode apagar medicamentos" ON medicines
  FOR DELETE USING (is_admin());

-- Pharmacies: admins podem INSERT/UPDATE/DELETE
CREATE POLICY "Admin pode criar farmácias" ON pharmacies
  FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admin pode actualizar farmácias" ON pharmacies
  FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin pode apagar farmácias" ON pharmacies
  FOR DELETE USING (is_admin());

-- Pharmacy stock: admins podem INSERT/DELETE
CREATE POLICY "Admin pode criar stock" ON pharmacy_stock
  FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admin pode apagar stock" ON pharmacy_stock
  FOR DELETE USING (is_admin());

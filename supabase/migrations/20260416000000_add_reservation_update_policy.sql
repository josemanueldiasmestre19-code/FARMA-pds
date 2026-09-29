-- Adiciona política para permitir UPDATE das próprias reservas (mudar status)
-- Corre este SQL no SQL Editor do Supabase

CREATE POLICY "Utilizador pode actualizar as suas reservas" ON reservations
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

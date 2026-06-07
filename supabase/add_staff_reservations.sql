-- Permitir que staff da farmácia veja e gira reservas da sua farmácia
-- Adiciona novo status 'aprovada' ao fluxo
-- Corre este SQL no SQL Editor do Supabase

-- 1. Permitir status 'aprovada' (além de pendente, concluida, cancelada)
-- A coluna status existente não tem CHECK por isso podemos usar livremente.
-- Apenas documentamos os valores válidos:
--   pendente   → cliente criou, à espera de aprovação da farmácia
--   aprovada   → farmácia confirmou stock e reservou para o cliente
--   concluida  → cliente levantou
--   cancelada  → cancelada (por cliente ou farmácia)

-- 2. Policy: staff vê reservas da sua farmácia
CREATE POLICY "Staff vê reservas da sua farmácia" ON reservations
  FOR SELECT USING (
    is_admin() OR pharmacy_id = user_pharmacy_id()
  );

-- 3. Policy: staff actualiza reservas da sua farmácia
CREATE POLICY "Staff actualiza reservas da sua farmácia" ON reservations
  FOR UPDATE USING (
    is_admin() OR pharmacy_id = user_pharmacy_id()
  ) WITH CHECK (
    is_admin() OR pharmacy_id = user_pharmacy_id()
  );

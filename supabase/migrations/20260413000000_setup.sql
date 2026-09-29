-- ============================================
-- Vonamed - Setup da base de dados Supabase
-- Corre este SQL no SQL Editor do Supabase
-- ============================================

-- 1. Tabela de medicamentos
CREATE TABLE medicines (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL
);

-- 2. Tabela de farmácias
CREATE TABLE pharmacies (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  hours TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  rating NUMERIC DEFAULT 0
);

-- 3. Tabela de stock (relação farmácia <-> medicamento)
CREATE TABLE pharmacy_stock (
  id SERIAL PRIMARY KEY,
  pharmacy_id INT NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  medicine_id INT NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  available BOOLEAN DEFAULT true,
  qty INT DEFAULT 0,
  UNIQUE (pharmacy_id, medicine_id)
);

-- 4. Tabela de reservas
CREATE TABLE reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medicine_id INT NOT NULL REFERENCES medicines(id),
  pharmacy_id INT NOT NULL REFERENCES pharmacies(id),
  medicine_name TEXT NOT NULL,
  pharmacy_name TEXT NOT NULL,
  pharmacy_address TEXT NOT NULL,
  price NUMERIC NOT NULL,
  status TEXT DEFAULT 'pendente',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Leitura pública para medicamentos, farmácias e stock
CREATE POLICY "Leitura pública de medicamentos" ON medicines FOR SELECT USING (true);
CREATE POLICY "Leitura pública de farmácias" ON pharmacies FOR SELECT USING (true);
CREATE POLICY "Leitura pública de stock" ON pharmacy_stock FOR SELECT USING (true);

-- Reservas: utilizador autenticado pode criar e ver as suas próprias
CREATE POLICY "Utilizador pode ver as suas reservas" ON reservations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Utilizador pode criar reservas" ON reservations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilizador pode apagar as suas reservas" ON reservations
  FOR DELETE USING (auth.uid() = user_id);

-- Stock: permitir update para utilizadores autenticados (dashboard)
CREATE POLICY "Update de stock por utilizadores autenticados" ON pharmacy_stock
  FOR UPDATE USING (true) WITH CHECK (true);

-- ============================================
-- Dados iniciais (seed)
-- ============================================

-- Medicamentos
INSERT INTO medicines (name, category, price) VALUES
  ('Paracetamol 500mg', 'Analgésico', 85),
  ('Amoxicilina 500mg', 'Antibiótico', 320),
  ('Losartan 50mg', 'Hipertensão', 450),
  ('Insulina Humana', 'Diabetes', 1200),
  ('Ibuprofeno 400mg', 'Anti-inflamatório', 150),
  ('Omeprazol 20mg', 'Gastro', 220),
  ('Metformina 850mg', 'Diabetes', 180),
  ('Salbutamol Inalador', 'Respiratório', 550);

-- Farmácias
INSERT INTO pharmacies (name, address, phone, hours, lat, lng, rating) VALUES
  ('Farmácia Central Maputo', 'Av. 25 de Setembro, Baixa, Maputo', '+258 21 123 456', '07:00 - 22:00', -25.9692, 32.5732, 4.8),
  ('Farmácia Sommerschield', 'Av. Kim Il Sung, Sommerschield, Maputo', '+258 21 491 234', '08:00 - 21:00', -25.9553, 32.5912, 4.6),
  ('Farmácia Polana', 'Av. Julius Nyerere, Polana, Maputo', '+258 21 490 888', '24 horas', -25.9633, 32.6008, 4.9),
  ('Farmácia Matola', 'Av. das Indústrias, Matola', '+258 21 720 555', '07:30 - 20:00', -25.9622, 32.4589, 4.4);

-- Stock (farmácia 1)
INSERT INTO pharmacy_stock (pharmacy_id, medicine_id, available, qty) VALUES
  (1, 1, true, 120), (1, 2, true, 45), (1, 3, true, 30), (1, 4, false, 0),
  (1, 5, true, 80), (1, 6, true, 60), (1, 7, false, 0), (1, 8, true, 15);

-- Stock (farmácia 2)
INSERT INTO pharmacy_stock (pharmacy_id, medicine_id, available, qty) VALUES
  (2, 1, true, 90), (2, 2, false, 0), (2, 3, true, 25), (2, 4, true, 8),
  (2, 5, true, 50), (2, 6, true, 40), (2, 7, true, 35), (2, 8, false, 0);

-- Stock (farmácia 3)
INSERT INTO pharmacy_stock (pharmacy_id, medicine_id, available, qty) VALUES
  (3, 1, true, 200), (3, 2, true, 70), (3, 3, true, 55), (3, 4, true, 20),
  (3, 5, true, 100), (3, 6, false, 0), (3, 7, true, 60), (3, 8, true, 25);

-- Stock (farmácia 4)
INSERT INTO pharmacy_stock (pharmacy_id, medicine_id, available, qty) VALUES
  (4, 1, true, 65), (4, 2, true, 30), (4, 3, false, 0), (4, 4, false, 0),
  (4, 5, true, 40), (4, 6, true, 20), (4, 7, true, 45), (4, 8, true, 10);

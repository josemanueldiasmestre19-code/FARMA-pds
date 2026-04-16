-- Sistema de avaliações das farmácias
-- Corre este SQL no SQL Editor do Supabase

CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pharmacy_id INT NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  user_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, pharmacy_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Leitura pública
CREATE POLICY "Leitura pública de avaliações" ON reviews FOR SELECT USING (true);

-- Utilizador pode criar a sua avaliação
CREATE POLICY "Utilizador pode avaliar" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Utilizador pode actualizar a sua avaliação
CREATE POLICY "Utilizador pode actualizar sua avaliação" ON reviews
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Utilizador pode apagar a sua avaliação
CREATE POLICY "Utilizador pode apagar sua avaliação" ON reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Activar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE reviews;

-- Função para calcular rating médio
CREATE OR REPLACE FUNCTION update_pharmacy_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE pharmacies
  SET rating = COALESCE(
    (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE pharmacy_id = COALESCE(NEW.pharmacy_id, OLD.pharmacy_id)),
    0
  )
  WHERE id = COALESCE(NEW.pharmacy_id, OLD.pharmacy_id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar rating automaticamente
CREATE TRIGGER trigger_update_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_pharmacy_rating();

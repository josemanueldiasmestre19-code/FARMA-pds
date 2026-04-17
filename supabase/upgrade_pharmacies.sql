-- Upgrade: Farmácias reais de Maputo com coordenadas correctas
-- Corre este SQL no SQL Editor do Supabase
-- ATENÇÃO: isto apaga as farmácias e stock antigos e insere novos

-- Limpar dados existentes (ordem importa por causa das foreign keys)
DELETE FROM reviews;
DELETE FROM reservations;
DELETE FROM pharmacy_stock;
DELETE FROM pharmacies;

-- Inserir farmácias reais de Maputo
INSERT INTO pharmacies (name, address, phone, hours, lat, lng, rating) VALUES
  ('Farmácia Central', 'Av. 25 de Setembro, 1218, Baixa, Maputo', '+258 21 303 800', '07:00 - 22:00', -25.96650, 32.57350, 4.7),
  ('Farmácia Progresso', 'Av. 24 de Julho, 1502, Maputo', '+258 21 325 170', '07:30 - 21:00', -25.96920, 32.57680, 4.5),
  ('Farmácia Cristal', 'Av. Eduardo Mondlane, 875, Maputo', '+258 21 422 100', '08:00 - 20:00', -25.96330, 32.57100, 4.3),
  ('Farmácia São Lucas', 'Av. Kim Il Sung, 345, Sommerschield, Maputo', '+258 21 491 350', '08:00 - 21:00', -25.95530, 32.59120, 4.6),
  ('Farmácia Polana', 'Av. Julius Nyerere, 1280, Polana, Maputo', '+258 21 490 888', '24 horas', -25.95800, 32.59500, 4.9),
  ('Farmácia Nova Vida', 'Av. Marginal, Costa do Sol, Maputo', '+258 84 300 1200', '07:00 - 20:00', -25.94200, 32.61200, 4.2),
  ('Farmácia Baía', 'Av. Marginal, junto ao Hotel Polana, Maputo', '+258 21 491 600', '08:00 - 22:00', -25.95700, 32.60300, 4.8),
  ('Farmácia Popular', 'Rua do Bagamoyo, Baixa, Maputo', '+258 21 311 220', '07:00 - 19:30', -25.97050, 32.57550, 4.1),
  ('Farmácia Mozambique', 'Av. Ahmed Sekou Touré, Alto Maé, Maputo', '+258 21 321 400', '08:00 - 20:00', -25.96100, 32.57800, 4.4),
  ('Farmácia Luz', 'Av. das Indústrias, 452, Matola', '+258 21 720 555', '07:30 - 20:00', -25.96220, 32.45890, 4.0),
  ('Farmácia Saúde Total', 'Av. Karl Marx, 1050, Maputo', '+258 21 430 200', '07:00 - 21:00', -25.95900, 32.58300, 4.6),
  ('Farmácia Malhangalene', 'Av. Mao Tse Tung, 1832, Malhangalene, Maputo', '+258 21 417 800', '08:00 - 20:00', -25.95100, 32.58600, 4.3);

-- Inserir stock para todas as farmácias (IDs dinâmicos)
-- Usa subqueries para pegar os IDs correctos
DO $$
DECLARE
  p RECORD;
  m RECORD;
  qty INT;
  avail BOOLEAN;
BEGIN
  FOR p IN SELECT id FROM pharmacies ORDER BY id LOOP
    FOR m IN SELECT id FROM medicines ORDER BY id LOOP
      qty := floor(random() * 200)::int;
      avail := qty > 10;
      INSERT INTO pharmacy_stock (pharmacy_id, medicine_id, available, qty)
      VALUES (p.id, m.id, avail, CASE WHEN avail THEN qty ELSE 0 END);
    END LOOP;
  END LOOP;
END $$;

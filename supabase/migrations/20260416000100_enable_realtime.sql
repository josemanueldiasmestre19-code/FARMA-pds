-- Activa Realtime para reservations e pharmacy_stock
-- Corre este SQL no SQL Editor do Supabase

ALTER PUBLICATION supabase_realtime ADD TABLE reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE pharmacy_stock;

-- ============================================================
-- Vonamed — Seed de demonstração (Maputo)
-- ============================================================
-- IDEMPOTENTE mas DESTRUTIVO para dados públicos: limpa medicamentos, farmácias,
-- stock, reservas, avaliações, pedidos e carteiras, e volta a inserir tudo.
-- Não toca em auth.users (só actualiza app_metadata das contas de demo).
--
-- Ordem:
--   1. SUPABASE_SERVICE_ROLE_KEY=... node supabase/scripts/seed-demo-users.mjs
--   2. supabase db query --linked -f supabase/seed.sql
--
-- IDs de farmácia mantidos estáveis (5–18) porque estão em app_metadata de contas reais.
-- ============================================================

BEGIN;

TRUNCATE wallet_transactions, wallets, reservations, reviews, pharmacy_applications,
         pharmacy_stock, pharmacies, medicines
  RESTART IDENTITY CASCADE;

-- ------------------------------------------------------------
-- Medicamentos (52) — preços em MZN
-- ------------------------------------------------------------
INSERT INTO medicines (id, name, category, price) VALUES
  (1,  'Paracetamol 500mg',                        'Analgésico',        85),
  (2,  'Paracetamol Xarope Infantil 120mg/5ml',    'Analgésico',        120),
  (3,  'Ibuprofeno 400mg',                         'Analgésico',        150),
  (4,  'Diclofenac 50mg',                          'Analgésico',        130),
  (5,  'Aspirina 500mg',                           'Analgésico',        95),
  (6,  'Tramadol 50mg',                            'Analgésico',        380),
  (7,  'Amoxicilina 500mg',                        'Antibiótico',       320),
  (8,  'Amoxicilina + Ác. Clavulânico 875mg',      'Antibiótico',       650),
  (9,  'Azitromicina 500mg',                       'Antibiótico',       480),
  (10, 'Ciprofloxacina 500mg',                     'Antibiótico',       350),
  (11, 'Metronidazol 400mg',                       'Antibiótico',       160),
  (12, 'Cotrimoxazol 480mg',                       'Antibiótico',       140),
  (13, 'Doxiciclina 100mg',                        'Antibiótico',       260),
  (14, 'Cefalexina 500mg',                         'Antibiótico',       420),
  (15, 'Coartem (Artemeter + Lumefantrina)',       'Antimalárico',      520),
  (16, 'Artesunato Injectável 60mg',               'Antimalárico',      890),
  (17, 'Quinino 300mg',                            'Antimalárico',      340),
  (18, 'Fansidar (Sulfadoxina-Pirimetamina)',      'Antimalárico',      180),
  (19, 'Metformina 850mg',                         'Diabetes',          180),
  (20, 'Glibenclamida 5mg',                        'Diabetes',          120),
  (21, 'Insulina Humana NPH 100UI/ml',             'Diabetes',          1200),
  (22, 'Insulina Humana Regular 100UI/ml',         'Diabetes',          1150),
  (23, 'Losartan 50mg',                            'Hipertensão',       450),
  (24, 'Amlodipina 5mg',                           'Hipertensão',       210),
  (25, 'Hidroclorotiazida 25mg',                   'Hipertensão',       110),
  (26, 'Enalapril 10mg',                           'Hipertensão',       190),
  (27, 'Atenolol 50mg',                            'Hipertensão',       170),
  (28, 'Omeprazol 20mg',                           'Gastro',            220),
  (29, 'SRO — Sais de Reidratação Oral',           'Gastro',            45),
  (30, 'Loperamida 2mg',                           'Gastro',            95),
  (31, 'Metoclopramida 10mg',                      'Gastro',            130),
  (32, 'Ranitidina 150mg',                         'Gastro',            160),
  (33, 'Salbutamol Inalador 100mcg',               'Respiratório',      550),
  (34, 'Beclometasona Inalador 250mcg',            'Respiratório',      720),
  (35, 'Ambroxol Xarope 30mg/5ml',                 'Respiratório',      210),
  (36, 'Loratadina 10mg',                          'Respiratório',      140),
  (37, 'Cetirizina 10mg',                          'Respiratório',      130),
  (38, 'Ácido Fólico 5mg',                         'Vitaminas',         60),
  (39, 'Sulfato Ferroso 200mg',                    'Vitaminas',         75),
  (40, 'Vitamina C 500mg',                         'Vitaminas',         110),
  (41, 'Multivitamínico Adulto',                   'Vitaminas',         250),
  (42, 'Zinco 20mg',                               'Vitaminas',         90),
  (43, 'Clotrimazol Creme 1%',                     'Dermatológico',     180),
  (44, 'Permetrina Loção 1%',                      'Dermatológico',     260),
  (45, 'Hidrocortisona Creme 1%',                  'Dermatológico',     230),
  (46, 'Microgynon (contraceptivo oral)',          'Saúde da Mulher',   150),
  (47, 'Preservativos (caixa 12)',                 'Saúde da Mulher',   120),
  (48, 'Teste de Gravidez',                        'Saúde da Mulher',   180),
  (49, 'Mebendazol 100mg',                         'Antiparasitário',   70),
  (50, 'Albendazol 400mg',                         'Antiparasitário',   85),
  (51, 'Álcool Gel 500ml',                         'Higiene',           250),
  (52, 'Soro Fisiológico 0,9% 500ml',              'Higiene',           140);
SELECT setval('medicines_id_seq', (SELECT MAX(id) FROM medicines));

-- ------------------------------------------------------------
-- Farmácias (14) — bairros reais de Maputo e Matola
-- ------------------------------------------------------------
INSERT INTO pharmacies (id, name, address, phone, hours, lat, lng, rating, contact_email) VALUES
  (5,  'Farmácia Central',      'Av. 25 de Setembro, 1218, Baixa, Maputo',              '+258 21 303 800', '07:00 - 22:00', -25.96650, 32.57350, 4.7, 'central@vonamed.mz'),
  (6,  'Farmácia Progresso',    'Av. 24 de Julho, 1502, Maputo',                         '+258 21 325 170', '07:30 - 21:00', -25.96920, 32.57680, 4.5, 'progresso@vonamed.mz'),
  (7,  'Farmácia Cristal',      'Av. Eduardo Mondlane, 875, Maputo',                     '+258 21 422 100', '08:00 - 20:00', -25.96330, 32.57100, 4.3, 'cristal@vonamed.mz'),
  (8,  'Farmácia São Lucas',    'Av. Kim Il Sung, 345, Sommerschield, Maputo',           '+258 21 491 350', '08:00 - 21:00', -25.95530, 32.59120, 4.6, 'saolucas@vonamed.mz'),
  (9,  'Farmácia Polana',       'Av. Julius Nyerere, 1280, Polana, Maputo',              '+258 21 490 888', '24 horas',      -25.95800, 32.59500, 4.9, 'farmacia.demo@vonamed.mz'),
  (10, 'Farmácia Nova Vida',    'Av. Marginal, Costa do Sol, Maputo',                    '+258 84 300 1200', '07:00 - 20:00', -25.94200, 32.61200, 4.2, 'novavida@vonamed.mz'),
  (11, 'Farmácia Baía',         'Av. Marginal, junto ao Hotel Polana, Maputo',           '+258 21 491 600', '08:00 - 22:00', -25.95700, 32.60300, 4.8, 'baia@vonamed.mz'),
  (12, 'Farmácia Popular',      'Rua do Bagamoyo, Baixa, Maputo',                        '+258 21 311 220', '07:00 - 19:30', -25.97050, 32.57550, 4.1, 'popular@vonamed.mz'),
  (13, 'Farmácia Moçambique',   'Av. Ahmed Sekou Touré, Alto Maé, Maputo',               '+258 21 321 400', '08:00 - 20:00', -25.96450, 32.56800, 4.4, 'mocambique@vonamed.mz'),
  (14, 'Farmácia Luz',          'Av. das Indústrias, 452, Matola',                       '+258 21 720 555', '07:30 - 20:00', -25.96220, 32.45890, 4.0, 'luz@vonamed.mz'),
  (15, 'Farmácia Saúde Total',  'Av. Karl Marx, 1050, Maputo',                           '+258 21 430 200', '07:00 - 21:00', -25.95900, 32.58300, 4.6, 'saudetotal@vonamed.mz'),
  (16, 'Farmácia Malhangalene', 'Av. Mao Tse Tung, 1832, Malhangalene, Maputo',          '+258 21 417 800', '08:00 - 20:00', -25.95100, 32.58600, 4.3, 'malhangalene@vonamed.mz'),
  (17, 'Farmácia Zimpeto',      'Av. de Moçambique, junto ao Mercado, Zimpeto, Maputo',  '+258 84 512 3340', '07:00 - 21:00', -25.86500, 32.58300, 4.2, 'zimpeto@vonamed.mz'),
  (18, 'Farmácia Machava',      'Av. de Moçambique, Machava-Sede, Matola',               '+258 86 771 0045', '07:30 - 20:30', -25.91800, 32.50100, 4.1, 'machava@vonamed.mz');
SELECT setval('pharmacies_id_seq', (SELECT MAX(id) FROM pharmacies));

-- ------------------------------------------------------------
-- Stock: determinístico (idempotente), ~15% em rotura
-- ------------------------------------------------------------
INSERT INTO pharmacy_stock (pharmacy_id, medicine_id, available, qty)
SELECT p.id, m.id,
       q > 0,
       q
FROM pharmacies p
CROSS JOIN medicines m
CROSS JOIN LATERAL (
  SELECT CASE WHEN ((p.id * 7 + m.id * 13 + 5) % 97) % 6 = 0 THEN 0
              ELSE (p.id * 7 + m.id * 13 + 5) % 97 END AS q
) s;

-- Injectáveis e insulinas: stock mais baixo
UPDATE pharmacy_stock SET qty = LEAST(qty, 12) WHERE medicine_id IN (16, 21, 22) AND qty > 0;

-- Garantir que os medicamentos usados na demo estão disponíveis na Farmácia Polana
UPDATE pharmacy_stock SET available = true, qty = GREATEST(qty, 25)
WHERE pharmacy_id = 9 AND medicine_id IN (1, 7, 15, 19, 21, 28, 29, 33);

-- ------------------------------------------------------------
-- Contas de demo: papéis
-- ------------------------------------------------------------
UPDATE auth.users SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
  WHERE email = 'admin.demo@vonamed.mz';
UPDATE auth.users SET raw_app_meta_data = (COALESCE(raw_app_meta_data, '{}'::jsonb) - 'role') || '{"pharmacy_id":9}'::jsonb
  WHERE email = 'farmacia.demo@vonamed.mz';
UPDATE auth.users SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) - 'role' - 'pharmacy_id'
  WHERE email IN ('cliente.demo@vonamed.mz', 'cliente2.demo@vonamed.mz',
                  'pendente.demo@vonamed.mz', 'pendente2.demo@vonamed.mz');

-- ------------------------------------------------------------
-- Pedidos de registo de farmácia
-- ------------------------------------------------------------
INSERT INTO pharmacy_applications
  (user_id, pharmacy_name, address, phone, hours, lat, lng, license_number, owner_name, owner_phone, notes, status, created_at)
VALUES
  ((SELECT id FROM auth.users WHERE email = 'pendente.demo@vonamed.mz'),
   'Farmácia Bairro Central', 'Av. Vladimir Lenine, 2310, Bairro Central, Maputo', '+258 21 300 415', '07:30 - 21:00',
   -25.96000, 32.58000, '400123456', 'Sérgio Nhantumbo', '+258 84 221 9087',
   'Farmácia com laboratório de análises anexo. Alvará nº 1287/2024.', 'pending', now() - interval '2 days'),
  ((SELECT id FROM auth.users WHERE email = 'pendente2.demo@vonamed.mz'),
   'Farmácia Xipamanine', 'Rua de Xipamanine, junto ao Mercado, Xipamanine, Maputo', '+258 87 455 1120', '07:00 - 20:00',
   -25.94900, 32.56200, '400987321', 'Lurdes Cossa', '+258 87 455 1120',
   NULL, 'pending', now() - interval '5 hours'),
  ((SELECT id FROM auth.users WHERE email = 'cliente2.demo@vonamed.mz'),
   'Drogaria Tembe', 'Av. Angola, Hulene, Maputo', '+258 82 100 2003', '08:00 - 18:00',
   -25.92800, 32.59000, '000000000', 'Carlos Tembe', '+258 82 100 2003',
   NULL, 'rejected', now() - interval '12 days');
UPDATE pharmacy_applications SET rejection_reason = 'NUIT inválido. Por favor submeta o número de alvará da farmácia.',
  reviewed_at = now() - interval '11 days'
  WHERE status = 'rejected';

-- ------------------------------------------------------------
-- Avaliações (o trigger recalcula o rating destas farmácias)
-- ------------------------------------------------------------
INSERT INTO reviews (user_id, pharmacy_id, rating, comment, user_name, created_at) VALUES
  ((SELECT id FROM auth.users WHERE email = 'cliente.demo@vonamed.mz'),  9, 5, 'Atendimento rápido e o medicamento estava mesmo reservado. Recomendo.', 'Ana Macuácua', now() - interval '6 days'),
  ((SELECT id FROM auth.users WHERE email = 'cliente2.demo@vonamed.mz'), 9, 5, 'Aberta 24h, salvou-me numa emergência à noite.', 'Carlos Tembe', now() - interval '1 day'),
  ((SELECT id FROM auth.users WHERE email = 'cliente.demo@vonamed.mz'),  5, 4, 'Boa localização na Baixa, mas fila ao almoço.', 'Ana Macuácua', now() - interval '2 days'),
  ((SELECT id FROM auth.users WHERE email = 'cliente2.demo@vonamed.mz'), 8, 5, 'Sempre têm insulina em stock.', 'Carlos Tembe', now() - interval '9 days'),
  ((SELECT id FROM auth.users WHERE email = 'cliente.demo@vonamed.mz'), 15, 4, NULL, 'Ana Macuácua', now() - interval '4 days');

-- ------------------------------------------------------------
-- Reservas em vários estados + carteiras consistentes
-- ------------------------------------------------------------
INSERT INTO wallets (is_platform) VALUES (true);

DO $$
DECLARE
  u1 UUID := (SELECT id FROM auth.users WHERE email = 'cliente.demo@vonamed.mz');
  u2 UUID := (SELECT id FROM auth.users WHERE email = 'cliente2.demo@vonamed.mz');
  rec RECORD;
  r reservations%ROWTYPE;
  platform_wallet UUID := (SELECT id FROM wallets WHERE is_platform);
  pharm_wallet UUID;
BEGIN
  -- (user, medicine, pharmacy, status, method, created_at)
  FOR rec IN
    SELECT * FROM (VALUES
      (u1, 1,  9,  'pendente',  'mpesa', now() - interval '40 minutes'),
      (u1, 15, 9,  'aprovada',  'emola', now() - interval '3 hours'),
      (u1, 7,  5,  'concluida', 'mpesa', now() - interval '2 days'),
      (u1, 19, 8,  'concluida', 'mpesa', now() - interval '6 days'),
      (u1, 23, 15, 'cancelada', 'emola', now() - interval '4 days'),
      (u1, 28, 9,  'aprovada',  'mpesa', now() - interval '30 hours'),   -- expirada (>24h)
      (u2, 21, 9,  'pendente',  'mpesa', now() - interval '15 minutes'),
      (u2, 29, 9,  'concluida', 'emola', now() - interval '1 day'),
      (u2, 33, 6,  'pendente',  'emola', now() - interval '2 hours')
    ) AS t(user_id, medicine_id, pharmacy_id, status, method, created_at)
  LOOP
    INSERT INTO reservations (user_id, medicine_id, medicine_name, pharmacy_id, pharmacy_name, pharmacy_address,
                              price, status, commission, total_paid, payment_method, payment_status, created_at)
    SELECT rec.user_id, m.id, m.name, p.id, p.name, p.address,
           m.price, rec.status, calculate_commission(m.price), m.price + calculate_commission(m.price),
           rec.method, 'completed', rec.created_at
    FROM medicines m, pharmacies p
    WHERE m.id = rec.medicine_id AND p.id = rec.pharmacy_id
    RETURNING * INTO r;

    -- Carteira da farmácia
    INSERT INTO wallets (pharmacy_id, is_platform) VALUES (r.pharmacy_id, false)
    ON CONFLICT (pharmacy_id) WHERE pharmacy_id IS NOT NULL DO NOTHING;
    SELECT id INTO pharm_wallet FROM wallets WHERE pharmacy_id = r.pharmacy_id;

    UPDATE wallets SET balance = balance + r.price, total_earned = total_earned + r.price WHERE id = pharm_wallet;
    INSERT INTO wallet_transactions (wallet_id, type, amount, payment_method, reservation_id, description, created_at)
    VALUES (pharm_wallet, 'payment_in', r.price, r.payment_method, r.id, 'Pagamento: ' || r.medicine_name, r.created_at);

    IF r.commission > 0 THEN
      UPDATE wallets SET balance = balance + r.commission, total_earned = total_earned + r.commission WHERE id = platform_wallet;
      INSERT INTO wallet_transactions (wallet_id, type, amount, payment_method, reservation_id, description, created_at)
      VALUES (platform_wallet, 'commission_in', r.commission, 'commission', r.id,
              'Comissão: ' || r.medicine_name || ' (' || r.pharmacy_name || ')', r.created_at);
    END IF;

    -- Cancelada → reembolso (o trigger não dispara em INSERT, por isso é feito aqui)
    IF r.status = 'cancelada' THEN
      UPDATE wallets SET balance = balance - r.price, total_earned = total_earned - r.price WHERE id = pharm_wallet;
      INSERT INTO wallet_transactions (wallet_id, type, amount, payment_method, reservation_id, description, created_at)
      VALUES (pharm_wallet, 'refund_out', r.price, r.payment_method, r.id, 'Reembolso: ' || r.medicine_name, r.created_at + interval '1 hour');
      IF r.commission > 0 THEN
        UPDATE wallets SET balance = balance - r.commission, total_earned = total_earned - r.commission WHERE id = platform_wallet;
        INSERT INTO wallet_transactions (wallet_id, type, amount, payment_method, reservation_id, description, created_at)
        VALUES (platform_wallet, 'refund_out', r.commission, 'commission', r.id, 'Reembolso comissão: ' || r.medicine_name, r.created_at + interval '1 hour');
      END IF;
      UPDATE reservations SET payment_status = 'refunded' WHERE id = r.id;
    END IF;
  END LOOP;

  -- Levantamento histórico da Farmácia Polana
  SELECT id INTO pharm_wallet FROM wallets WHERE pharmacy_id = 9;
  UPDATE wallets SET balance = balance - 1500, total_withdrawn = total_withdrawn + 1500 WHERE id = pharm_wallet;
  INSERT INTO wallet_transactions (wallet_id, type, amount, payment_method, description, created_at)
  VALUES (pharm_wallet, 'withdrawal', 1500, 'mpesa', 'Levantamento para M-Pesa', now() - interval '1 day');
END $$;

COMMIT;

-- Resumo
SELECT (SELECT count(*) FROM medicines) medicamentos,
       (SELECT count(*) FROM pharmacies) farmacias,
       (SELECT count(*) FROM pharmacy_stock WHERE available) stock_disponivel,
       (SELECT count(*) FROM reservations) reservas,
       (SELECT count(*) FROM pharmacy_applications WHERE status = 'pending') pedidos_pendentes,
       (SELECT balance FROM wallets WHERE pharmacy_id = 9) saldo_polana,
       (SELECT balance FROM wallets WHERE is_platform) saldo_vonamed;

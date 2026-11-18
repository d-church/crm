-- Домашня група Микити, четверо новозаведених і одне прізвище після заміжжя.
--
-- Продовження 20261118120000: там чотирьох людей зі списків не знайшлося в базі,
-- тут вони заводяться. Двоє з прізвищем, двоє — ні: у таких прізвище-заглушка
-- каже, з чиєї домашки людина, щоб її було кому уточнити.
--
-- Безпечно при повторному застосуванні: усе пишеться за збігом імені.

-- 1. Четверо зі списків, яких у базі не було -----------------------------------
INSERT INTO "people" (
  "id", "first_name", "last_name", "membership", "activity",
  "home_group_id", "home_group_role", "created_at", "updated_at"
)
SELECT gen_random_uuid()::text, v."first_name", v."last_name", 'ATTENDER', 'ACTIVE',
       (SELECT "id" FROM "home_groups" WHERE "name" = v."group_name"),
       v."role"::"home_group_roles", now(), now()
FROM (VALUES
  ('Даниїл'::text, 'Котоній'::text,       'Домашня група Кирила'::text, 'IRREGULAR'::text),
  ('Марія',        'Сапєгіна',            'Домашня група Тоні',         'REGULAR'),
  ('Святослав',    'домашка "Єгор"',      'Домашня група Єгора',        'REGULAR'),
  ('Віра',         'домашка "Тоня"',      'Домашня група Тоні',         'IRREGULAR')
) AS v("first_name", "last_name", "group_name", "role")
WHERE NOT EXISTS (
  SELECT 1 FROM "people" p
  WHERE p."first_name" = v."first_name" AND coalesce(p."last_name", '') = v."last_name"
);

-- 2. Заміжжя: Анна Штереб тепер Леньо -------------------------------------------
UPDATE "people"
SET "last_name" = 'Леньо', "updated_at" = now()
WHERE "first_name" = 'Анна' AND "last_name" = 'Штереб';

-- 3. Її чоловік, якого в базі ще немає -------------------------------------------
INSERT INTO "people" ("id", "first_name", "last_name", "membership", "activity", "created_at", "updated_at")
SELECT gen_random_uuid()::text, 'Іван', 'Леньо', 'ATTENDER', 'ACTIVE', now(), now()
WHERE NOT EXISTS (
  SELECT 1 FROM "people" WHERE "first_name" = 'Іван' AND "last_name" = 'Леньо'
);

-- 4. Нова домашня група ----------------------------------------------------------
INSERT INTO "home_groups" ("id", "name", "leader_id", "created_at", "updated_at")
SELECT gen_random_uuid()::text, 'Домашня група Микити',
       (SELECT "id" FROM "people" WHERE "first_name" = 'Микита' AND "last_name" = 'Цупік' LIMIT 1),
       now(), now()
WHERE NOT EXISTS (SELECT 1 FROM "home_groups" WHERE "name" = 'Домашня група Микити');

-- Склад групи. Ролі не проставляємо: про регулярність цих людей даних немає,
-- а вигадувати її означало б підсунути лідеру вигадку замість порожнього поля.
UPDATE "people" p
SET "home_group_id" = (SELECT "id" FROM "home_groups" WHERE "name" = 'Домашня група Микити'),
    "updated_at" = now()
FROM (VALUES
  ('Анастасія'::text, 'Цупік'::text),
  ('Богдан',          'Зінченко'),
  ('Альона',          'Зінченко'),
  ('Артур',           'Нікулін'),
  ('Євгенія',         'Нікуліна'),
  ('Анна',            'Леньо'),
  ('Іван',            'Леньо'),
  ('Василь',          'Штереб'),
  ('Юлія',            'Штереб')
) AS v("first_name", "last_name")
WHERE p."first_name" = v."first_name" AND p."last_name" = v."last_name";

-- 5. Гілка церкви ----------------------------------------------------------------
-- Решта групи Микити вже в D.Youth; сюди потрапляють лише щойно заведені.
INSERT INTO "_CommunityToPerson" ("A", "B")
SELECT (SELECT "id" FROM "communities" WHERE "name" = 'D.Youth'), p."id"
FROM "people" p
WHERE (p."first_name", coalesce(p."last_name", '')) IN (
  ('Даниїл', 'Котоній'), ('Марія', 'Сапєгіна'),
  ('Святослав', 'домашка "Єгор"'), ('Віра', 'домашка "Тоня"'), ('Іван', 'Леньо')
)
ON CONFLICT DO NOTHING;

-- 6. Опіка -----------------------------------------------------------------------
-- Те саме правило, що й у попередній міграції: автоматична опіка ходить за участю.
UPDATE "person_cares" c
SET "until" = now(), "updated_at" = now()
FROM "people" p
WHERE c."person_id" = p."id"
  AND c."origin" = 'HOME_GROUP'
  AND c."until" IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM "home_groups" h
    WHERE h."id" = p."home_group_id" AND h."leader_id" = c."caregiver_id"
  );

INSERT INTO "person_cares" ("id", "person_id", "caregiver_id", "origin", "since", "created_at", "updated_at")
SELECT gen_random_uuid()::text, p."id", h."leader_id", 'HOME_GROUP'::"care_origins", now(), now(), now()
FROM "people" p
JOIN "home_groups" h ON h."id" = p."home_group_id"
WHERE h."leader_id" IS NOT NULL
  AND p."id" <> h."leader_id"
  AND NOT EXISTS (
    SELECT 1 FROM "person_cares" c
    WHERE c."person_id" = p."id" AND c."caregiver_id" = h."leader_id" AND c."until" IS NULL
  );

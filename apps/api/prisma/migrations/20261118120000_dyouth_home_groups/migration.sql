-- Склад домашніх груп D.Youth, опіка лідерів і доступи для них.
--
-- Джерело — «D.youth groups.xlsx», по аркушу на лідера. Людей до карток
-- зіставлено за імʼям і прізвищем; зменшувальні розкрито руками («Вова» —
-- Володимир, «Ваня» — Іван, «Ліза» — Єлизавета і так далі), бо автоматично
-- такий збіг не знаходиться.
--
-- Міграція безпечна при повторному застосуванні: усе пишеться за збігом імені,
-- а опіка й доступи додаються лише там, де їх ще немає.

-- 1. Люди в групи -------------------------------------------------------------
WITH roster("group_name", "first_name", "last_name", "birth_year", "role") AS (
  VALUES
    ('Домашня група Кирила'::text, 'Діана'::text, 'Даниляк'::text, NULL::int, 'REGULAR'::text),
    ('Домашня група Кирила', 'Ніколь', 'Файфар', NULL, 'REGULAR'),
    ('Домашня група Кирила', 'Артур', 'Даниляк', NULL, 'HELPER'),
    ('Домашня група Кирила', 'Наталія', 'Вергун', NULL, 'HELPER'),
    ('Домашня група Кирила', 'Володимир', 'Злотніков', 2012, 'IRREGULAR'),
    ('Домашня група Кирила', 'Софія', 'Хороленко', NULL, 'IRREGULAR'),
    ('Домашня група Кирила', 'Анна', 'Грифель', NULL, 'IRREGULAR'),
    ('Домашня група Кирила', 'Олег', 'Залізняк', NULL, 'IRREGULAR'),
    ('Домашня група Кирила', 'Валерія', 'Воробей', NULL, 'IRREGULAR'),
    ('Домашня група Софії', 'Микола', 'Федюк', NULL, 'HELPER'),
    ('Домашня група Софії', 'Іван', 'Куспись', NULL, 'HELPER'),
    ('Домашня група Софії', 'Софія', 'Ценюх', NULL, 'HELPER'),
    ('Домашня група Софії', 'Анна', 'Жураківська', NULL, 'REGULAR'),
    ('Домашня група Софії', 'Ія', 'Козюра', NULL, 'REGULAR'),
    ('Домашня група Софії', 'Валерія', 'Венчковська', NULL, 'REGULAR'),
    ('Домашня група Софії', 'Анастасія', 'Фещенко', NULL, 'REGULAR'),
    ('Домашня група Софії', 'Квітка', 'Ганчук', NULL, 'REGULAR'),
    ('Домашня група Софії', 'Левко', 'Ганчук', NULL, 'REGULAR'),
    ('Домашня група Софії', 'Остап', 'Марко', NULL, 'REGULAR'),
    ('Домашня група Софії', 'Максим', 'Марко', NULL, 'REGULAR'),
    ('Домашня група Софії', 'Вероніка', 'Малюк', NULL, 'REGULAR'),
    ('Домашня група Софії', 'Наталія', 'Куспись', NULL, 'IRREGULAR'),
    ('Домашня група Софії', 'Олег', 'Тютіков', NULL, 'IRREGULAR'),
    ('Домашня група Софії', 'Шерон-Жанна', 'Гончарук', NULL, 'IRREGULAR'),
    ('Домашня група Софії', 'Юлія', 'Мандзюк', NULL, 'IRREGULAR'),
    ('Домашня група Єгора', 'Андрій', 'Рончковський', NULL, 'REGULAR'),
    ('Домашня група Єгора', 'Юрій', 'Хвищук', NULL, 'REGULAR'),
    ('Домашня група Єгора', 'Семен', 'Янишин', NULL, 'REGULAR'),
    ('Домашня група Єгора', 'Назар', 'Мартинець', NULL, 'REGULAR'),
    ('Домашня група Єгора', 'Олена', 'Синицька', NULL, 'REGULAR'),
    ('Домашня група Єгора', 'Вероніка', 'Антонова', NULL, 'REGULAR'),
    ('Домашня група Єгора', 'Ярослав', 'Залізняк', NULL, 'IRREGULAR'),
    ('Домашня група Єгора', 'Каміла', 'Баціц', NULL, 'IRREGULAR'),
    ('Домашня група Єгора', 'Юрій', 'Кузьо', NULL, 'IRREGULAR'),
    ('Домашня група Тоні', 'Тимофій', 'Виноградов', NULL, 'REGULAR'),
    ('Домашня група Тоні', 'Вікторія', 'Сапєгіна', NULL, 'REGULAR'),
    ('Домашня група Тоні', 'Дмитро', 'Залізняк', NULL, 'REGULAR'),
    ('Домашня група Тоні', 'Марія', 'Бігузас', NULL, 'REGULAR'),
    ('Домашня група Тоні', 'Тетяна', 'Роман', NULL, 'REGULAR'),
    ('Домашня група Тоні', 'Єлизавета', 'Голубенко', NULL, 'REGULAR'),
    ('Домашня група Олексія', 'Андрій', 'Татач', NULL, 'REGULAR'),
    ('Домашня група Олексія', 'Ілона', 'Борщ', NULL, 'REGULAR'),
    ('Домашня група Олексія', 'Амелі', 'Шевченко', NULL, 'REGULAR'),
    ('Домашня група Олексія', 'Валерія', 'Літовщук', NULL, 'REGULAR'),
    ('Домашня група Олексія', 'Ілона', 'Дорош', NULL, 'REGULAR'),
    ('Домашня група Олексія', 'Ігор', 'Джох', NULL, 'REGULAR'),
    ('Домашня група Олексія', 'Богдан', 'Бугиль', NULL, 'REGULAR'),
    ('Домашня група Олексія', 'Данило', 'Гаджа', NULL, 'REGULAR'),
    ('Домашня група Олексія', 'Марта', 'Бугиль', NULL, 'HELPER'),
    ('Домашня група Олексія', 'Іван', 'Мотуз', NULL, 'IRREGULAR'),
    ('Домашня група Олексія', 'Маріам-Анна', 'Мотуз', NULL, 'IRREGULAR'),
    ('Домашня група Олексія', 'Дмитро', 'Галіздра', NULL, 'IRREGULAR'),
    ('Домашня група Олексія', 'Каміла', 'Камолова', NULL, 'IRREGULAR')),
resolved AS (
  SELECT
    r."role",
    (SELECT h."id" FROM "home_groups" h WHERE h."name" = r."group_name") AS "group_id",
    -- Рік народження потрібен лише там, де в базі є повний тезка: Володимирів
    -- Злотнікових двоє, батько й син.
    (SELECT p."id" FROM "people" p
      WHERE lower(p."first_name") = lower(r."first_name")
        AND lower(coalesce(p."last_name", '')) = lower(coalesce(r."last_name", ''))
        AND (r."birth_year" IS NULL OR extract(year FROM p."birth_date") = r."birth_year")
      LIMIT 1) AS "person_id"
  FROM roster r
)
UPDATE "people" p
SET "home_group_id" = x."group_id",
    "home_group_role" = x."role"::"home_group_roles",
    "updated_at" = now()
FROM resolved x
WHERE p."id" = x."person_id" AND x."group_id" IS NOT NULL;

-- 2. Двоє, кого в базі немає й чийого прізвища лідер не знає ------------------
-- Прізвище-заглушка каже, звідки людина, щоб її було кому уточнити.
INSERT INTO "people" (
  "id", "first_name", "last_name", "membership", "activity",
  "home_group_id", "home_group_role", "created_at", "updated_at"
)
SELECT gen_random_uuid()::text, v."first_name", v."last_name", 'ATTENDER', 'ACTIVE',
       (SELECT "id" FROM "home_groups" WHERE "name" = 'Домашня група Тоні'),
       'REGULAR'::"home_group_roles", now(), now()
FROM (VALUES ('Адрі'::text, 'домашка "Тоня"'::text), ('Мілена', 'домашка "Тоня"')) AS v("first_name", "last_name")
WHERE NOT EXISTS (
  SELECT 1 FROM "people" p
  WHERE p."first_name" = v."first_name" AND p."last_name" = v."last_name"
);

-- Вони теж мають належати гілці церкви, інакше випадуть з обох сегментів.
INSERT INTO "_CommunityToPerson" ("A", "B")
SELECT (SELECT "id" FROM "communities" WHERE "name" = 'D.Youth'), p."id"
FROM "people" p
WHERE p."last_name" = 'домашка "Тоня"'
ON CONFLICT DO NOTHING;

-- 3. Опіка ---------------------------------------------------------------------
-- Спершу закриваємо застарілу: автоматична опіка ходить за участю, тож людина,
-- яку перевели в іншу групу, більше не підопічна колишньому лідеру. Призначену
-- вручну не чіпаємо — вона від групи не залежить.
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

-- Лідер домашньої групи — попечитель її учасників --------------------------------
-- Це правило моделі, а не вибір: саме опіка відкриває пасторський шар картки.
INSERT INTO "person_cares" ("id", "person_id", "caregiver_id", "origin", "since", "created_at", "updated_at")
SELECT gen_random_uuid()::text, p."id", h."leader_id", 'HOME_GROUP'::"care_origins", now(), now(), now()
FROM "people" p
JOIN "home_groups" h ON h."id" = p."home_group_id"
WHERE h."name" IN ('Домашня група Кирила', 'Домашня група Софії', 'Домашня група Єгора',
                   'Домашня група Тоні', 'Домашня група Олексія')
  AND h."leader_id" IS NOT NULL
  AND p."id" <> h."leader_id"
  AND NOT EXISTS (
    SELECT 1 FROM "person_cares" c
    WHERE c."person_id" = p."id" AND c."caregiver_id" = h."leader_id" AND c."until" IS NULL
  );

-- 4. Облікові записи лідерів ---------------------------------------------------
-- Роль LEADER плюс область «своя домашня група» означає рівно те, що треба:
-- лідер бачить свою групу й нікого поза нею. Звʼязок із карткою обовʼязковий —
-- без нього не працює опіка, а отже й пасторський шар його ж людей.
--
-- Пароль спільний стартовий, його міняють при першому вході. Хеш лежить тут
-- відкрито: сам пароль однаково буде відомий пʼятьом людям, тож таємниці він
-- не додає — але й не захищає, поки його не змінили.
WITH leaders("email", "first_name", "last_name", "group_name") AS (
  VALUES
    ('oleksii.uzhva@gmail.com'::text, 'Олексій'::text, 'Ужва'::text, 'Домашня група Олексія'::text),
    ('sofaivanovych@gmail.com', 'Софія', 'Іванович', 'Домашня група Софії'),
    ('ivakhnenkokiril@gmail.com', 'Кирил', 'Івахненко', 'Домашня група Кирила'),
    ('ehorkislov1@gmail.com', 'Єгор', 'Кіслов', 'Домашня група Єгора'),
    ('tgavryschyshyn@gmail.com', 'Антоніна', 'Гаврищишин', 'Домашня група Тоні')
),
created AS (
  INSERT INTO "users" (
    "id", "email", "password", "first_name", "last_name",
    "role", "roles", "person_id", "created_at", "updated_at"
  )
  SELECT
    gen_random_uuid()::text, l."email",
    '$argon2id$v=19$m=65536,p=4,t=3$WBoENSAeHi0e1/uMnz8YTg$tAkHTW4fAg+pAoL/nTOZSIU42COQUxn/w66+bKugqjU',
    l."first_name", l."last_name",
    'LEADER'::"roles", ARRAY['LEADER']::"roles"[],
    (SELECT h."leader_id" FROM "home_groups" h WHERE h."name" = l."group_name"),
    now(), now()
  FROM leaders l
  WHERE NOT EXISTS (SELECT 1 FROM "users" u WHERE u."email" = l."email")
  RETURNING "id", "email"
)
-- Область: та сама домашня група, яку людина веде.
INSERT INTO "user_scopes" ("id", "user_id", "home_group_id", "level", "created_at", "updated_at")
SELECT gen_random_uuid()::text, c."id", h."id", 'VIEW'::"scope_levels", now(), now()
FROM created c
JOIN leaders l ON l."email" = c."email"
JOIN "home_groups" h ON h."name" = l."group_name";

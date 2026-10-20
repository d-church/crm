-- Спільнота D.Young і список підлітків.
--
-- D.Young був служінням, хоч за змістом це спільнота: власна група зі своїм
-- лідером. Тут він перекваліфіковується — лідер переїжджає в поле спільноти,
-- а служіння прибирається, якщо на ньому не висить нічого, крім лідерства.
--
-- Підлітки заводяться у дві спільноти, D.Young і D.Youth: D.Young не
-- відгалуження, тож інакше вони випали б з обох гілок церкви й не були б
-- видимі в перемикачі сегментів ніде.
--
-- Міграція безпечна при повторному застосуванні: людина шукається за імʼям,
-- і якщо вже є — їй лише додається спільнота. Джерело — «підліткове_список
-- підлітків.xlsx», аркуш «підлітки_інфо»; колонку «Модератор» пропущено.

-- 1. Спільнота з лідера служіння ---------------------------------------------
INSERT INTO "communities" ("id", "name", "is_branch", "sort_order", "leader_id", "created_at", "updated_at")
SELECT
  gen_random_uuid()::text,
  'D.Young',
  -- Відгалуження — це D.Youth і D.Church; підліткове живе всередині D.Youth.
  false,
  100,
  (SELECT a."person_id"
     FROM "ministry_assignments" a
     JOIN "ministries" m ON m."id" = a."ministry_id"
    WHERE m."name" = 'D.Young' AND a."role" = 'LEADER' AND a."until" IS NULL
    LIMIT 1),
  now(),
  now()
WHERE NOT EXISTS (SELECT 1 FROM "communities" WHERE "name" = 'D.Young');

-- 2. Служіння прибираємо лише коли на ньому нічого не висить -------------------
DELETE FROM "ministries" m
WHERE m."name" = 'D.Young'
  AND NOT EXISTS (SELECT 1 FROM "gatherings" g WHERE g."ministry_id" = m."id")
  AND NOT EXISTS (SELECT 1 FROM "user_scopes" s WHERE s."ministry_id" = m."id");

-- 3. Реєстр і його розкладка --------------------------------------------------
WITH roster("first_name", "last_name", "phone", "birth_date", "notes") AS (
  VALUES
    ('Ілля', NULL::text, '0988386322'::text, DATE '2011-04-29', 'нікнейм в телеграмі: V2NATRONE'::text),
    ('Таня', 'Вовк', '0631067526', NULL, 'нікнейм в телеграмі: hugs_810
день народження: 22.02 (рік невідомий)'),
    ('Ангеліна', 'Попова', '085 095 426', DATE '2013-09-20', 'нікнейм в телеграмі: Ангеліна'),
    ('Софія', 'Хороленко', '0508084311', DATE '2012-01-27', 'нікнейм в телеграмі: Sofia Соня'),
    ('Вероніка', 'Юрчук', '0672150583', DATE '2014-01-02', 'нікнейм в телеграмі: Ya_lolofan_993'),
    ('Діана', 'Манько', '0930917784', NULL, 'нікнейм в телеграмі: diana
день народження: 22.04 (рік невідомий)'),
    ('Матвій', 'Бондаренко', '0686995476', DATE '2011-11-05', 'нікнейм в телеграмі: curtanwallfan'),
    ('Естер', 'Моткалюк', '0988193908', DATE '2013-11-30', 'нікнейм в телеграмі: Ester Motkaluyk'),
    ('Емма', NULL, '0985091505', DATE '2014-10-10', 'нікнейм в телеграмі: EMMAAAAJ'),
    ('Яна', 'Грифель', '0960963585', NULL, 'нікнейм в телеграмі: Hrefel Yana
день народження: 17.11 (рік невідомий)'),
    ('Рада', 'Шемчук', '0634686485', DATE '2012-05-14', 'нікнейм в телеграмі: IloveArina777'),
    ('Роман', 'Прокопович', '0973542377', NULL, 'день народження: 25.10 (рік невідомий)'),
    ('Емілі', NULL, NULL, NULL, 'нікнейм в телеграмі: HAHAOT
день народження: 07.06 (рік невідомий)'),
    ('Юра', 'Юрків', '0965748817', DATE '2014-04-29', 'нікнейм в телеграмі: YurkYuk'),
    ('Анастасія', 'Мільчарек', '0973512143', DATE '2011-11-23', 'нікнейм в телеграмі: Настикс'),
    ('Софія', 'Прокопович', '0968854676', DATE '2011-11-11', 'нікнейм в телеграмі: ✨Соня✨'),
    ('Анна', 'Грицьків', '0961397449', DATE '2013-12-27', 'нікнейм в телеграмі: Anya012love'),
    ('Ілля', 'Чечель', NULL, NULL, 'у списку підлітків записано як «Ілля Чечель?»'),
    ('Єва', 'Казімірко', NULL, DATE '2013-08-23', 'нікнейм в телеграмі: evikkk19917'),
    ('Каміла', 'Камолова', '0680506201', DATE '2011-10-18', 'нікнейм в телеграмі: k_k_s1_3'),
    ('Поліна', NULL, NULL, DATE '2013-05-14', 'у списку підлітків записано як «Поліна?»'),
    ('Еліна', 'Матренко', '0938403123', NULL, 'нікнейм в телеграмі: elina_matr
день народження: 19.11 (рік невідомий)'),
    ('Еля', NULL, NULL, NULL, 'у списку підлітків записано як «Еля гімнастка?»'),
    ('Ілля', 'Котоній', NULL, NULL, 'у списку підлітків записано як «Ілля Котоній?»'),
    ('Максим', 'Стетсів', '0988910303', DATE '2011-04-15', 'нікнейм в телеграмі: Maksym.Stetsiv'),
    ('Ілля', 'Гринечко', '0986654598', DATE '2010-12-11', 'нікнейм в телеграмі: illi2gryn
у списку підлітків записано як «Ілля Гринечко (який це?)»'),
    ('Леонард', 'Тюрін', '0971129712', NULL, 'нікнейм в телеграмі: Lev turin
день народження: 04.11 (рік невідомий)'),
    ('Ліна', 'Когут', NULL, NULL, 'у списку підлітків записано як «Ліна Когут?»'),
    ('Марта', 'Нор', '0938560023', NULL, 'нікнейм в телеграмі: M_y_m_i_k_a
день народження: 29.12 (рік невідомий)'),
    ('Єва', 'Синиця', '0680622007', NULL, 'нікнейм в телеграмі: Senutcuaeva
день народження: 09.08 (рік невідомий)'),
    ('Саша', NULL, NULL, NULL, 'у списку підлітків записано як «Саша?»'),
    ('Тимофій', 'Мазуренко', NULL, NULL, 'у списку підлітків записано як «Тимофій Мазуренко?»'),
    ('Наталя', 'Рихва', NULL, NULL, NULL),
    ('Вова', 'Злотніков', NULL, NULL, NULL),
    ('Максим', 'Хрипунов', '0666700172', DATE '2008-12-04', NULL),
    ('Маргарита', 'Шумило', '0986211763', DATE '2013-09-21', NULL),
    ('Ольга', 'Шумило', '0969169660', DATE '2009-03-05', NULL)),
/**
 * Хто зі списку вже є в базі. Крім точного збігу імені, є одна ручна
 * відповідність: «Вова Злотніков» заведений як Володимир — зменшувальні імена
 * автоматично не збігаються, а завести його вдруге означало б дубль.
 */
resolved AS (
  SELECT
    r.*,
    (SELECT p."id"
       FROM "people" p
      WHERE (
          r."first_name" = 'Вова' AND r."last_name" = 'Злотніков'
          AND lower(p."first_name") = 'володимир'
          AND lower(p."last_name") = 'злотніков'
          AND p."birth_date" = DATE '2012-04-09'
        )
        OR (
          lower(p."first_name") = lower(r."first_name")
          AND (
            (r."last_name" IS NULL AND p."last_name" IS NULL)
            OR lower(p."last_name") = lower(r."last_name")
          )
        )
      LIMIT 1) AS "existing_id"
  FROM roster r
),
created AS (
  INSERT INTO "people" (
    "id", "first_name", "last_name", "phone", "birth_date", "notes",
    -- Підлітки з групи ходять у церкву, але членами не є.
    "membership", "activity", "created_at", "updated_at"
  )
  SELECT
    gen_random_uuid()::text, r."first_name", r."last_name", r."phone", r."birth_date", r."notes",
    'ATTENDER', 'ACTIVE', now(), now()
  FROM resolved r
  WHERE r."existing_id" IS NULL
  RETURNING "id"
),
everyone AS (
  SELECT "id" FROM created
  UNION
  SELECT "existing_id" AS "id" FROM resolved WHERE "existing_id" IS NOT NULL
),
targets AS (
  SELECT "id" FROM "communities" WHERE "name" IN ('D.Young', 'D.Youth')
),
linked AS (
  INSERT INTO "_CommunityToPerson" ("A", "B")
  SELECT t."id", e."id" FROM targets t CROSS JOIN everyone e
  ON CONFLICT DO NOTHING
  RETURNING "B"
)
-- Журнал: походження картки має бути видно з неї самої, а не лише з цього файла.
INSERT INTO "person_activities" ("id", "person_id", "kind", "subject", "target", "actor_name", "created_at")
SELECT gen_random_uuid()::text, "id", 'PERSON_CREATED', 'person', 'D.Young', 'Імпорт списку підлітків', now()
FROM created;

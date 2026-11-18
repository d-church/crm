-- Доступи Микити Цупіка: своя домашня група і спільнота D.Young.
--
-- Акаунт міг бути заведений раніше самостійно, тому нічого не перезаписуємо
-- наосліп: якщо користувач із цією поштою вже є, йому лише додаються роль і
-- області, а пароль і решта ролей лишаються як були.

-- 1. Акаунт, якщо його ще немає ------------------------------------------------
INSERT INTO "users" (
  "id", "email", "password", "first_name", "last_name",
  "role", "roles", "person_id", "created_at", "updated_at"
)
SELECT
  gen_random_uuid()::text, 'tsupik28@gmail.com',
  '$argon2id$v=19$m=65536,p=4,t=3$WBoENSAeHi0e1/uMnz8YTg$tAkHTW4fAg+pAoL/nTOZSIU42COQUxn/w66+bKugqjU',
  'Микита', 'Цупік',
  'LEADER'::"roles", ARRAY['LEADER']::"roles"[],
  (SELECT "id" FROM "people" WHERE "first_name" = 'Микита' AND "last_name" = 'Цупік' LIMIT 1),
  now(), now()
WHERE NOT EXISTS (SELECT 1 FROM "users" WHERE "email" = 'tsupik28@gmail.com');

-- 2. Доводимо наявний акаунт до потрібного стану ---------------------------------
-- Звʼязок із карткою обовʼязковий: без нього не працює опіка, а отже й
-- пасторський шар його власної домашньої групи.
UPDATE "users" u
SET "person_id" = coalesce(
      u."person_id",
      (SELECT p."id" FROM "people" p
        WHERE p."first_name" = 'Микита' AND p."last_name" = 'Цупік'
          AND NOT EXISTS (SELECT 1 FROM "users" x WHERE x."person_id" = p."id")
        LIMIT 1)
    ),
    -- Роль додаємо, а не замінюємо: якщо він уже щось має, це лишається при ньому.
    "roles" = CASE
      WHEN u."roles" @> ARRAY['LEADER']::"roles"[] THEN u."roles"
      ELSE u."roles" || ARRAY['LEADER']::"roles"[]
    END,
    "updated_at" = now()
WHERE u."email" = 'tsupik28@gmail.com';

-- 3. Області: своя домашка й підліткова спільнота ---------------------------------
INSERT INTO "user_scopes" ("id", "user_id", "home_group_id", "level", "created_at", "updated_at")
SELECT gen_random_uuid()::text, u."id", h."id", 'VIEW'::"scope_levels", now(), now()
FROM "users" u
CROSS JOIN "home_groups" h
WHERE u."email" = 'tsupik28@gmail.com'
  AND h."name" = 'Домашня група Микити'
  AND NOT EXISTS (
    SELECT 1 FROM "user_scopes" s WHERE s."user_id" = u."id" AND s."home_group_id" = h."id"
  );

INSERT INTO "user_scopes" ("id", "user_id", "community_id", "level", "created_at", "updated_at")
SELECT gen_random_uuid()::text, u."id", c."id", 'VIEW'::"scope_levels", now(), now()
FROM "users" u
CROSS JOIN "communities" c
WHERE u."email" = 'tsupik28@gmail.com'
  AND c."name" = 'D.Young'
  AND NOT EXISTS (
    SELECT 1 FROM "user_scopes" s WHERE s."user_id" = u."id" AND s."community_id" = c."id"
  );

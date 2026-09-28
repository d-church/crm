-- Рольово-доступова модель: ролі набором, області відповідальності, опіка,
-- нотатки як список записів і довідник заходів.
--
-- Міграція навмисно тільки додає. Старі колонки (`users.role`, `people.notes`,
-- `person_steps.responsible`) лишаються на місці, поки код на них спирається —
-- знімемо їх окремою міграцією, коли застосунок перейде на нові.

-- 1. Ролі -------------------------------------------------------------------
-- Нові значення enum додаємо окремо від їх використання: Postgres не дає
-- користуватися свіжим значенням у тій самій транзакції.
ALTER TYPE "roles" ADD VALUE IF NOT EXISTS 'LEADER';
ALTER TYPE "roles" ADD VALUE IF NOT EXISTS 'CONNECT';

-- Порожній набір — це відсутність прав. Наявним користувачам переносимо те,
-- що в них уже є, щоб нічого не зламалося.
ALTER TABLE "users" ADD COLUMN "roles" "roles"[] NOT NULL DEFAULT ARRAY[]::"roles"[];
UPDATE "users" SET "roles" = ARRAY["role"];

-- 2. Користувач ↔ людина ----------------------------------------------------
ALTER TABLE "users"
  ADD COLUMN "person_id" TEXT,
  ADD CONSTRAINT "users_person_id_fkey" FOREIGN KEY ("person_id")
    REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "users_person_id_key" ON "users"("person_id");

-- 3. Області відповідальності ------------------------------------------------
CREATE TYPE "scope_levels" AS ENUM ('VIEW', 'MANAGE');

CREATE TABLE "user_scopes" (
  "id"            TEXT NOT NULL,
  "user_id"       TEXT NOT NULL,
  "community_id"  TEXT,
  "home_group_id" TEXT,
  "ministry_id"   TEXT,
  "training_id"   TEXT,
  "level"         "scope_levels" NOT NULL DEFAULT 'VIEW',
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"    TIMESTAMP(3) NOT NULL,

  CONSTRAINT "user_scopes_pkey" PRIMARY KEY ("id"),
  -- Область вказує рівно на одну сутність: тип читається з того, що заповнене.
  CONSTRAINT "user_scopes_single_target" CHECK (
    num_nonnulls("community_id", "home_group_id", "ministry_id", "training_id") = 1
  )
);

ALTER TABLE "user_scopes"
  ADD CONSTRAINT "user_scopes_user_id_fkey" FOREIGN KEY ("user_id")
    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "user_scopes_community_id_fkey" FOREIGN KEY ("community_id")
    REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "user_scopes_home_group_id_fkey" FOREIGN KEY ("home_group_id")
    REFERENCES "home_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "user_scopes_ministry_id_fkey" FOREIGN KEY ("ministry_id")
    REFERENCES "ministries"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "user_scopes_training_id_fkey" FOREIGN KEY ("training_id")
    REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "user_scopes_user_id_idx" ON "user_scopes"("user_id");
CREATE INDEX "user_scopes_community_id_idx" ON "user_scopes"("community_id");
CREATE INDEX "user_scopes_home_group_id_idx" ON "user_scopes"("home_group_id");
CREATE INDEX "user_scopes_ministry_id_idx" ON "user_scopes"("ministry_id");
CREATE INDEX "user_scopes_training_id_idx" ON "user_scopes"("training_id");

-- Одна область на користувача й сутність — двічі довірити те саме не можна.
CREATE UNIQUE INDEX "user_scopes_user_community_key"
  ON "user_scopes"("user_id", "community_id") WHERE "community_id" IS NOT NULL;
CREATE UNIQUE INDEX "user_scopes_user_home_group_key"
  ON "user_scopes"("user_id", "home_group_id") WHERE "home_group_id" IS NOT NULL;
CREATE UNIQUE INDEX "user_scopes_user_ministry_key"
  ON "user_scopes"("user_id", "ministry_id") WHERE "ministry_id" IS NOT NULL;
CREATE UNIQUE INDEX "user_scopes_user_training_key"
  ON "user_scopes"("user_id", "training_id") WHERE "training_id" IS NOT NULL;

-- 4. Опіка -------------------------------------------------------------------
CREATE TYPE "care_origins" AS ENUM ('ASSIGNED', 'HOME_GROUP', 'CONNECT');

CREATE TABLE "person_cares" (
  "id"           TEXT NOT NULL,
  "person_id"    TEXT NOT NULL,
  "caregiver_id" TEXT NOT NULL,
  "origin"       "care_origins" NOT NULL DEFAULT 'ASSIGNED',
  "since"        DATE NOT NULL DEFAULT CURRENT_DATE,
  "until"        DATE,
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"   TIMESTAMP(3) NOT NULL,

  CONSTRAINT "person_cares_pkey" PRIMARY KEY ("id"),
  -- Людина не опікується сама собою.
  CONSTRAINT "person_cares_not_self" CHECK ("person_id" <> "caregiver_id")
);

ALTER TABLE "person_cares"
  ADD CONSTRAINT "person_cares_person_id_fkey" FOREIGN KEY ("person_id")
    REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "person_cares_caregiver_id_fkey" FOREIGN KEY ("caregiver_id")
    REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "person_cares_person_id_idx" ON "person_cares"("person_id");
CREATE INDEX "person_cares_caregiver_id_idx" ON "person_cares"("caregiver_id");
CREATE INDEX "person_cares_until_idx" ON "person_cares"("until");

-- Той самий попечитель не може вести ту саму людину двома діючими записами.
CREATE UNIQUE INDEX "person_cares_active_key"
  ON "person_cares"("person_id", "caregiver_id") WHERE "until" IS NULL;

-- Лідер домашньої групи — попечитель її учасників за самим фактом участі.
INSERT INTO "person_cares" ("id", "person_id", "caregiver_id", "origin", "since", "updated_at")
SELECT gen_random_uuid()::text, p."id", g."leader_id", 'HOME_GROUP', CURRENT_DATE, CURRENT_TIMESTAMP
FROM "people" p
JOIN "home_groups" g ON g."id" = p."home_group_id"
WHERE g."leader_id" IS NOT NULL AND g."leader_id" <> p."id";

-- 5. Нотатки -----------------------------------------------------------------
CREATE TYPE "note_levels" AS ENUM ('TEAM', 'PASTORAL');

CREATE TABLE "person_notes" (
  "id"          TEXT NOT NULL,
  "person_id"   TEXT NOT NULL,
  "author_id"   TEXT,
  "author_name" TEXT,
  "level"       "note_levels" NOT NULL DEFAULT 'PASTORAL',
  "body"        TEXT NOT NULL,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMP(3) NOT NULL,

  CONSTRAINT "person_notes_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "person_notes"
  ADD CONSTRAINT "person_notes_person_id_fkey" FOREIGN KEY ("person_id")
    REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "person_notes_author_id_fkey" FOREIGN KEY ("author_id")
    REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "person_notes_person_id_idx" ON "person_notes"("person_id");
CREATE INDEX "person_notes_level_idx" ON "person_notes"("level");

-- Наявні нотатки — пасторські: вони писалися як пасторські, і розкривати їх ширше не можна.
-- Автор невідомий, тому лишається знімок імені замість посилання.
INSERT INTO "person_notes" ("id", "person_id", "author_name", "level", "body", "created_at", "updated_at")
SELECT gen_random_uuid()::text, "id", 'Перенесено з картки', 'PASTORAL', "notes", "created_at", CURRENT_TIMESTAMP
FROM "people"
WHERE "notes" IS NOT NULL AND btrim("notes") <> '';

-- 6. Відповідальний за крок як посилання -------------------------------------
ALTER TABLE "person_steps"
  ADD COLUMN "responsible_id" TEXT,
  ADD CONSTRAINT "person_steps_responsible_id_fkey" FOREIGN KEY ("responsible_id")
    REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "person_steps_responsible_id_idx" ON "person_steps"("responsible_id");

-- 7. Довідник заходів --------------------------------------------------------
CREATE TABLE "event_types" (
  "id"          TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "sort_order"  INTEGER NOT NULL DEFAULT 0,
  "is_archived" BOOLEAN NOT NULL DEFAULT false,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMP(3) NOT NULL,

  CONSTRAINT "event_types_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "event_types_name_key" ON "event_types"("name");

ALTER TABLE "person_events"
  ADD COLUMN "event_type_id" TEXT,
  ADD CONSTRAINT "person_events_event_type_id_fkey" FOREIGN KEY ("event_type_id")
    REFERENCES "event_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "person_events_event_type_id_idx" ON "person_events"("event_type_id");

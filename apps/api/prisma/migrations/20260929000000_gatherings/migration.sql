-- Календар зібрань і відмітки присутності.
--
-- Область зібрання має ту саму форму, що й область доступу: рівно одне посилання
-- або жодного. Завдяки цьому видимість календаря не треба вигадувати окремо —
-- працює той самий предикат, що вже ріже людей.

CREATE TABLE "gathering_types" (
  "id"          TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "sort_order"  INTEGER NOT NULL DEFAULT 0,
  "is_archived" BOOLEAN NOT NULL DEFAULT false,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMP(3) NOT NULL,

  CONSTRAINT "gathering_types_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "gathering_types_name_key" ON "gathering_types"("name");

CREATE TABLE "gatherings" (
  "id"            TEXT NOT NULL,
  "type_id"       TEXT NOT NULL,
  -- Порожня назва означає «як тип»: щотижнева домашка не потребує власного імені.
  "title"         TEXT,
  "starts_at"     TIMESTAMP(3) NOT NULL,
  "note"          TEXT,
  -- Скільки було гостей без картки. Для загальної цифри, коли заводити картку нікому.
  "guest_count"   INTEGER NOT NULL DEFAULT 0,
  "community_id"  TEXT,
  "home_group_id" TEXT,
  "ministry_id"   TEXT,
  "training_id"   TEXT,
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"    TIMESTAMP(3) NOT NULL,

  CONSTRAINT "gatherings_pkey" PRIMARY KEY ("id"),
  -- Жодного посилання означає загальноцерковне зібрання.
  CONSTRAINT "gatherings_single_scope" CHECK (
    num_nonnulls("community_id", "home_group_id", "ministry_id", "training_id") <= 1
  ),
  CONSTRAINT "gatherings_guest_count_positive" CHECK ("guest_count" >= 0)
);

ALTER TABLE "gatherings"
  ADD CONSTRAINT "gatherings_type_id_fkey" FOREIGN KEY ("type_id")
    REFERENCES "gathering_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "gatherings_community_id_fkey" FOREIGN KEY ("community_id")
    REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "gatherings_home_group_id_fkey" FOREIGN KEY ("home_group_id")
    REFERENCES "home_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "gatherings_ministry_id_fkey" FOREIGN KEY ("ministry_id")
    REFERENCES "ministries"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "gatherings_training_id_fkey" FOREIGN KEY ("training_id")
    REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Календар завжди читається за проміжком дат, тому індекс саме по ньому.
CREATE INDEX "gatherings_starts_at_idx" ON "gatherings"("starts_at");
CREATE INDEX "gatherings_type_id_idx" ON "gatherings"("type_id");
CREATE INDEX "gatherings_community_id_idx" ON "gatherings"("community_id");
CREATE INDEX "gatherings_home_group_id_idx" ON "gatherings"("home_group_id");
CREATE INDEX "gatherings_ministry_id_idx" ON "gatherings"("ministry_id");
CREATE INDEX "gatherings_training_id_idx" ON "gatherings"("training_id");

CREATE TYPE "attendance_statuses" AS ENUM ('PRESENT', 'ABSENT');

CREATE TABLE "attendances" (
  "id"             TEXT NOT NULL,
  "gathering_id"   TEXT NOT NULL,
  "person_id"      TEXT NOT NULL,
  "status"         "attendance_statuses" NOT NULL,
  -- Хто відмітив: на загальноцерковному одну людину можуть відмітити двоє.
  "marked_by_id"   TEXT,
  "marked_by_name" TEXT,
  "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"     TIMESTAMP(3) NOT NULL,

  CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "attendances"
  ADD CONSTRAINT "attendances_gathering_id_fkey" FOREIGN KEY ("gathering_id")
    REFERENCES "gatherings"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "attendances_person_id_fkey" FOREIGN KEY ("person_id")
    REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "attendances_marked_by_id_fkey" FOREIGN KEY ("marked_by_id")
    REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Одна людина — одна відмітка на зібранні.
CREATE UNIQUE INDEX "attendances_gathering_person_key" ON "attendances"("gathering_id", "person_id");
-- Метрики читаються по людині за період: «був 3 рази з 5».
CREATE INDEX "attendances_person_id_idx" ON "attendances"("person_id");
CREATE INDEX "attendances_status_idx" ON "attendances"("status");

INSERT INTO "gathering_types" ("id", "name", "sort_order", "updated_at")
SELECT gen_random_uuid()::text, name, ordinality, CURRENT_TIMESTAMP
FROM unnest(ARRAY['Домашня група', 'Недільне служіння', 'Молодіжне служіння', 'Молитва', 'Лідерська зустріч', 'Конференція'])
  WITH ORDINALITY AS seed(name, ordinality);

-- «Наступний крок» був одним текстовим полем: без історії, без дедлайну й без
-- відповідального. Стає задачею з довідника.
CREATE TYPE "step_states" AS ENUM ('PLANNED', 'IN_PROGRESS', 'DONE', 'SKIPPED');

CREATE TABLE "step_types" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_archived" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "step_types_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "step_types_name_key" ON "step_types"("name");

CREATE TABLE "person_steps" (
  "id" TEXT NOT NULL,
  "person_id" TEXT NOT NULL,
  "step_type_id" TEXT NOT NULL,
  "state" "step_states" NOT NULL DEFAULT 'PLANNED',
  "due_at" DATE,
  "completed_at" DATE,
  "responsible" TEXT,
  "note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "person_steps_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "person_steps_person_id_fkey" FOREIGN KEY ("person_id")
    REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "person_steps_step_type_id_fkey" FOREIGN KEY ("step_type_id")
    REFERENCES "step_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "person_steps_person_id_idx" ON "person_steps"("person_id");
CREATE INDEX "person_steps_step_type_id_idx" ON "person_steps"("step_type_id");
CREATE INDEX "person_steps_state_idx" ON "person_steps"("state");
CREATE INDEX "person_steps_due_at_idx" ON "person_steps"("due_at");

-- Початковий довідник: те, що церква і так проходить із новими людьми.
INSERT INTO "step_types" ("id", "name", "sort_order", "updated_at") VALUES
  (gen_random_uuid()::text, 'Покаяння', 1, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Зустріч для нових', 2, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Водне хрещення', 3, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Вступ у членство', 4, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Знайти служіння', 5, CURRENT_TIMESTAMP);

-- next_step ніде не заповнений, тож переносити нема чого.
ALTER TABLE "people" DROP COLUMN "next_step";

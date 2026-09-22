-- Роль належить участі в служінні, а не людині: одна людина може керувати одним
-- служінням і бути помічником в іншому. Тому зв'язок людина↔служіння стає таблицею.
CREATE TYPE "ministry_roles" AS ENUM ('MEMBER', 'HELPER', 'LEADER');

CREATE TABLE "ministry_assignments" (
  "id" TEXT NOT NULL,
  "person_id" TEXT NOT NULL,
  "ministry_id" TEXT NOT NULL,
  "role" "ministry_roles" NOT NULL DEFAULT 'MEMBER',
  "since" DATE,
  "until" DATE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ministry_assignments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ministry_assignments_person_id_fkey" FOREIGN KEY ("person_id")
    REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ministry_assignments_ministry_id_fkey" FOREIGN KEY ("ministry_id")
    REFERENCES "ministries"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ministry_assignments_person_id_idx" ON "ministry_assignments"("person_id");
CREATE INDEX "ministry_assignments_ministry_id_idx" ON "ministry_assignments"("ministry_id");
CREATE INDEX "ministry_assignments_role_idx" ON "ministry_assignments"("role");

-- Людина не може мати дві діючі участі в одному служінні, але історія завершених
-- участей зберігається, тому обмеження часткове.
CREATE UNIQUE INDEX "ministry_assignments_active_key"
  ON "ministry_assignments"("person_id", "ministry_id")
  WHERE "until" IS NULL;

-- Наявні учасники стають учасниками, наявні керівники — керівниками.
INSERT INTO "ministry_assignments" ("id", "person_id", "ministry_id", "role", "updated_at")
SELECT gen_random_uuid()::text, "B", "A", 'MEMBER', CURRENT_TIMESTAMP
FROM "_MinistryToPerson";

INSERT INTO "ministry_assignments" ("id", "person_id", "ministry_id", "role", "updated_at")
SELECT gen_random_uuid()::text, "leader_id", "id", 'LEADER', CURRENT_TIMESTAMP
FROM "ministries"
WHERE "leader_id" IS NOT NULL
ON CONFLICT ("person_id", "ministry_id") WHERE "until" IS NULL
DO UPDATE SET "role" = 'LEADER';

DROP TABLE "_MinistryToPerson";

DROP INDEX "ministries_leader_id_idx";
ALTER TABLE "ministries" DROP COLUMN "leader_id";

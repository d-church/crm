-- Журнал операцій над карткою людини: хто, коли і що змінив.
CREATE TYPE "activity_kinds" AS ENUM (
  'PERSON_CREATED',
  'FIELD_CHANGED',
  'RELATION_ADDED',
  'RELATION_REMOVED',
  'STEP_ADDED',
  'STEP_CHANGED',
  'STEP_REMOVED',
  'ROLE_ASSIGNED',
  'ROLE_CHANGED',
  'ROLE_REMOVED'
);

CREATE TABLE "person_activities" (
  "id" TEXT NOT NULL,
  "person_id" TEXT NOT NULL,
  "kind" "activity_kinds" NOT NULL,
  "subject" TEXT NOT NULL,
  "target" TEXT,
  "old_value" TEXT,
  "new_value" TEXT,
  "actor_id" TEXT,
  "actor_name" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "person_activities_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "person_activities_person_id_fkey" FOREIGN KEY ("person_id")
    REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "person_activities_person_id_created_at_idx"
  ON "person_activities"("person_id", "created_at");

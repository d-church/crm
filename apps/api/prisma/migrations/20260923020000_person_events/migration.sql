-- Події, які команда вносить руками: «назва — дата». Стають частиною хронології
-- нарівні з хрещенням і членством.
CREATE TABLE "person_events" (
  "id" TEXT NOT NULL,
  "person_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "occurred_at" DATE NOT NULL,
  "note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "person_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "person_events_person_id_fkey" FOREIGN KEY ("person_id")
    REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "person_events_person_id_occurred_at_idx"
  ON "person_events"("person_id", "occurred_at");

-- Внесення події теж лишає слід у журналі, тому для неї потрібні власні види записів.
ALTER TYPE "activity_kinds" ADD VALUE IF NOT EXISTS 'EVENT_ADDED';
ALTER TYPE "activity_kinds" ADD VALUE IF NOT EXISTS 'EVENT_CHANGED';
ALTER TYPE "activity_kinds" ADD VALUE IF NOT EXISTS 'EVENT_REMOVED';

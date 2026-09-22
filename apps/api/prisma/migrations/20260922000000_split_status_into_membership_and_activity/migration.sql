-- Одна колонка "status" відповідала одразу на три різні питання: ким людина є для
-- церкви, чи вона взагалі тут, і чи потребує опіки. Розділяємо їх.
CREATE TYPE "membership_statuses" AS ENUM (
  'SUBSCRIBER',
  'GUEST',
  'ATTENDER',
  'MEMBER',
  'FORMER_MEMBER'
);

CREATE TYPE "activity_states" AS ENUM ('ACTIVE', 'ABROAD', 'INACTIVE', 'MOVED');

ALTER TABLE "people"
  ADD COLUMN "membership" "membership_statuses" NOT NULL DEFAULT 'GUEST',
  ADD COLUMN "activity" "activity_states" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "care_needed" BOOLEAN NOT NULL DEFAULT false;

-- Дати членства заповнені точніше за старий статус, тому вирішують саме вони:
-- є дата вибуття — колишній член, є дата вступу — член, інакше прихожанин.
UPDATE "people" SET "membership" = (
  CASE
    WHEN "left_at" IS NOT NULL THEN 'FORMER_MEMBER'
    WHEN "member_since" IS NOT NULL THEN 'MEMBER'
    ELSE 'ATTENDER'
  END
)::"membership_statuses";

UPDATE "people" SET "activity" = (
  CASE
    WHEN "status" = 'ABROAD' THEN 'ABROAD'
    WHEN "status" = 'INACTIVE' THEN 'INACTIVE'
    ELSE 'ACTIVE'
  END
)::"activity_states";

UPDATE "people" SET "care_needed" = true WHERE "status" = 'CARE';

DROP INDEX "people_status_idx";
ALTER TABLE "people" DROP COLUMN "status";
DROP TYPE "person_statuses";

CREATE INDEX "people_membership_idx" ON "people"("membership");
CREATE INDEX "people_activity_idx" ON "people"("activity");

-- Секція подій перетворюється на «Події та контакти»: окрім віх життя туди
-- записують дзвінки, зустрічі й консультації представників церкви з людиною.
CREATE TYPE "person_event_kinds" AS ENUM ('EVENT', 'CALL', 'MEETING', 'CONSULTATION');

ALTER TABLE "person_events"
  ADD COLUMN "kind" "person_event_kinds" NOT NULL DEFAULT 'EVENT',
  ADD COLUMN "with_person_id" TEXT,
  ADD CONSTRAINT "person_events_with_person_id_fkey" FOREIGN KEY ("with_person_id")
    REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "person_events_with_person_id_idx" ON "person_events"("with_person_id");

-- У контакту назву заміняє вид і співрозмовник, тому вона більше не обовʼязкова.
ALTER TABLE "person_events" ALTER COLUMN "title" DROP NOT NULL;

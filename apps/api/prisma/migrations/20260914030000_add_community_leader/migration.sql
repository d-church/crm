ALTER TABLE "communities" ADD COLUMN "leader_id" TEXT;

CREATE INDEX "communities_leader_id_idx" ON "communities"("leader_id");

ALTER TABLE "communities"
ADD CONSTRAINT "communities_leader_id_fkey"
FOREIGN KEY ("leader_id") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

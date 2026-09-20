-- The former free-text people.ministry value has no community reference, so it
-- cannot be migrated into the new structured ministry model safely.
ALTER TABLE "people" DROP COLUMN "ministry";

CREATE TABLE "ministries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "community_id" TEXT NOT NULL,
    "leader_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ministries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ministries_community_id_name_key" ON "ministries"("community_id", "name");
CREATE INDEX "ministries_community_id_idx" ON "ministries"("community_id");
CREATE INDEX "ministries_leader_id_idx" ON "ministries"("leader_id");

CREATE TABLE "_MinistryToPerson" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX "_MinistryToPerson_AB_unique" ON "_MinistryToPerson"("A", "B");
CREATE INDEX "_MinistryToPerson_B_index" ON "_MinistryToPerson"("B");

ALTER TABLE "ministries"
ADD CONSTRAINT "ministries_community_id_fkey"
FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ministries"
ADD CONSTRAINT "ministries_leader_id_fkey"
FOREIGN KEY ("leader_id") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "_MinistryToPerson"
ADD CONSTRAINT "_MinistryToPerson_A_fkey"
FOREIGN KEY ("A") REFERENCES "ministries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_MinistryToPerson"
ADD CONSTRAINT "_MinistryToPerson_B_fkey"
FOREIGN KEY ("B") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

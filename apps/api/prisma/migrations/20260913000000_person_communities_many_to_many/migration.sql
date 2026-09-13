-- Replace the old optional one-to-many column. Existing assignments are intentionally
-- not copied: the previous values were test data and membership now supports many-to-many.
ALTER TABLE "people" DROP CONSTRAINT "people_community_id_fkey";
DROP INDEX "people_community_id_idx";
ALTER TABLE "people" DROP COLUMN "community_id";

-- Prisma implicit many-to-many relation for Community.people <-> Person.communities.
CREATE TABLE "_CommunityToPerson" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CommunityToPerson_AB_pkey" PRIMARY KEY ("A", "B")
);

CREATE INDEX "_CommunityToPerson_B_index" ON "_CommunityToPerson"("B");

ALTER TABLE "_CommunityToPerson"
ADD CONSTRAINT "_CommunityToPerson_A_fkey"
FOREIGN KEY ("A") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_CommunityToPerson"
ADD CONSTRAINT "_CommunityToPerson_B_fkey"
FOREIGN KEY ("B") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

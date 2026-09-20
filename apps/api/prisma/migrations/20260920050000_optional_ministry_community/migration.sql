ALTER TABLE "ministries" DROP CONSTRAINT "ministries_community_id_fkey";

ALTER TABLE "ministries" ALTER COLUMN "community_id" DROP NOT NULL;

ALTER TABLE "ministries"
ADD CONSTRAINT "ministries_community_id_fkey"
FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

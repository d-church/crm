-- CreateTable
CREATE TABLE "communities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "communities_name_key" ON "communities"("name");

-- SeedCommunities
INSERT INTO "communities" ("id", "name", "updated_at")
VALUES
    ('00000000-0000-4000-8000-000000000001', 'D.Youth', CURRENT_TIMESTAMP),
    ('00000000-0000-4000-8000-000000000002', 'D.Young', CURRENT_TIMESTAMP),
    ('00000000-0000-4000-8000-000000000003', 'D.Kids', CURRENT_TIMESTAMP),
    ('00000000-0000-4000-8000-000000000004', 'D.Family', CURRENT_TIMESTAMP),
    ('00000000-0000-4000-8000-000000000005', 'D.Sinior', CURRENT_TIMESTAMP),
    ('00000000-0000-4000-8000-000000000006', 'D.Mom', CURRENT_TIMESTAMP),
    ('00000000-0000-4000-8000-000000000007', 'D.Friends', CURRENT_TIMESTAMP);

-- PreserveOldValues
INSERT INTO "communities" ("id", "name", "updated_at")
SELECT
    md5('community:' || lower(trim("community")))::uuid::text,
    trim("community"),
    CURRENT_TIMESTAMP
FROM "people"
WHERE NULLIF(trim("community"), '') IS NOT NULL
GROUP BY trim("community")
ON CONFLICT ("name") DO NOTHING;

-- AddColumn
ALTER TABLE "people" ADD COLUMN "community_id" TEXT;

-- LinkExistingPeople
UPDATE "people" AS person
SET "community_id" = community."id"
FROM "communities" AS community
WHERE community."name" = trim(person."community");

-- DropColumn
ALTER TABLE "people" DROP COLUMN "community";

-- CreateIndex
CREATE INDEX "people_community_id_idx" ON "people"("community_id");

-- AddForeignKey
ALTER TABLE "people"
ADD CONSTRAINT "people_community_id_fkey"
FOREIGN KEY ("community_id") REFERENCES "communities"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

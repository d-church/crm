-- AlterEnum
BEGIN;
CREATE TYPE "person_statuses_new" AS ENUM ('GUEST', 'NEW', 'MEMBER', 'SERVANT', 'INACTIVE');
ALTER TABLE "public"."people" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "people" ALTER COLUMN "status" TYPE "person_statuses_new" USING ("status"::text::"person_statuses_new");
ALTER TYPE "person_statuses" RENAME TO "person_statuses_old";
ALTER TYPE "person_statuses_new" RENAME TO "person_statuses";
DROP TYPE "public"."person_statuses_old";
ALTER TABLE "people" ALTER COLUMN "status" SET DEFAULT 'GUEST';
COMMIT;

-- AlterTable
ALTER TABLE "people" ADD COLUMN     "city" TEXT,
ADD COLUMN     "last_seen_at" DATE,
ADD COLUMN     "ministry" TEXT,
ADD COLUMN     "small_group" TEXT;

-- CreateIndex
CREATE INDEX "people_status_idx" ON "people"("status");


-- AlterTable
ALTER TABLE "people" ADD COLUMN     "address" TEXT,
ADD COLUMN     "baptized_at" DATE,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "home_phone" TEXT,
ADD COLUMN     "left_at" DATE,
ADD COLUMN     "legacy_id" INTEGER,
ADD COLUMN     "member_since" DATE,
ADD COLUMN     "postal_code" TEXT,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "work_phone" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "people_legacy_id_key" ON "people"("legacy_id");


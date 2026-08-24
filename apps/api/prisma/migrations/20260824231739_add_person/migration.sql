-- CreateEnum
CREATE TYPE "person_statuses" AS ENUM ('GUEST', 'ATTENDEE', 'MEMBER');

-- CreateTable
CREATE TABLE "people" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "status" "person_statuses" NOT NULL DEFAULT 'GUEST',
    "birth_date" DATE,
    "joined_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "people_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "people_last_name_first_name_idx" ON "people"("last_name", "first_name");

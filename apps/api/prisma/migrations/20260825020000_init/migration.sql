-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "person_statuses" AS ENUM ('NEW', 'CONNECTED', 'NEXT_STEP', 'COMMUNITY', 'SERVING', 'CARE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "follow_up_states" AS ENUM ('NOT_DONE', 'PLANNED', 'DONE');

-- CreateEnum
CREATE TYPE "roles" AS ENUM ('SUPERADMIN');

-- CreateTable
CREATE TABLE "people" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "city" TEXT,
    "status" "person_statuses" NOT NULL DEFAULT 'NEW',
    "first_visit_at" DATE,
    "last_seen_at" DATE,
    "connected_by" TEXT,
    "follow_up" "follow_up_states" NOT NULL DEFAULT 'NOT_DONE',
    "next_step" TEXT,
    "community" TEXT,
    "ministry" TEXT,
    "responsible" TEXT,
    "next_action" TEXT,
    "next_action_at" DATE,
    "birth_date" DATE,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "people_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "roles" NOT NULL DEFAULT 'SUPERADMIN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "people_last_name_first_name_idx" ON "people"("last_name", "first_name");

-- CreateIndex
CREATE INDEX "people_status_idx" ON "people"("status");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");


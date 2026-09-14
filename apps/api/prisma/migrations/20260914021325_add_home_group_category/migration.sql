-- CreateEnum
CREATE TYPE "home_group_categories" AS ENUM ('YOUTH', 'FAMILY', 'SENIORS', 'FRIENDS');

-- AlterTable
ALTER TABLE "home_groups" ADD COLUMN     "category" "home_group_categories" NOT NULL DEFAULT 'YOUTH';

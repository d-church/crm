CREATE TYPE "person_genders" AS ENUM ('MALE', 'FEMALE');

ALTER TABLE "people" ADD COLUMN "gender" "person_genders";

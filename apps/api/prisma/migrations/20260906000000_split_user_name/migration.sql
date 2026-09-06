-- AddColumns
ALTER TABLE "users"
ADD COLUMN "first_name" TEXT,
ADD COLUMN "last_name" TEXT;

-- MigrateData
UPDATE "users"
SET
  "first_name" = NULLIF(split_part(trim("name"), ' ', 1), ''),
  "last_name" = COALESCE(NULLIF(regexp_replace(trim("name"), '^[^[:space:]]+[[:space:]]*', ''), ''), '')
WHERE "name" IS NOT NULL;

UPDATE "users"
SET
  "first_name" = COALESCE("first_name", ''),
  "last_name" = COALESCE("last_name", '');

-- SetNotNull
ALTER TABLE "users"
ALTER COLUMN "first_name" SET NOT NULL,
ALTER COLUMN "last_name" SET NOT NULL;

-- DropColumn
ALTER TABLE "users" DROP COLUMN "name";

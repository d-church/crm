ALTER TABLE "communities" ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 100;

-- D.Youth is the primary community in the current structure.
UPDATE "communities" SET "sort_order" = 0 WHERE lower("name") = 'd.youth';

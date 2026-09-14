CREATE TABLE "home_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "leader_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "home_groups_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "home_groups_name_key" ON "home_groups"("name");
CREATE INDEX "home_groups_leader_id_idx" ON "home_groups"("leader_id");

ALTER TABLE "people" ADD COLUMN "home_group_id" TEXT;
CREATE INDEX "people_home_group_id_idx" ON "people"("home_group_id");

ALTER TABLE "home_groups"
ADD CONSTRAINT "home_groups_leader_id_fkey"
FOREIGN KEY ("leader_id") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "people"
ADD CONSTRAINT "people_home_group_id_fkey"
FOREIGN KEY ("home_group_id") REFERENCES "home_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

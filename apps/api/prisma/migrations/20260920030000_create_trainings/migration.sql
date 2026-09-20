CREATE TABLE "trainings" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "leader_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trainings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "trainings_name_key" ON "trainings"("name");
CREATE INDEX "trainings_leader_id_idx" ON "trainings"("leader_id");

CREATE TABLE "_PersonToTraining" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX "_PersonToTraining_AB_unique" ON "_PersonToTraining"("A", "B");
CREATE INDEX "_PersonToTraining_B_index" ON "_PersonToTraining"("B");

ALTER TABLE "trainings"
ADD CONSTRAINT "trainings_leader_id_fkey"
FOREIGN KEY ("leader_id") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "_PersonToTraining"
ADD CONSTRAINT "_PersonToTraining_A_fkey"
FOREIGN KEY ("A") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_PersonToTraining"
ADD CONSTRAINT "_PersonToTraining_B_fkey"
FOREIGN KEY ("B") REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "people" ADD COLUMN "avatar_key" TEXT;
CREATE UNIQUE INDEX "people_avatar_key_key" ON "people"("avatar_key");

CREATE TABLE "avatar_cleanup" (
    "key" TEXT NOT NULL,
    "not_before" TIMESTAMP(3) NOT NULL,
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "avatar_cleanup_pkey" PRIMARY KEY ("key")
);
CREATE INDEX "avatar_cleanup_not_before_idx" ON "avatar_cleanup"("not_before");

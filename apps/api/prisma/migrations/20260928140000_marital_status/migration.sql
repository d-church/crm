-- Сімейний стан одним полем: вдівство — це його значення, а не окремий прапорець.
-- Людина не буває одночасно заміжня і вдова, тож двома колонками це моделювати
-- означало б дозволити суперечливий стан.

CREATE TYPE "marital_statuses" AS ENUM ('SINGLE', 'ENGAGED', 'MARRIED', 'DIVORCED', 'WIDOWED');

ALTER TABLE "people"
  ADD COLUMN "marital_status" "marital_statuses",
  -- Пара: наречений, наречена або подружжя. Людину можуть видалити — звʼязок обнулиться.
  ADD COLUMN "partner_id" TEXT,
  -- Дата заручин або одруження — залежно від стану.
  ADD COLUMN "marital_since" DATE,
  ADD CONSTRAINT "people_partner_id_fkey" FOREIGN KEY ("partner_id")
    REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "people_partner_not_self" CHECK ("partner_id" IS NULL OR "partner_id" <> "id");

-- Одна людина не може бути парою двом одразу.
CREATE UNIQUE INDEX "people_partner_id_key" ON "people"("partner_id") WHERE "partner_id" IS NOT NULL;
CREATE INDEX "people_marital_status_idx" ON "people"("marital_status") WHERE "marital_status" IS NOT NULL;

-- Наявні позначки вдівства стають значенням сімейного стану.
UPDATE "people" SET "marital_status" = 'WIDOWED' WHERE "is_widowed";

DROP INDEX IF EXISTS "people_is_widowed_idx";
ALTER TABLE "people" DROP COLUMN "is_widowed";

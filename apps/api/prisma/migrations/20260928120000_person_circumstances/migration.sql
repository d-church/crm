-- Обставини, які визначають пасторську увагу: сирітство, вдівство, служба.
-- Це не характеристика людини, а те, що церква має памʼятати, тому поля живуть
-- у пасторському шарі — разом з нотатками, а не з телефоном.

CREATE TYPE "orphan_statuses" AS ENUM ('FULL', 'HALF');

ALTER TABLE "people"
  ADD COLUMN "orphan_status" "orphan_statuses",
  ADD COLUMN "is_widowed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "is_military" BOOLEAN NOT NULL DEFAULT false;

-- Шукати «всіх вдів» і «всіх військових» церква буде часто, тож часткові індекси:
-- вони покривають рівно ті рядки, які цікавлять, і майже нічого не важать.
CREATE INDEX "people_is_widowed_idx" ON "people"("is_widowed") WHERE "is_widowed";
CREATE INDEX "people_is_military_idx" ON "people"("is_military") WHERE "is_military";
CREATE INDEX "people_orphan_status_idx" ON "people"("orphan_status") WHERE "orphan_status" IS NOT NULL;

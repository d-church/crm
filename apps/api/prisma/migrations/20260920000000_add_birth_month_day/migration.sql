-- Пошук іменинників не залежить від року народження, тому рахуємо день і місяць
-- як число MMDD (0101–1231). Колонку заповнює сам Postgres — писати в неї не можна.
ALTER TABLE "people"
  ADD COLUMN "birth_md" SMALLINT
  GENERATED ALWAYS AS (
    (EXTRACT(MONTH FROM "birth_date") * 100 + EXTRACT(DAY FROM "birth_date"))::smallint
  ) STORED;

CREATE INDEX "people_birth_md_idx" ON "people"("birth_md");

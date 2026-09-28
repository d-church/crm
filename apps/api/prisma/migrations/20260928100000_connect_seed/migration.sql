-- Конект заводить людину одним екраном, і для цього потрібні дві речі з довідників:
-- крок «Фолов-ап», який одразу призначається служителю, і хоч один захід,
-- на якому знайомляться. Обидва — звичайні записи довідника: церква їх перейменує
-- або доповнить, але хоча б один має існувати з першого дня.

INSERT INTO "step_types" ("id", "name", "sort_order", "updated_at")
SELECT gen_random_uuid()::text, 'Фолов-ап', -1, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "step_types" WHERE "name" = 'Фолов-ап');

INSERT INTO "event_types" ("id", "name", "sort_order", "updated_at")
SELECT gen_random_uuid()::text, name, ordinality, CURRENT_TIMESTAMP
FROM unnest(ARRAY['Служіння', 'Молодіжка', 'Домашня група', 'Захід', 'Особисте знайомство'])
  WITH ORDINALITY AS seed(name, ordinality)
WHERE NOT EXISTS (SELECT 1 FROM "event_types");

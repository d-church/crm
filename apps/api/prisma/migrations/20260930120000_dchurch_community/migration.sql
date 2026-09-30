-- D.Church — друга гілка церкви поряд з D.Youth.
--
-- До цього «решта церкви» існувала лише як заперечення: усі, кого немає в D.Youth.
-- Заперечення не має ні лідера, ні зібрань, ні власних цифр — і в перемикачі
-- читалося як «без D.Youth», хоч насправді це окрема спільнота зі своїм життям.
-- Тепер обидві гілки рівноправні.

INSERT INTO "communities" ("id", "name", "is_branch", "sort_order", "created_at", "updated_at")
SELECT gen_random_uuid()::text, 'D.Church', true, 1, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM "communities" WHERE "name" = 'D.Church');

-- Колишніх членів не заносимо: вони вже не в жодній гілці, і приписувати їх
-- до спільноти заднім числом означало б рахувати їх у її цифрах.
INSERT INTO "_CommunityToPerson" ("A", "B")
SELECT c."id", p."id"
FROM "communities" c
CROSS JOIN "people" p
WHERE c."name" = 'D.Church'
  AND p."membership" <> 'FORMER_MEMBER'
  AND NOT EXISTS (
    SELECT 1
    FROM "_CommunityToPerson" j
    JOIN "communities" b ON b."id" = j."A"
    WHERE j."B" = p."id" AND b."name" = 'D.Youth'
  )
ON CONFLICT DO NOTHING;

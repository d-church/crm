-- Прибрати тестову домашню групу.
--
-- Разом із групою каскадом підуть її зібрання з відмітками присутності й область
-- доступу, видана на неї. Це свідомо: група тестова, і її слід не має лишатися
-- в календарі й у чиїхось доступах.

-- Спершу відвʼязуємо людей. Роль теж знімаємо: роль без групи — це сміття,
-- яке потім виглядає як помилка даних.
UPDATE "people"
SET "home_group_id" = NULL, "home_group_role" = NULL, "updated_at" = now()
WHERE "home_group_id" = (SELECT "id" FROM "home_groups" WHERE "name" = 'Домашня група Ілони (Тестова)');

-- Автоматична опіка тримається на участі в групі, тож закривається разом з нею.
UPDATE "person_cares" c
SET "until" = now(), "updated_at" = now()
FROM "people" p
WHERE c."person_id" = p."id"
  AND c."origin" = 'HOME_GROUP'
  AND c."until" IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM "home_groups" h
    WHERE h."id" = p."home_group_id" AND h."leader_id" = c."caregiver_id"
  );

DELETE FROM "home_groups" WHERE "name" = 'Домашня група Ілони (Тестова)';

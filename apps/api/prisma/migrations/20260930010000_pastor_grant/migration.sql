-- Кому вмикаємо пасторський шар. Нікому автоматично: ні адміністраторам, ні
-- суперадмінам — інакше звуження прав не відбулося б зовсім. Список іменний і
-- свідомий, решту роздають в адмінці.

UPDATE "users"
SET "roles" = array_append("roles", 'PASTOR'::"roles")
WHERE "email" IN ('igornovoseltsev91@gmail.com', 'a.tata4.26@gmail.com')
  AND NOT ('PASTOR' = ANY("roles"));

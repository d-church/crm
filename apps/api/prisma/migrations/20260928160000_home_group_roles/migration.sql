-- Хто ким є в домашній групі. Лідер лишається там, де й був — у самій групі
-- (`home_groups.leader_id`): він один, і з нього виводиться опіка над учасниками.
-- Тут — решта ролей, які описують не призначення, а спосіб участі.

CREATE TYPE "home_group_roles" AS ENUM ('HELPER', 'REGULAR', 'IRREGULAR', 'GUEST');

ALTER TABLE "people" ADD COLUMN "home_group_role" "home_group_roles";

CREATE INDEX "people_home_group_role_idx" ON "people"("home_group_role") WHERE "home_group_role" IS NOT NULL;

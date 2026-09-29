-- D.Youth — це фактично церква в церкві: у неї своя структура, свої адміни й свої
-- цифри. Позначка каже, що спільнота є окремим відгалуженням, і дозволяє дивитись
-- на базу трьома способами: уся церква, лише відгалуження, або все інше.

ALTER TABLE "communities" ADD COLUMN "is_branch" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "communities_is_branch_idx" ON "communities"("is_branch") WHERE "is_branch";

-- Єдине наявне відгалуження на сьогодні.
UPDATE "communities" SET "is_branch" = true WHERE "name" = 'D.Youth';

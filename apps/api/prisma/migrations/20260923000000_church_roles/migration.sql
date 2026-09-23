-- Сан у церкві (диякон, пресвітер, пастор) — це не роль у конкретному служінні,
-- тому для нього окремий довідник і окремі призначення з періодом.
CREATE TABLE "church_role_types" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_archived" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "church_role_types_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "church_role_types_name_key" ON "church_role_types"("name");

CREATE TABLE "church_roles" (
  "id" TEXT NOT NULL,
  "person_id" TEXT NOT NULL,
  "role_type_id" TEXT NOT NULL,
  "since" DATE,
  "until" DATE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "church_roles_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "church_roles_person_id_fkey" FOREIGN KEY ("person_id")
    REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "church_roles_role_type_id_fkey" FOREIGN KEY ("role_type_id")
    REFERENCES "church_role_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "church_roles_person_id_idx" ON "church_roles"("person_id");
CREATE INDEX "church_roles_role_type_id_idx" ON "church_roles"("role_type_id");

-- Один діючий сан на людину, але історія завершених зберігається.
CREATE UNIQUE INDEX "church_roles_active_key"
  ON "church_roles"("person_id", "role_type_id")
  WHERE "until" IS NULL;

INSERT INTO "church_role_types" ("id", "name", "sort_order", "updated_at") VALUES
  (gen_random_uuid()::text, 'Диякон', 1, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Пресвітер', 2, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Пастор', 3, CURRENT_TIMESTAMP);

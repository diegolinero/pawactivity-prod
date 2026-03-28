-- CreateTable
CREATE TABLE "pet_weight_records" (
    "id" UUID NOT NULL,
    "pet_id" UUID NOT NULL,
    "weight_kg" DECIMAL(5,2) NOT NULL,
    "measured_at" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "pet_weight_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pet_vaccinations" (
    "id" UUID NOT NULL,
    "pet_id" UUID NOT NULL,
    "vaccine_name" VARCHAR(160) NOT NULL,
    "application_date" DATE NOT NULL,
    "next_due_date" DATE,
    "veterinarian_name" VARCHAR(120),
    "clinic_name" VARCHAR(120),
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "pet_vaccinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pet_dewormings" (
    "id" UUID NOT NULL,
    "pet_id" UUID NOT NULL,
    "product_name" VARCHAR(160) NOT NULL,
    "application_date" DATE NOT NULL,
    "next_due_date" DATE,
    "dose" VARCHAR(120),
    "veterinarian_name" VARCHAR(120),
    "clinic_name" VARCHAR(120),
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "pet_dewormings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pet_vet_visits" (
    "id" UUID NOT NULL,
    "pet_id" UUID NOT NULL,
    "visit_date" DATE NOT NULL,
    "veterinarian_name" VARCHAR(120),
    "clinic_name" VARCHAR(120),
    "reason" TEXT,
    "diagnosis" TEXT,
    "treatment" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "pet_vet_visits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pet_weight_records_pet_id_measured_at_idx" ON "pet_weight_records"("pet_id", "measured_at" DESC);

-- CreateIndex
CREATE INDEX "pet_weight_records_pet_id_deleted_at_idx" ON "pet_weight_records"("pet_id", "deleted_at");

-- CreateIndex
CREATE INDEX "pet_vaccinations_pet_id_application_date_idx" ON "pet_vaccinations"("pet_id", "application_date" DESC);

-- CreateIndex
CREATE INDEX "pet_vaccinations_pet_id_deleted_at_idx" ON "pet_vaccinations"("pet_id", "deleted_at");

-- CreateIndex
CREATE INDEX "pet_dewormings_pet_id_application_date_idx" ON "pet_dewormings"("pet_id", "application_date" DESC);

-- CreateIndex
CREATE INDEX "pet_dewormings_pet_id_deleted_at_idx" ON "pet_dewormings"("pet_id", "deleted_at");

-- CreateIndex
CREATE INDEX "pet_vet_visits_pet_id_visit_date_idx" ON "pet_vet_visits"("pet_id", "visit_date" DESC);

-- CreateIndex
CREATE INDEX "pet_vet_visits_pet_id_deleted_at_idx" ON "pet_vet_visits"("pet_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "pet_weight_records" ADD CONSTRAINT "pet_weight_records_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pet_vaccinations" ADD CONSTRAINT "pet_vaccinations_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pet_dewormings" ADD CONSTRAINT "pet_dewormings_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pet_vet_visits" ADD CONSTRAINT "pet_vet_visits_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

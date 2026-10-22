-- Add structured personal, address, and technician profile fields without dropping existing data.
ALTER TABLE "users"
  ADD COLUMN "first_names" TEXT,
  ADD COLUMN "paternal_surname" TEXT,
  ADD COLUMN "maternal_surname" TEXT,
  ADD COLUMN "birth_date" DATE,
  ADD COLUMN "sex" TEXT,
  ADD COLUMN "street" TEXT,
  ADD COLUMN "exterior_number" TEXT,
  ADD COLUMN "interior_number" TEXT,
  ADD COLUMN "neighborhood" TEXT,
  ADD COLUMN "municipality" TEXT,
  ADD COLUMN "state" TEXT,
  ADD COLUMN "postal_code" TEXT;

ALTER TABLE "technician_profiles"
  ADD COLUMN "profession" TEXT,
  ADD COLUMN "years_experience" INTEGER,
  ADD COLUMN "certifications" TEXT;

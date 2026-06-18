-- Add admin-managed business entities and wire nurses/users to departments and specializations.

CREATE TABLE IF NOT EXISTS "Department" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Specialization" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Specialization_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "UserSpecialization" (
  "userId" TEXT NOT NULL,
  "specializationId" TEXT NOT NULL,
  "yearsExperience" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserSpecialization_pkey" PRIMARY KEY ("userId","specializationId")
);

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "departmentId" TEXT;

ALTER TABLE "Patient"
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS "Department_name_key" ON "Department"("name");
CREATE INDEX IF NOT EXISTS "Department_isActive_idx" ON "Department"("isActive");
CREATE INDEX IF NOT EXISTS "Department_name_idx" ON "Department"("name");

CREATE UNIQUE INDEX IF NOT EXISTS "Specialization_name_key" ON "Specialization"("name");
CREATE INDEX IF NOT EXISTS "Specialization_isActive_idx" ON "Specialization"("isActive");
CREATE INDEX IF NOT EXISTS "Specialization_name_idx" ON "Specialization"("name");

CREATE INDEX IF NOT EXISTS "UserSpecialization_specializationId_idx" ON "UserSpecialization"("specializationId");

CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "User_isActive_idx" ON "User"("isActive");
CREATE INDEX IF NOT EXISTS "User_departmentId_idx" ON "User"("departmentId");

CREATE INDEX IF NOT EXISTS "Patient_name_idx" ON "Patient"("name");
CREATE INDEX IF NOT EXISTS "Patient_phone_idx" ON "Patient"("phone");
CREATE INDEX IF NOT EXISTS "Dispatch_patientId_idx" ON "Dispatch"("patientId");
CREATE INDEX IF NOT EXISTS "Dispatch_createdAt_idx" ON "Dispatch"("createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_entityId_idx" ON "AuditLog"("entityId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'User_departmentId_fkey'
  ) THEN
    ALTER TABLE "User"
      ADD CONSTRAINT "User_departmentId_fkey"
      FOREIGN KEY ("departmentId") REFERENCES "Department"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UserSpecialization_userId_fkey'
  ) THEN
    ALTER TABLE "UserSpecialization"
      ADD CONSTRAINT "UserSpecialization_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UserSpecialization_specializationId_fkey'
  ) THEN
    ALTER TABLE "UserSpecialization"
      ADD CONSTRAINT "UserSpecialization_specializationId_fkey"
      FOREIGN KEY ("specializationId") REFERENCES "Specialization"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

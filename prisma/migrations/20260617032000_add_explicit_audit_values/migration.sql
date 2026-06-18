-- Store before/after values explicitly for admin CRUD auditability.

ALTER TABLE "AuditLog"
  ADD COLUMN IF NOT EXISTS "previousValue" JSONB,
  ADD COLUMN IF NOT EXISTS "newValue" JSONB;

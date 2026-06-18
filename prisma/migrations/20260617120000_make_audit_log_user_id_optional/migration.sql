-- Make AuditLog.userId optional to prevent FK violations on missing users.
-- With the DB model allowing null, resolveAuditUserId can safely return null
-- and the audit log is still persisted without crashing the transaction.

ALTER TABLE "AuditLog" ALTER COLUMN "userId" DROP NOT NULL;

ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_userId_fkey";

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

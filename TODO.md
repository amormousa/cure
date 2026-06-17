# TODO - MVP → Professional Submission

## Phase 1 (High impact, quick wins)
- [x] Step 1: Add AuditLog entries for LOGIN and LOGOUT.
- [x] Step 2: Verify/standardize Dispatch ASSIGN + STATUS CHANGE audit actions.

- [ ] Step 3: Ensure route-level RBAC is consistent for all app/api/** (Admin/Dispatcher/Nurse visibility + mutations).

## Phase 2 (Admin CRUD UI completeness)
- [ ] Step 4: Confirm Admin UI pages exist for all required entities (Users, Nurses, Patients, Dispatches, Departments, Specializations, Notifications, Permissions).
- [ ] Step 5: Add missing Admin UI pages + wire to existing endpoints.

## Phase 3 (Reviewer wow factors)
- [ ] Step 6: Implement /admin/system-health page + backing health API.
- [ ] Step 7: Improve seed to realistic scale (50 Nurses / 200 Patients / 500 Dispatches).
- [ ] Step 8: Ensure dashboard KPIs match spec (Total Patients/Nurses, Active/Completed Dispatches, Response Time, Completion Rate) using DB queries.

## Phase 4 (Scalability / UX)
- [ ] Step 9: Server-side pagination/search/filter for large tables (avoid client-only filtering where possible).

## Phase 5 (Production security)
- [ ] Step 10: Tighten auth secret handling (no fallback secret), CSRF evaluation, rate limiting strategy beyond in-memory Map.
- [ ] Step 11: Prisma cleanup (validate + generate) and remove schema warnings.

## Progress (this task)
- [x] Implement Step 2 audit action standardization for ASSIGN/STATUS CHANGE
- [x] Implement Step 3 RBAC consistency for PATCH /api/dispatches/[id]

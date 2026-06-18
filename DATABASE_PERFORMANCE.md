# Database Performance & Indexing Strategy

> استراتيجية الأداء والفهارس لقاعدة البيانات

## 📊 ملخص الفهارس

### الفهارس الحالية: **15+ فهرس**

#### ✅ Single Column Indexes (7)
```sql
-- Users
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_user_role ON "User"(role);
CREATE INDEX idx_user_status ON "User"(status);
CREATE INDEX idx_user_department ON "User"(department_id);
CREATE INDEX idx_user_lastactive ON "User"("lastActive");

-- Patients
CREATE INDEX idx_patient_mrn ON "Patient"(mrn);
CREATE INDEX idx_patient_status ON "Patient"(status);
```

#### ✅ Composite Indexes (4)
```sql
-- للتقارير والفلترة المتقدمة
CREATE INDEX idx_dispatch_nurse_date 
ON "Dispatch"(assigned_nurse_id, scheduled_date DESC);

CREATE INDEX idx_dispatch_status_priority 
ON "Dispatch"(status, priority DESC);

CREATE INDEX idx_auditlog_user_timestamp 
ON "AuditLog"(user_id, createdAt DESC);

CREATE INDEX idx_dispatch_patient_status 
ON "Dispatch"(patient_id, status);
```

#### ✅ Full Text Search Indexes (2)
```sql
-- البحث السريع
CREATE INDEX idx_user_search 
ON "User" USING GIN(to_tsvector('english', name || ' ' || email));

CREATE INDEX idx_patient_search 
ON "Patient" USING GIN(to_tsvector('english', name || ' ' || medical_history));
```

#### ✅ Partial Indexes (2)
```sql
-- للبيانات النشطة فقط
CREATE INDEX idx_user_active_nurses 
ON "User"(id) WHERE role = 'NURSE' AND status = 'ACTIVE';

CREATE INDEX idx_dispatch_pending 
ON "Dispatch"(id) WHERE status IN ('PENDING', 'ASSIGNED');
```

---

## 🚀 توقعات الأداء

### Query Performance Comparison

#### البحث عن ممرضة بـ ID
| | بدون Index | مع Index |
|---|---|---|
| 1,000 صف | 0.5ms | 0.1ms |
| 100,000 صف | 15ms | 0.2ms |
| 10,000,000 صف | 500ms | 0.3ms |
| **التحسن** | - | **1,500x أسرع** |

#### البحث عن أوامر عمل بـ Status
```sql
-- Query
SELECT * FROM Dispatch 
WHERE status = 'COMPLETED' 
  AND assigned_nurse_id = $1
  AND scheduled_date > $2;

-- بدون Index: ~450ms (مع 1M record)
-- مع Composite Index: ~3ms ✅
```

---

## 📈 Query Optimization Examples

### 1. Query بطيء (N+1 Problem)

```typescript
// ❌ بطيء جداً (1000 query!)
const dispatches = await prisma.dispatch.findMany({ take: 100 })
for (const dispatch of dispatches) {
  const nurse = await prisma.user.findUnique({
    where: { id: dispatch.assigned_nurse_id }
  })
  // 100 queries إضافية! 😱
}

// وقت التنفيذ: ~500ms

// ✅ سريع جداً (1 query فقط)
const dispatches = await prisma.dispatch.findMany({
  include: { assigned_nurse: true },
  take: 100
})

// وقت التنفيذ: ~10ms ⚡
// التحسن: 50x أسرع!
```

### 2. استعلام غير محسّن

```typescript
// ❌ يحمل جميع الأعمدة (بما فيها كلمات المرور!)
const users = await prisma.user.findMany()

// ✅ يحمل الأعمدة المهمة فقط
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
    role: true,
    isOnline: true
  },
  where: { role: 'NURSE', status: 'ACTIVE' }
})

// تقليل النقل: 80% أقل ترافيك ✅
```

### 3. Pagination محسّن

```typescript
// ❌ بطيء (يحسب جميع الصفوف!)
const count = await prisma.dispatch.count()
const dispatches = await prisma.dispatch.findMany({
  skip: 1000,
  take: 10
})

// ✅ سريع (استخدام cursor)
const dispatches = await prisma.dispatch.findMany({
  cursor: { id: lastDispatchId },
  take: 10,
  skip: 1
})

// أو استخدم limit للحد الأقصى
const dispatches = await prisma.dispatch.findMany({
  skip: (page - 1) * 10,
  take: 10,
  orderBy: { createdAt: 'desc' }
})
```

---

## 🔍 Query Analysis

### أوامر البحث والتحليل

```bash
# 1. عرض إحصائيات الـ query
EXPLAIN ANALYZE
SELECT * FROM "Dispatch" 
WHERE status = 'COMPLETED' 
  AND scheduled_date > NOW() - INTERVAL '7 days';

# 2. التحقق من الفهارس المستخدمة
\d+ "Dispatch"

# 3. حساب عدد الصفوف المنقولة
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname != 'pg_catalog';
```

---

## 💾 Database Maintenance

### 1. تحديث الإحصائيات

```sql
-- تحديث statistics للـ query planner
ANALYZE "Dispatch";
ANALYZE "User";
ANALYZE "Patient";

-- أو جميع الجداول
ANALYZE;
```

### 2. إعادة بناء الفهارس

```sql
-- إعادة بناء فهرس واحد
REINDEX INDEX idx_dispatch_nurse_date;

-- إعادة بناء جميع الفهارس
REINDEX DATABASE cure_healthcare;
```

### 3. تنظيف Dead Rows (VACUUM)

```sql
-- تنظيف الصفوف المحذوفة
VACUUM ANALYZE "Dispatch";

-- تنظيف مع غلق (في غير أوقات الذروة)
VACUUM FULL "Dispatch";
```

---

## 📋 Monitoring Queries

### الاستعلامات المهمة للمراقبة

```sql
-- 1. الاستعلامات الأبطأ
SELECT 
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- 2. الفهارس غير المستخدمة
SELECT 
  indexrelname,
  idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0;

-- 3. حجم الجداول
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;

-- 4. حجم الفهارس
SELECT 
  indexname,
  pg_size_pretty(pg_relation_size(indexrelname::regclass)) as size
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelname::regclass) DESC;
```

---

## 🎯 Best Practices

### ✅ DO

```typescript
// 1. استخدم indexes على الأعمدة المستعلمة كثيراً
WHERE status = 'COMPLETED'  // مفهرس ✓
WHERE assigned_nurse_id = $1  // مفهرس ✓

// 2. استخدم Composite Indexes للـ WHERE المتعددة
WHERE status = 'COMPLETED' AND scheduled_date > $1
// composite index على (status, scheduled_date) ✓

// 3. قلل النتائج باستخدام LIMIT
SELECT * FROM Dispatch LIMIT 100  // ✓

// 4. استخدم Select محددة
select: { id: true, name: true }  // ✓

// 5. استخدم Pagination للقوائم الكبيرة
skip: (page - 1) * 10, take: 10  // ✓
```

### ❌ DONT

```typescript
// 1. لا تستخدم wildcard في بداية البحث
WHERE name LIKE '%john%'  // ❌ لا يستخدم index
WHERE name LIKE 'john%'   // ✓ يستخدم index

// 2. لا تستخدم functions على الأعمدة المفهرسة
WHERE LOWER(email) = 'test@example.com'  // ❌
WHERE email = 'test@example.com'  // ✓

// 3. لا تستخدم OR كثيراً
WHERE status = 'A' OR status = 'B' OR status = 'C'  // ❌ بطيء
WHERE status IN ('A', 'B', 'C')  // ✓ سريع

// 4. لا تحمل جميع الحقول
SELECT * FROM Users  // ❌ يشمل passwords!

// 5. لا تستخدم OFFSET كثيراً
OFFSET 100000 LIMIT 10  // ❌ بطيء جداً
استخدم keyset pagination بدلاً من ذلك  // ✓
```

---

## 🔧 Tuning Configuration

### PostgreSQL Configuration for Performance

```ini
# postgresql.conf

# Memory
shared_buffers = 256MB  # 25% من RAM
effective_cache_size = 1GB
maintenance_work_mem = 64MB

# Connections
max_connections = 200
max_prepared_transactions = 10

# Query Planning
random_page_cost = 1.1  # SSD
effective_io_concurrency = 200  # SSD

# Logging
log_min_duration_statement = 1000  # log queries > 1 second
log_statement = 'mod'  # log DML only
```

---

## 📊 Monitoring Dashboard

### الإحصائيات المهمة للمراقبة

```typescript
async function getPerformanceMetrics() {
  const metrics = {
    // Database size
    databaseSize: await prisma.$queryRaw`
      SELECT pg_size_pretty(pg_database_size('cure_healthcare'))
    `,
    
    // Active connections
    activeConnections: await prisma.$queryRaw`
      SELECT count(*) FROM pg_stat_activity
    `,
    
    // Slow queries
    slowQueries: await prisma.$queryRaw`
      SELECT query, mean_exec_time 
      FROM pg_stat_statements 
      ORDER BY mean_exec_time DESC LIMIT 5
    `,
    
    // Cache hit ratio
    cacheHitRatio: await prisma.$queryRaw`
      SELECT 
        sum(heap_blks_read) as heap_blks_read,
        sum(heap_blks_hit) as heap_blks_hit
      FROM pg_statio_user_tables
    `
  }
  
  return metrics
}
```

---

## 📚 مراجع إضافية

- [PostgreSQL Indexes](https://www.postgresql.org/docs/current/indexes.html)
- [Query Performance Tuning](https://www.postgresql.org/docs/current/performance-tips.html)
- [EXPLAIN Command](https://www.postgresql.org/docs/current/sql-explain.html)
- [Prisma Performance](https://www.prisma.io/docs/concepts/components/prisma-client/performance-optimization)

---

**آخر تحديث**: 2026-06-17  
**الحالة**: ✅ محسّن للإنتاج

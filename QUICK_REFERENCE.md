# ⚡ مرجع سريع - أوامر قاعدة البيانات

> اختصارات وأوامر سريعة للعمل اليومي

---

## 🚀 البدء السريع

```bash
# 1️⃣ إعداد قاعدة البيانات
npx prisma migrate dev --name init_schema

# 2️⃣ ملء البيانات الأولية
npx tsx prisma/seed.ts

# 3️⃣ عرض البيانات بشكل بصري
npx prisma studio

# 4️⃣ اختبار العمليات
npm test database

# 5️⃣ بدء التطوير
npm run dev
```

---

## 🔧 أوامر التطوير الشائعة

### Migrations
```bash
# إنشاء migration جديد بعد تغيير schema
npx prisma migrate dev --name [description]

# عرض حالة الـ migrations
npx prisma migrate status

# إعادة تعيين قاعدة البيانات (حذف كل البيانات!)
npx prisma migrate reset

# إنشاء migration بدون تطبيق
npx prisma migrate dev --skip-generate

# تطبيق pending migrations
npx prisma migrate deploy
```

### Prisma Client
```bash
# إعادة توليد Prisma Client
npx prisma generate

# التحقق من schema validity
npx prisma validate

# تنسيق schema file
npx prisma format
```

### Data Management
```bash
# فتح Prisma Studio (UI تفاعلية)
npx prisma studio

# تشغيل seed script
npx tsx prisma/seed.ts

# حذف وإعادة إنشاء قاعدة البيانات
npx prisma migrate reset --force
```

---

## 📊 استعلامات مفيدة

### في Terminal / Node REPL
```bash
# فتح Prisma Interactive REPL
npx prisma studio

# أو استخدم node مباشرة
node -e "const p = require('@prisma/client').PrismaClient; const db = new p(); db.user.findMany().then(console.log).finally(() => db.$disconnect())"
```

### في الكود
```typescript
// ✅ استعلام بسيط
const user = await prisma.user.findUnique({
  where: { id: 'user-id' }
})

// ✅ مع include للعلاقات
const user = await prisma.user.findUnique({
  where: { id: 'user-id' },
  include: { department: true, specializations: true }
})

// ✅ مع filter
const nurses = await prisma.user.findMany({
  where: { role: 'NURSE', status: 'ACTIVE' }
})

// ✅ مع pagination
const dispatches = await prisma.dispatch.findMany({
  skip: 0,
  take: 10
})

// ✅ مع aggregation
const stats = await prisma.dispatch.aggregate({
  _count: { id: true },
  _avg: { actual_duration: true }
})
```

---

## 🧪 اختبار

```bash
# تشغيل جميع الاختبارات
npm test

# اختبارات قاعدة البيانات فقط
npm test database

# مع watch mode
npm test -- --watch

# مع coverage report
npm run test:coverage

# تشغيل test محدد
npm test -- --grep "User Management"
```

---

## 📈 مراقبة الأداء

### PostgreSQL Direct
```bash
# من داخل psql:
EXPLAIN ANALYZE SELECT * FROM "User" WHERE status = 'ACTIVE';

# فحص indexes
SELECT * FROM pg_indexes WHERE tablename = 'User';

# حجم الجداول
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables 
WHERE schemaname != 'pg_catalog' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Prisma Debug
```bash
# تفعيل debug logs
export DEBUG="prisma:*"
npm run dev

# أو في الكود
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
})
```

---

## 🔐 Backup & Recovery

```bash
# Backup قاعدة البيانات
pg_dump $DATABASE_URL > backup.sql

# استعادة من backup
psql $DATABASE_URL < backup.sql

# Export جداول محددة
pg_dump $DATABASE_URL --table="User" --table="Patient" > partial_backup.sql
```

---

## 🐛 استكشاف الأخطاء

### Common Issues

```bash
# ❌ "ERROR: column does not exist"
# ✅ تأكد من تشغيل migration
npx prisma migrate dev

# ❌ "Connection timeout"
# ✅ تحقق من DATABASE_URL و تأكد من PostgreSQL يعمل
echo $DATABASE_URL

# ❌ "Prisma Client not generated"
# ✅ أعد توليد client
npx prisma generate

# ❌ "Foreign key constraint"
# ✅ تأكد من وجود السجلات المرتبطة
# استعرض البيانات بـ Prisma Studio
npx prisma studio
```

### Debug Queries
```typescript
// تفعيل logging
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'stdout' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ]
})

// استخدم $queryRaw للاستعلامات المعقدة
const users = await prisma.$queryRaw`
  SELECT * FROM "User" WHERE status = 'ACTIVE'
`
```

---

## 📁 الملفات الرئيسية

```
التطوير اليومي:
├─ prisma/schema.prisma      ← تعديل البنية
├─ prisma/seed.ts             ← تعديل البيانات الأولية
├─ DATABASE_EXAMPLES.md        ← استعلامات مرجعية
└─ tests/database.test.ts      ← إضافة اختبارات

الاستشارة:
├─ DATABASE_SETUP.md          ← كيفية البدء
├─ DATABASE_PERFORMANCE.md    ← نصائح الأداء
├─ DATABASE_INDEX.md          ← فهرس شامل
└─ prisma/README.md           ← توثيق مفصل

الإنتاج:
├─ DATABASE_COMPLETE.md       ← ملخص الإكمال
└─ DATABASE_SUMMARY.md        ← ملخص المميزات
```

---

## 📋 Checklist يومي

### في البداية
- [ ] فتح Prisma Studio `npx prisma studio`
- [ ] فحص البيانات الحالية
- [ ] التحقق من أي migrations معلقة

### أثناء التطوير
- [ ] اختبار الاستعلامات الجديدة
- [ ] التحقق من الأداء
- [ ] تسجيل التغييرات

### قبل الـ Commit
- [ ] اختبار جميع الاستعلامات `npm test`
- [ ] فحص schema validity `npx prisma validate`
- [ ] التحقق من migration files

---

## 🎯 معايير الأداء

### Target Performance
```
✅ SELECT بـ ID:         < 1ms
✅ SELECT مع filter:    < 5ms
✅ SELECT مع pagination: < 10ms
✅ Aggregation query:   < 20ms
✅ Full text search:    < 10ms
✅ JOIN معقد:          < 50ms
```

### إذا كانت أبطأ:
```bash
# 1️⃣ فحص الـ Query Plan
EXPLAIN ANALYZE SELECT ...

# 2️⃣ تحقق من الفهارس
SELECT * FROM pg_indexes WHERE tablename='User'

# 3️⃣ راجع DATABASE_PERFORMANCE.md
# 4️⃣ أضف فهرس إن لزم الأمر
```

---

## 🔐 متغيرات البيئة

```bash
# في .env.local (لا تحفظ على Git!)
DATABASE_URL="postgresql://user:password@localhost:5432/cure_db"

# Test Database (اختياري)
DATABASE_URL_TEST="postgresql://user:password@localhost:5432/cure_test"

# Debug (اختياري)
DEBUG="prisma:*"
```

---

## 📞 موارد سريعة

```
🎓 التعلم:
   → prisma/README.md
   → DATABASE_EXAMPLES.md
   → DATABASE_PERFORMANCE.md

🚀 البدء:
   → DATABASE_SETUP.md
   → DATABASE_INDEX.md

🐛 المساعدة:
   → DATABASE_COMPLETE.md
   → هذا الملف
```

---

## 💡 نصائح قيّمة

```
1️⃣  استخدم Prisma Studio عند الشك
    $ npx prisma studio

2️⃣  فعّل logging في التطوير
    level: 'query' في PrismaClient

3️⃣  تحقق من EXPLAIN ANALYZE قبل Deploy
    $ EXPLAIN ANALYZE SELECT ...

4️⃣  استخدم transactions للعمليات المعقدة
    $ prisma.$transaction([op1, op2])

5️⃣  قرأ DATABASE_PERFORMANCE.md بانتظام
    → strategies, tips, queries
```

---

**آخر تحديث**: 2026-06-17  
**الإصدار**: 2.0  
**الحالة**: ✅ متكامل وجاهز

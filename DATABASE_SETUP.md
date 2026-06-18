# Database Setup & Migration Guide

> دليل سريع لإعداد وتشغيل قاعدة البيانات PostgreSQL

## 📋 قبل البدء

تأكد من توفر:
- ✅ PostgreSQL مثبت (الإصدار 12+)
- ✅ Node.js مثبت (الإصدار 18+)
- ✅ متغير البيئة `DATABASE_URL` معرّف

```bash
# example .env.local
DATABASE_URL="postgresql://user:password@localhost:5432/cure_healthcare"
```

---

## 🚀 خطوات الإعداد الأول

### 1. إنشاء Migration الأول

```bash
# تطبيق الـ schema على قاعدة البيانات
npx prisma migrate dev --name init_schema
```

يقوم هذا الأمر بـ:
- ✅ إنشاء قاعدة البيانات (إن لم تكن موجودة)
- ✅ تطبيق جميع الـ migrations
- ✅ توليد Prisma Client

### 2. ملء قاعدة البيانات ببيانات الاختبار

```bash
# تشغيل seed script
npx tsx prisma/seed.ts
```

**النتيجة المتوقعة:**
```
🌱 Starting database seed...

🗑️  Clearing existing data...
📋 Creating departments...
✅ Created 3 departments
🎓 Creating specializations...
✅ Created 4 specializations
...
✅ Database seed completed successfully! 🚀

📊 Summary:
   ✓ 3 Departments
   ✓ 4 Specializations
   ✓ 3 Locations
   ✓ 15 Users (1 Admin + 2 Supervisors + 2 Dispatchers + 10 Nurses)
   ✓ 3 Shifts
   ✓ 10 Patients
   ✓ 20 Dispatches
   ✓ Feedback & Audit Logs

🔐 Test Credentials:
   👨‍💼 Admin: admin@cure.com / Admin@123
   👮 Supervisor: supervisor1@cure.com / Super@123
   📞 Dispatcher: dispatcher1@cure.com / Disp@123
   👩‍⚕️ Nurse: nurse1@cure.com / Nurse@123
```

---

## 🔧 أوامر Prisma الأساسية

### عرض قاعدة البيانات بشكل تفاعلي
```bash
npx prisma studio
```

ستفتح واجهة ويب على `http://localhost:5555` تسمح برؤية وتعديل البيانات

### إعادة تعيين قاعدة البيانات (Development فقط ⚠️)
```bash
npx prisma migrate reset
```

**⚠️ تحذير**: سيحذف جميع البيانات والـ migrations ويبدأ من جديد

### إنشاء migration جديد
```bash
npx prisma migrate dev --name add_new_feature
```

### التحقق من الأخطاء
```bash
npx prisma validate
```

---

## 📊 هيكل قاعدة البيانات الكامل

### الجداول الرئيسية:

| الجدول | الوصف | عدد الحقول |
|--------|-------|-----------|
| **User** | المستخدمين (Admins, Nurses, Dispatchers) | 18 |
| **Patient** | المرضى | 16 |
| **Dispatch** | أوامر العمل | 20 |
| **Department** | الأقسام | 7 |
| **Shift** | الورديات | 7 |
| **Specialization** | التخصصات | 4 |
| **Location** | المواقع الجغرافية | 7 |
| **Feedback** | التقييمات | 11 |
| **AuditLog** | سجل التدقيق | 10 |
| **ActivityLog** | سجل النشاط | 9 |
| **Notification** | التنبيهات | 8 |

**المجموع: 11 جدول رئيسي + جداول وسيطة**

---

## 🔐 البيانات الأولية المُنشأة

### المستخدمين (15)
```
👨‍💼 Admin (1)
   └─ admin@cure.com

👮 Supervisors (2)
   ├─ supervisor1@cure.com (Emergency)
   └─ supervisor2@cure.com (Cardiology)

📞 Dispatchers (2)
   ├─ dispatcher1@cure.com (Emergency)
   └─ dispatcher2@cure.com (Cardiology)

👩‍⚕️ Nurses (10)
   ├─ nurse1@cure.com - Emergency
   ├─ nurse2@cure.com - Cardiology
   ├─ nurse3@cure.com - Oncology
   └─ ... 7 ممرضات أخريات
```

### المرضى (10)
- جميعهم لديهم MRN فريد
- معلومات طبية كاملة
- تاريخ طبي وحساسيات

### أوامر العمل (20)
- حالات متنوعة (Pending, Assigned, In Progress, Completed)
- أولويات مختلفة
- تخصيص لممرضات محددة

---

## 📈 ملاحظات الأداء

### الفهارس المُنشأة تلقائياً:

✅ **Single Column Indexes**
```sql
idx_user_email
idx_user_role
idx_user_status
idx_dispatch_status
idx_dispatch_priority
idx_dispatch_scheduled_date
idx_dispatch_nurse_id
```

✅ **Composite Indexes**
```sql
idx_dispatch_nurse_date (assigned_nurse_id, scheduled_date)
idx_dispatch_status_priority (status, priority)
```

✅ **Full Text Search** (للبحث السريع)
```sql
idx_user_search (name, email)
idx_patient_search (name)
```

### توقعات الأداء:
- **Query بدون Index**: ~500ms (مع 1M records)
- **Query مع Index**: ~5ms ⚡
- **تحسن الأداء: 100x أسرع**

---

## 🛠️ استكشاف الأخطاء

### الخطأ: `DATABASE_URL not found`
```bash
# الحل: تأكد من وجود متغير البيئة
echo DATABASE_URL=$DATABASE_URL
```

### الخطأ: `Connection refused`
```bash
# الحل: تأكد من تشغيل PostgreSQL
# Windows
services.msc  # ابحث عن postgresql

# macOS
brew services list
brew services start postgresql

# Linux
sudo service postgresql start
```

### الخطأ: `Permission denied`
```bash
# الحل: تحقق من بيانات الاعتماد
psql -U postgres -h localhost
```

### إعادة تعيين كاملة
```bash
# إذا فشل شيء ما، جرب:
npx prisma migrate reset --force
```

---

## 📚 ملفات مرجعية

| الملف | الوصف |
|------|-------|
| [schema.prisma](./schema.prisma) | تعريف جميع الجداول والعلاقات |
| [README.md](./README.md) | توثيق مفصل لقاعدة البيانات |
| [seed.ts](./seed.ts) | بيانات الاختبار الأولية |
| [migrations/](./migrations/) | سجل جميع التغييرات |

---

## 🚀 الخطوة التالية

بعد الإعداد الناجح:

1. **تسجيل الدخول** بأحد الحسابات الاختبار
2. **استعرض البيانات** في Prisma Studio
3. **ابدأ بالتطوير** باستخدام الـ API

---

## ✅ Checklist الإعداد الكامل

- [ ] PostgreSQL مثبت وقيد التشغيل
- [ ] DATABASE_URL معرّف في .env
- [ ] تشغيل `npx prisma migrate dev --name init_schema`
- [ ] تشغيل `npx tsx prisma/seed.ts`
- [ ] التحقق من بيانات الاختبار في Prisma Studio
- [ ] تسجيل دخول ناجح بـ admin@cure.com
- [ ] توثيق البيانات كاملة

---

**آخر تحديث**: 2026-06-17  
**الحالة**: ✅ جاهز للإنتاج

# 🔧 استكشاف خطأ تسجيل الدخول

## ❌ الخطأ: "Invalid response from server"

هذا الخطأ يعني أن قاعدة البيانات **فارغة أو لم تُعدّ بشكل صحيح**.

---

## ✅ الحل السريع (اتبع الخطوات بالترتيب)

### الخطوة 1️⃣: تأكد من قاعدة البيانات

```bash
# تحقق من وجود قاعدة البيانات
psql -U postgres -l | grep cure_portal

# إذا لم توجد، أنشئها
createdb cure_portal
```

### الخطوة 2️⃣: شغّل الترحيلات

```bash
# أنشئ جداول قاعدة البيانات
npx prisma migrate dev --name init
```

**يجب أن ترى رسالة "Your database is now in sync with your schema"**

### الخطوة 3️⃣: أضف البيانات الأولية

```bash
# أنشئ المستخدمين والمرضى والطلبات
npx prisma db seed
```

**يجب أن ترى رسائل:**
```
Starting seed...
Cleared existing data
Created Users: 1 Admin, 1 Dispatcher, 3 Nurses
Created 5 Patients
Created 10 Dispatches
Seed completed successfully
```

### الخطوة 4️⃣: تحقق من البيانات

```bash
# افتح واجهة قاعدة البيانات
npx prisma studio
```

انتظر حتى يفتح المتصفح، ثم:
- انقر على **User** على اليسار
- تأكد من وجود المستخدمين الثلاثة:
  - ✓ admin@cure.com
  - ✓ dispatcher@cure.com
  - ✓ nurse1@cure.com

### الخطوة 5️⃣: أعد التشغيل

```bash
# اقتل الخوادم الحالية (Ctrl+C في كل طرفية)

# شغّل من جديد
npm run dev              # الطرفية 1
npm run dev:socket      # الطرفية 2
```

### الخطوة 6️⃣: حاول تسجيل الدخول مرة أخرى

استخدم:
```
البريد: dispatcher@cure.com
كلمة المرور: Disp@123
```

---

## 🔍 التحقق من الأخطاء المتقدمة

إذا ظهر الخطأ مرة أخرى:

### 1. افتح DevTools (F12)

**اذهب إلى:**
- Console → ابحث عن الأخطاء الحمراء
- Network → اضغط على طلب `login` → اعرض Response

### 2. تحقق من خادم الواجهة الأمامية

في طرفية `npm run dev`:
- ابحث عن رسائل خطأ حمراء
- انسخ الرسالة كاملة

### 3. تحقق من قاعدة البيانات

```bash
# اختبر الاتصال
psql $DATABASE_URL

# اعرض المستخدمين
psql $DATABASE_URL -c "SELECT email, role FROM \"User\";"
```

**يجب أن ترى:**
```
         email         |   role
-----------------------+-----------
 admin@cure.com        | ADMIN
 dispatcher@cure.com   | DISPATCHER
 nurse1@cure.com       | NURSE
 nurse2@cure.com       | NURSE
 nurse3@cure.com       | NURSE
(5 rows)
```

---

## 🆘 الأخطاء الشائعة

### ❌ "psql: error: connection refused"
```bash
# PostgreSQL لم يكن مشغلاً
# ابدأ PostgreSQL:
# macOS: brew services start postgresql
# Windows: Open Services > PostgreSQL
# Linux: sudo systemctl start postgresql
```

### ❌ "database cure_portal does not exist"
```bash
createdb cure_portal
npx prisma migrate dev --name init
```

### ❌ "relation \"User\" does not exist"
```bash
# الترحيلات لم تُشغّل
npx prisma migrate dev --name init
```

### ❌ "No users in database"
```bash
# البيانات الأولية لم تُضف
npx prisma db seed
```

### ❌ "Port 3000 already in use"
```bash
# اقتل البروسيس القديم:
lsof -i :3000
kill -9 <PID>

# أو استخدم منفذ مختلف:
PORT=3001 npm run dev
```

---

## 📝 ملخص الأوامر الكاملة

إذا أردت البدء من الصفر:

```bash
# 1. امسح وأنشئ من جديد (احذر! سيحذف كل البيانات)
npx prisma migrate reset

# 2. أعد التشغيل
npm run dev              # Terminal 1
npm run dev:socket      # Terminal 2

# 3. افتح المتصفح
# http://localhost:3000

# 4. استخدم بيانات الاختبار
dispatcher@cure.com / Disp@123
```

---

## ✅ خطوات التحقق

- [ ] PostgreSQL قيد التشغيل
- [ ] قاعدة البيانات `cure_palace` موجودة
- [ ] الترحيلات تمت بنجاح
- [ ] البيانات الأولية تمت بنجاح
- [ ] الخوادم مشغلة (Frontend + Socket)
- [ ] المتصفح على `http://localhost:3000`
- [ ] يمكنك رؤية الجداول في Prisma Studio

---

## 🚀 إذا نجح كل شيء

ستعرض الشاشة:

```
✓ تسجيل الدخول ناجح
✓ إعادة توجيه إلى لوحة التحكم
✓ عرض البيانات الحية
```

---

## 💡 نصيحة إضافية

إذا أردت البدء بسرعة بدون كتابة الأوامر:

```bash
bash quick-setup.sh
```

هذا سيفعل كل شيء تلقائياً! ✨

---

**إذا استمرت المشكلة:**
1. انسخ الرسالة من الـ Console في DevTools
2. اقرأ ملف TROUBLESHOOTING.md
3. تحقق من أن DATABASE_URL صحيحة في `.env.local`

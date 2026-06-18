# 🆘 مشكلة تسجيل الدخول - الحل الفوري

## المشكلة:
```
Invalid response from server. Please refresh and try again.
```

---

## ⚡ الحل (اتبع 3 خطوات فقط):

### 1️⃣ تشخيص سريع

شغّل هذا الأمر:
```bash
bash diagnose.sh
```

سيخبرك إن كانت هناك مشكلة وأين.

---

### 2️⃣ الحل الأساسي

إذا قال أن "no users in database"، شغّل:
```bash
# إنشاء قاعدة البيانات من الصفر
npx prisma migrate reset
```

ستظهر:
```
✓ Successfully reset your database.
✓ Prisma schema has been pushed to the database.
✓ Database has been seeded with 10 dispatches.
```

---

### 3️⃣ أعد التشغيل

```bash
# في الطرفية 1:
npm run dev

# في الطرفية 2:
npm run dev:socket
```

---

## 🔐 حاول تسجيل الدخول:

```
البريد: dispatcher@cure.com
كلمة المرور: Disp@123
```

---

## ✅ إذا نجح = الخطأ انتهى ✨

إذا فشل = اتبع الخطوات الكاملة أدناه:

---

## 📖 الحل الكامل (إذا استمرت المشكلة)

### الخطوة 1: تأكد من PostgreSQL

```bash
# تحقق من التشغيل
psql -U postgres -l

# إذا فشل، شغّل PostgreSQL:
# macOS:
brew services start postgresql

# Windows:
# اذهب إلى Services > PostgreSQL > Start

# Linux:
sudo systemctl start postgresql
```

### الخطوة 2: تأكد من البيئة

```bash
# اعرض متغيرات البيئة
cat .env.local

# يجب أن تحتوي على:
# DATABASE_URL=postgresql://...
# JWT_SECRET=...
```

### الخطوة 3: نظّف وأعد البناء

```bash
# حذف cache
rm -rf .next
rm -rf node_modules/.vite

# أعد الترحيلات
npx prisma migrate reset

# أعد التشغيل
npm run dev
npm run dev:socket
```

---

## 🔍 تحقق من البيانات مباشرة

```bash
# افتح واجهة البيانات
npx prisma studio
```

يجب أن ترى:
- ✅ User
- ✅ Patient
- ✅ Dispatch
- ✅ AuditLog

---

## 🆘 ما زالت المشكلة؟

### افتح DevTools (F12)

1. اذهب إلى **Console** tab
2. ابحث عن رسائل حمراء
3. انسخها وابحث عنها في `TROUBLESHOOTING.md`

### تحقق من الخادم

في طرفية `npm run dev`:
- ابحث عن أي رسائل خطأ حمراء
- تأكد من عدم وجود "404" أو "error"

---

## ⏱️ الملخص السريع جداً

```bash
# كل شيء في سطر واحد:
npx prisma migrate reset && npm run dev
```

ثم في طرفية أخرى:
```bash
npm run dev:socket
```

---

**يجب أن يعمل الآن! 🎉**

إذا لم يعمل، اقرأ `LOGIN_TROUBLESHOOTING.md` للحل الكامل.

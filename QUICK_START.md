# 🚀 CURE Portal - دليل التشغيل السريع

## ⚡ البدء الفوري (5 دقائق)

### المتطلبات الأساسية
```
✓ Node.js 18+
✓ PostgreSQL 12+
✓ Git
```

---

## 📝 الخطوة 1: الإعداد

```bash
# استنساخ المشروع
git clone <repo-url>
cd cure

# نسخ ملف البيئة
cp .env.example .env.local

# تثبيت المكتبات
npm install
```

### تحديث `.env.local` بـ:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/cure_portal
JWT_SECRET=اكتب-سر-قوي-32-حرف-على-الأقل
SOCKET_PORT=3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NODE_ENV=development
```

---

## 🗄️ الخطوة 2: قاعدة البيانات

```bash
# إنشاء قاعدة البيانات
createdb cure_portal

# تشغيل الترحيلات
npx prisma migrate dev --name init

# إضافة بيانات تجريبية (اختياري)
npx prisma db seed
```

---

## 🎯 الخطوة 3: التشغيل

### **الطرفية 1️⃣ - الواجهة الأمامية + API**
```bash
npm run dev
```
✅ سيفتح على: `http://localhost:3000`

### **الطرفية 2️⃣ - خادم Socket.IO** (Real-time)
```bash
npm run dev:socket
```
✅ سيعمل على: `http://localhost:3001`

---

## 🔐 بيانات الاختبار

```
البريد الإلكتروني: admin@example.com
كلمة المرور: password
الدور: ADMIN
```

---

## 📊 الوصول إلى الأدوات

| الأداة | الرابط | الوصف |
|------|--------|-------|
| الواجهة | `http://localhost:3000` | تطبيق CURE |
| قاعدة البيانات GUI | `npx prisma studio` | استعراض البيانات |
| API Docs | `FRONTEND_BACKEND_SETUP.md` | توثيق API |

---

## 🔧 أوامر مهمة

```bash
# الاختبار
npm run test
npm run test:coverage

# البناء
npm run build

# التحقق من الإعدادات
bash setup-check.sh

# إعادة تعيين قاعدة البيانات (للتطوير فقط)
npx prisma migrate reset
```

---

## ⚠️ استكشاف الأخطاء الشائعة

### ❌ "DATABASE_URL not found"
```bash
# تأكد من وجود .env.local مع DATABASE_URL
echo $DATABASE_URL
```

### ❌ "Cannot connect to database"
```bash
# تأكد من تشغيل PostgreSQL
psql -U postgres

# اختبر الاتصال
psql $DATABASE_URL
```

### ❌ "Port 3000 already in use"
```bash
# شغل على منفذ مختلف
PORT=3001 npm run dev
```

### ❌ "Socket.IO not connecting"
```bash
# تأكد من تشغيل الخادم الثاني
npm run dev:socket

# تأكد من المنفذ 3001 مفتوح
```

### ❌ "Can't login"
```bash
# امسح ملفات تعريف الارتباط
# DevTools > Application > Cookies > احذف auth-token

# أعد تحميل الصفحة وحاول مرة أخرى
```

---

## 📁 هيكل المشروع الأساسي

```
cure/
├── app/                    # الواجهة الأمامية
│   ├── api/               # API Routes (Backend)
│   ├── (dashboard)/       # صفحات لوحة التحكم
│   ├── components/        # المكونات
│   └── lib/               # المكتبات المساعدة
├── backend/               # خدمات الخادم
│   └── services/          # منطق العمل
├── prisma/
│   └── schema.prisma      # نموذج قاعدة البيانات
└── .env.local             # متغيرات البيئة
```

---

## 🎯 المسارات الرئيسية

```
/login                      → صفحة تسجيل الدخول
/                           → لوحة التحكم الرئيسية
/admin/users                → إدارة المستخدمين
/admin/nurses               → إدارة الممرضات
/analytics                  → لوحة التحليلات
/operations/kanban          → لوحة Kanban التفاعلية
```

---

## 📡 API الأساسية

```bash
# المصادقة
POST /api/auth/login              # تسجيل الدخول
GET /api/auth/me                  # بيانات المستخدم الحالي
POST /api/auth/logout             # تسجيل الخروج

# الطلبات
GET /api/dispatches               # قائمة الطلبات
POST /api/dispatches              # إنشاء طلب جديد
PATCH /api/dispatches/:id         # تحديث حالة الطلب

# المستخدمين
GET /api/users                    # قائمة المستخدمين
POST /api/users                   # إنشاء مستخدم جديد

# التحليلات
GET /api/analytics                # بيانات لوحة التحكم
```

---

## 🔄 دورة العمل النموذجية

### 1️⃣ تسجيل الدخول
```
admin@example.com / password
```

### 2️⃣ إنشاء طلب جديد
```
/operations/kanban → New Dispatch → اختر مريض → حفظ
```

### 3️⃣ تعيين ممرضة
```
اسحب الطلب إلى ASSIGNED → اختر ممرضة
```

### 4️⃣ تحديث الحالة
```
اسحب الطلب عبر الأعمدة الخمسة
```

### 5️⃣ عرض الإحصائيات
```
/analytics → اعرض المقاييس الحية
```

---

## 💡 نصائح مهمة

✅ استخدم `npx prisma studio` لرؤية البيانات مباشرة  
✅ افتح DevTools (F12) لرؤية السجلات والأخطاء  
✅ تأكد من أن الطرفيتين تعملان (Frontend + Socket)  
✅ امسح ذاكرة التخزين المؤقت إذا رأيت مشاكل غريبة  
✅ اقرأ TROUBLESHOOTING.md للمشاكل المعقدة  

---

## 📞 الحصول على المساعدة

| المشكلة | الحل |
|--------|------|
| **الإعداد** | اقرأ `FRONTEND_BACKEND_SETUP.md` |
| **التحقق** | اشغل `bash setup-check.sh` |
| **الأخطاء** | اقرأ `TROUBLESHOOTING.md` |
| **المعمارية** | اقرأ `ARCHITECTURE_DIAGRAM.md` |

---

## ✅ تحقق من التشغيل الناجح

- [ ] تم فتح `http://localhost:3000` بدون أخطاء
- [ ] تمكنت من تسجيل الدخول
- [ ] ظهرت البيانات في لوحة التحكم
- [ ] يعمل Socket.IO (شريط أخضر في الأعلى)
- [ ] يمكنك إنشاء طلب جديد
- [ ] الكانبان يعمل (السحب والإفلات)

---

## 🚀 جاهز للإنطلاق!

```bash
# الشيء الوحيد الذي تحتاجه:

# الطرفية 1:
npm run dev

# الطرفية 2:
npm run dev:socket

# ثم افتح:
http://localhost:3000
```

**استمتع بـ CURE Portal! 🎉**

---

**آخر تحديث**: 16 يونيو 2026  
**الإصدار**: 1.0.0  
**الحالة**: جاهز للإنتاج ✅

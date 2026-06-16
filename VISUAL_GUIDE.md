# 🎨 رحلة البيانات - تصور بصري

> كيف تتحرك البيانات عبر النظام

---

## 📍 رحلة أمر العمل (Dispatch Journey)

```
┌─────────────────────────────────────────────────────────────────┐
│                     حياة أمر العمل الكاملة                        │
└─────────────────────────────────────────────────────────────────┘

1️⃣ CREATE (الإنشاء)
   ┌──────────────┐
   │   PENDING    │  ← تم إنشاء أمر جديد
   └──────────────┘
   Data Captured:
   ✓ dispatch_number (فريد)
   ✓ patient_id (الربط)
   ✓ service_type (نوع الخدمة)
   ✓ priority (الأولوية)
   ✓ status = PENDING

2️⃣ ASSIGN (التعيين)
   ┌──────────────┐
   │  ASSIGNED    │  ← تم تعيين لممرضة
   └──────────────┘
   Data Updated:
   ✓ assigned_nurse_id (الممرضة)
   ✓ supervisor_id (المشرف)
   ✓ assigned_date (تاريخ التعيين)

3️⃣ PROGRESS (البداية)
   ┌──────────────┐
   │ IN_PROGRESS  │  ← الممرضة بدأت العمل
   └──────────────┘
   Data Updated:
   ✓ start_time (وقت البدء)
   ✓ location_id (الموقع)

4️⃣ COMPLETE (الانتهاء)
   ┌──────────────┐
   │  COMPLETED   │  ← انتهت الخدمة
   └──────────────┘
   Data Captured:
   ✓ completion_time (وقت الانتهاء)
   ✓ actual_duration (المدة الفعلية)

5️⃣ FEEDBACK (التقييم)
   ┌──────────────┐
   │  + Feedback  │  ← تقييم الجودة
   └──────────────┘
   Data Captured:
   ✓ rating (التقييم العام)
   ✓ timeliness (الالتزام بالموعد)
   ✓ professionalism (الاحترافية)
   ✓ knowledge (المعرفة)
   ✓ communication (التواصل)
   ✓ quality (الجودة)

📊 TRACKING (التتبع)
   كل خطوة يتم حفظها في:
   ✓ AuditLog (سجل التدقيق)
   ✓ ActivityLog (سجل النشاط)
   ✓ Notification (تنبيهات)
```

---

## 👥 هيكل المستخدمين

```
                         ┌─────────┐
                         │  ADMIN  │
                         └────┬────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
         ┌──────▼──────┐ ┌───▼────────┐ ┌─▼──────┐
         │SUPERVISORS  │ │DISPATCHERS │ │ NURSES │
         │  (إشراف)    │ │ (جدولة)    │ │(تنفيذ) │
         └──────┬──────┘ └───┬────────┘ └─┬──────┘
                │             │           │
         ┌──────▼──────┐ ┌───▼────────┐ ┌─▼──────────┐
         │ Manage Team │ │Create Work │ │Execute Work│
         │Track Perf   │ │  Orders    │ │ Report Done│
         │Approve QA   │ │ Assign Job │ │ Get Rating │
         └─────────────┘ └────────────┘ └────────────┘

            القسم
              │
         ┌────▼────┐
         │     4 التخصصات
         │ ┌─ Emergency Care
         │ ├─ Cardiac Care
         │ ├─ Oncology Nursing
         │ └─ Wound Care
         │
         └────┬────┐
              │    │
        الورديات  الممرضات
         (3)      (10+)
```

---

## 🏥 تدفق المريض

```
مريض جديد
    │
    └─► Patient Record
        ├─ MRN (رقم ملف طبي)
        ├─ Medical History
        ├─ Allergies
        ├─ Chronic Conditions
        ├─ Current Medications
        └─ Location
            │
            └─► Ready for Dispatch
                │
                └─► Dispatch Created
                    ├─ Service Type (نوع الخدمة)
                    ├─ Priority (الأولوية)
                    ├─ Date/Time
                    ├─ Location
                    └─ Notes
                        │
                        └─► Assigned to Nurse
                            ├─ Nurse Info
                            ├─ Specialty Match
                            ├─ Availability
                            └─ Location Proximity
                                │
                                └─► Care Delivered
                                    ├─ Check-in
                                    ├─ Service Provided
                                    ├─ Observations
                                    ├─ Duration
                                    └─ Patient Feedback
```

---

## 🔄 تدفق البيانات الرئيسي

```
┌─────────────────────────────────────────────────────────────┐
│                     CURE DATABASE                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────┐    ┌──────────────┐    ┌────────────┐  │
│  │ INPUT LAYER  │    │ PROCESS      │    │ OUTPUT     │  │
│  ├───────────────┤    ├──────────────┤    ├────────────┤  │
│  │               │    │              │    │            │  │
│  │ 👤 Users      │    │ 🔍 Business  │    │ 📊 Reports │  │
│  │ 🏥 Patients   │───▶│    Logic     │───▶│ 📈 Stats   │  │
│  │ 📋 Dispatches │    │ ✅ Quality   │    │ 🎯 Metrics │  │
│  │ ⭐ Feedback   │    │ 🔐 Security  │    │ 🔔 Alerts  │  │
│  │               │    │              │    │            │  │
│  └───────────────┘    └──────────────┘    └────────────┘  │
│        │                      │                  │         │
│        ▼                      ▼                  ▼         │
│  ┌────────────────────────────────────────────────────┐   │
│  │         🗄️ CORE STORAGE (13 Tables)              │   │
│  │  User │ Department │ Specialization │ Shift      │   │
│  │  Patient │ Location │ Dispatch │ Feedback        │   │
│  │  AuditLog │ ActivityLog │ Notification │ Junctions     │   │
│  └────────────────────────────────────────────────────┘   │
│        │                      │                  │         │
│        └──────────┬───────────┴────────┬─────────┘         │
│                   │                    │                   │
│            ⚡ INDEXES (15+)     ✅ CONSTRAINTS            │
│            📊 STATISTICS        🔐 FOREIGN KEYS           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 طبقات الأمان

```
User Request
    │
    ▼
┌─────────────────────┐
│ Authentication      │  ← تحقق من الهوية
│ (User ID & Role)    │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Authorization       │  ← تحقق من الصلاحيات
│ (Role-Based Access) │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Validation          │  ← تحقق من البيانات
│ (Zod Schemas)       │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Database Operation  │  ← نفذ العملية
│ (Prisma)            │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Audit Logging       │  ← سجّل الإجراء
│ (AuditLog)          │
└────────┬────────────┘
         │
         ▼
Response Success ✅
```

---

## 📊 قنوات التقرير

```
Raw Data (الجداول)
    │
    ├─► Query 1: User Performance
    │   └─ Dispatch count
    │   └─ Average duration
    │   └─ Quality rating
    │
    ├─► Query 2: Service Distribution
    │   └─ By service type
    │   └─ By priority
    │   └─ By status
    │
    ├─► Query 3: Quality Metrics
    │   └─ Timeliness
    │   └─ Professionalism
    │   └─ Knowledge
    │   └─ Communication
    │
    └─► Query 4: Department Analytics
        └─ Workload distribution
        └─ Performance trends
        └─ Resource utilization

         ▼
    📊 Dashboard
    (يعرض جميع التقارير بصرياً)
```

---

## 🔄 دورة حياة البيانات

```
Generation (توليد)
    │
    │ ✓ مستخدم ينشئ أمر
    │ ✓ نظام يعيّن موارد
    │
    ▼
┌──────────────┐
│   Storage    │  الجداول الأساسية
│ (13 Tables)  │  User, Dispatch, Patient...
└──────┬───────┘
       │
       │ ✓ Indexes تسريع البحث
       │ ✓ Constraints تحافظ على الجودة
       │
       ▼
┌──────────────┐
│ Processing   │
│ (Queries)    │  استخراج البيانات
└──────┬───────┘
       │
       │ ✓ AuditLog تسجل التغييرات
       │ ✓ ActivityLog تسجل الأنشطة
       │
       ▼
┌──────────────┐
│ Analysis     │
│ (Reports)    │  تحليل واستخلاص
└──────┬───────┘
       │
       │ ✓ Statistics تجميع البيانات
       │ ✓ Metrics قياس الأداء
       │
       ▼
┌──────────────┐
│ Presentation │
│ (Dashboard)  │  عرض النتائج
└──────────────┘
```

---

## 🎯 تخطيط الورديات

```
Department: Emergency

┌─────────────────────────────────────────┐
│         3 Shifts (ورديات)               │
├─────────────────────────────────────────┤
│                                         │
│  Morning (صباح)    06:00 - 14:00       │
│  ├─ Nurse 1                            │
│  ├─ Nurse 2                            │
│  ├─ Nurse 3                            │
│  └─ Max 5 nurses                       │
│                                         │
│  Afternoon (مساء)  14:00 - 22:00       │
│  ├─ Nurse 4                            │
│  ├─ Nurse 5                            │
│  ├─ Nurse 6                            │
│  └─ Max 5 nurses                       │
│                                         │
│  Night (ليل)       22:00 - 06:00       │
│  ├─ Nurse 7                            │
│  ├─ Nurse 8                            │
│  ├─ Nurse 9                            │
│  └─ Max 4 nurses                       │
│                                         │
└─────────────────────────────────────────┘

Assignment:
  Nurse 1 → Morning (01/06 - 30/06)
  Nurse 2 → Afternoon (01/06 - 30/06)
  Nurse 3 → Night (01/06 - 15/06)
  ...
```

---

## 🎪 حركة أمر عمل (Dispatch Movement)

```
START: Pending
  │
  ├─ (0 دقيقة) اُنشئ أمر
  │  └─ في: Queue
  │  └─ بحالة: PENDING
  │
  ▼ ⏱️ +30 دقيقة
  
ASSIGNED: تم التعيين
  │
  ├─ (30 دقيقة) عيّن ممرضة
  │  └─ في: Nurse's Queue
  │  └─ بحالة: ASSIGNED
  │
  ▼ ⏱️ +10 دقائق
  
IN_PROGRESS: قيد الإنجاز
  │
  ├─ (40 دقيقة) بدأت الممرضة
  │  └─ في: Patient's Home
  │  └─ بحالة: IN_PROGRESS
  │
  ▼ ⏱️ +45 دقيقة
  
COMPLETED: اكتمل
  │
  ├─ (85 دقيقة) انتهت الخدمة
  │  └─ في: Completed Queue
  │  └─ بحالة: COMPLETED
  │
  ▼ ⏱️ +5 دقائق
  
FEEDBACK: التقييم
  │
  ├─ (90 دقيقة) أضيف التقييم
  │  └─ في: Quality System
  │  └─ بحالة: RATED (5 نجوم)
  │
  ▼ ✅
  
ARCHIVED: مؤرشف
  └─ في: History
  └─ بحالة: COMPLETE & RATED
```

---

## 📈 من الصفر إلى المستقبل

```
Week 1: Development Setup
  ├─ قراءة الدليل
  ├─ تشغيل البيانات الأولية
  ├─ فهم البنية
  └─ كتابة أول feature

Week 2-3: API Development
  ├─ بناء endpoints
  ├─ اختبار العمليات
  ├─ تحسين الأداء
  └─ توثيق الـ APIs

Week 4: Testing & QA
  ├─ اختبارات شاملة
  ├─ اختبار الحمل
  ├─ اختبار الأمان
  └─ إصلاح الأخطاء

Week 5-6: Deployment
  ├─ تحضير الإنتاج
  ├─ مراقبة الأداء
  ├─ تدريب الفريق
  └─ Launch رسمي

Future: Maintenance
  ├─ مراقبة مستمرة
  ├─ إضافة features جديدة
  ├─ تحسينات الأداء
  └─ دعم المستخدمين
```

---

## 🎓 منحنى التعلم

```
Hour 1: Setup & Basic Understanding
   ████░░░░░░░░░░░░░░░░ 20%

Hour 2-4: Learning Schema & Examples
   ████████████░░░░░░░░ 60%

Day 2: Practical Implementation
   ████████████████░░░░ 80%

Week 1: Mastery
   ████████████████████ 100%

الخط الأحمر = النقطة التي يمكنك فيها:
  ✓ كتابة استعلامات معقدة
  ✓ بناء features جديدة
  ✓ حل المشاكل التقنية
  ✓ تحسين الأداء
  ✓ تدريب الآخرين
```

---

**Visual Guide Complete** ✅  
*آخر تحديث: 2026-06-17*

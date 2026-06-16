# Database Usage Examples

> أمثلة عملية على كيفية استخدام قاعدة البيانات مع Prisma

## 🔍 أمثلة الاستعلامات

### 1. الحصول على جميع الممرضات النشطات

```typescript
// ✅ الطريقة الصحيحة (مع تحسينات الأداء)
const activeNurses = await prisma.user.findMany({
  where: {
    role: 'NURSE',
    status: 'ACTIVE',
    isOnline: true
  },
  select: {
    id: true,
    name: true,
    email: true,
    phone: true,
    department: { select: { name: true } },
    specializations: {
      include: { specialization: true }
    },
    _count: {
      select: {
        dispatches: {
          where: { status: 'IN_PROGRESS' }
        }
      }
    }
  },
  orderBy: { name: 'asc' }
})

// النتيجة:
// [
//   {
//     id: 'cuid123',
//     name: 'Nurse A',
//     email: 'nurse1@cure.com',
//     phone: '+201234567890',
//     department: { name: 'Emergency' },
//     specializations: [
//       { specialization: { name: 'Emergency Care' } }
//     ],
//     _count: { dispatches: 3 }
//   },
//   ...
// ]
```

### 2. إسناد أمر عمل إلى ممرضة

```typescript
async function assignDispatchToNurse(dispatchId: string, nurseId: string) {
  const dispatch = await prisma.dispatch.update({
    where: { id: dispatchId },
    data: {
      assigned_nurse_id: nurseId,
      status: 'ASSIGNED',
      assigned_date: new Date()
    },
    include: {
      assigned_nurse: { select: { name: true, email: true } },
      patient: { select: { name: true, phone: true } }
    }
  })

  // تسجيل في سجل النشاط
  await prisma.activityLog.create({
    data: {
      user_id: supervisorId,
      dispatch_id: dispatchId,
      action: 'DISPATCH_ASSIGNED',
      description: `Dispatch assigned to ${dispatch.assigned_nurse.name}`,
      metadata: {
        previousNurse: null,
        newNurse: nurseId
      }
    }
  })

  return dispatch
}
```

### 3. البحث عن مريض بـ MRN

```typescript
const patient = await prisma.patient.findUnique({
  where: { mrn: 'MRN-20240001' },
  include: {
    location: true,
    dispatches: {
      orderBy: { scheduled_date: 'desc' },
      take: 10,
      include: {
        assigned_nurse: { select: { name: true } }
      }
    }
  }
})
```

### 4. الحصول على إحصائيات الممرضات

```typescript
// معدل إكمال المهام
const nurseStats = await prisma.user.findMany({
  where: { role: 'NURSE' },
  select: {
    id: true,
    name: true,
    email: true,
    _count: {
      select: {
        dispatches: {
          where: { status: 'COMPLETED' }
        }
      }
    }
  }
})

// أو باستخدام aggregation
const stats = await prisma.dispatch.groupBy({
  by: ['assigned_nurse_id'],
  where: { status: 'COMPLETED' },
  _count: { id: true },
  _avg: { actual_duration: true }
})

// النتيجة:
// [
//   {
//     assigned_nurse_id: 'cuid123',
//     _count: { id: 15 },
//     _avg: { actual_duration: 45.5 }
//   }
// ]
```

### 5. تقرير الأداء اليومي

```typescript
async function getDailyPerformanceReport(date: Date) {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const report = await prisma.dispatch.findMany({
    where: {
      completion_time: {
        gte: startOfDay,
        lte: endOfDay
      }
    },
    include: {
      assigned_nurse: { select: { name: true } },
      patient: { select: { name: true } },
      feedback: true
    },
    orderBy: { completion_time: 'desc' }
  })

  return report
}
```

---

## 🔄 عمليات متقدمة

### 1. Transaction - تحديث متعدد آمن

```typescript
async function transferDispatch(
  dispatchId: string,
  fromNurseId: string,
  toNurseId: string,
  supervisorId: string
) {
  const result = await prisma.$transaction(async (tx) => {
    // تحديث الـ dispatch
    const dispatch = await tx.dispatch.update({
      where: { id: dispatchId },
      data: { assigned_nurse_id: toNurseId }
    })

    // تسجيل في الـ audit log
    await tx.auditLog.create({
      data: {
        user_id: supervisorId,
        action: 'DISPATCH_TRANSFERRED',
        entity_type: 'Dispatch',
        entity_id: dispatchId,
        old_values: { nurse_id: fromNurseId },
        new_values: { nurse_id: toNurseId }
      }
    })

    return dispatch
  })

  return result
}
```

### 2. Pagination - استعلام محدود

```typescript
async function getDispatchesPaginated(
  page: number = 1,
  pageSize: number = 10,
  status?: string
) {
  const skip = (page - 1) * pageSize

  const [dispatches, total] = await Promise.all([
    prisma.dispatch.findMany({
      where: {
        ...(status && { status })
      },
      skip,
      take: pageSize,
      include: {
        patient: true,
        assigned_nurse: true
      },
      orderBy: { scheduled_date: 'desc' }
    }),
    prisma.dispatch.count({
      where: {
        ...(status && { status })
      }
    })
  ])

  return {
    data: dispatches,
    pagination: {
      page,
      pageSize,
      total,
      pages: Math.ceil(total / pageSize)
    }
  }
}
```

---

## 📊 الاستعلامات الإحصائية

### 1. أكثر أنواع الخدمات طلباً

```typescript
const serviceDistribution = await prisma.dispatch.groupBy({
  by: ['service_type'],
  _count: { id: true },
  orderBy: {
    _count: { id: 'desc' }
  }
})

// النتيجة:
// [
//   { service_type: 'CHECKUP', _count: { id: 45 } },
//   { service_type: 'MEDICATION', _count: { id: 32 } },
//   ...
// ]
```

### 2. متوسط وقت الخدمة

```typescript
const avgDuration = await prisma.dispatch.aggregate({
  where: { status: 'COMPLETED' },
  _avg: {
    actual_duration: true,
    estimated_duration: true
  },
  _min: { actual_duration: true },
  _max: { actual_duration: true }
})

// النتيجة:
// {
//   _avg: { actual_duration: 42.5, estimated_duration: 40 },
//   _min: { actual_duration: 15 },
//   _max: { actual_duration: 120 }
// }
```

### 3. جودة الخدمة (تقييمات)

```typescript
const qualityReport = await prisma.feedback.groupBy({
  by: ['nurse_id'],
  _avg: {
    timeliness: true,
    professionalism: true,
    knowledge: true,
    communication: true,
    quality: true
  },
  _count: { id: true }
})
```

---

## 🔐 أفضل الممارسات

### ✅ DO - الصحيح

```typescript
// 1. استخدم select/include لاختيار حقول محددة فقط
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { id: true, name: true, email: true }
})

// 2. استخدم pagination للقوائم الكبيرة
const users = await prisma.user.findMany({
  take: 10,
  skip: 0
})

// 3. استخدم where مع conditions محددة
const activeDispatches = await prisma.dispatch.findMany({
  where: {
    status: 'IN_PROGRESS',
    assigned_nurse_id: { not: null }
  }
})

// 4. استخدم transactions للعمليات المتعددة
const result = await prisma.$transaction([...])

// 5. استخدم orderBy للنتائج المرتبة
const sorted = await prisma.dispatch.findMany({
  orderBy: { scheduled_date: 'desc' }
})
```

### ❌ DONT - الخطأ

```typescript
// ❌ لا تحمّل جميع الحقول
const user = await prisma.user.findUnique({
  where: { id: userId }
  // لا - سيحمل الـ password أيضاً!
})

// ❌ لا تسترجع جميع الصفوف
const allDispatches = await prisma.dispatch.findMany()
// قد يكون هناك مليون صف!

// ❌ لا تستخدم N+1 queries
for (const dispatch of dispatches) {
  const nurse = await prisma.user.findUnique({
    where: { id: dispatch.assigned_nurse_id }
  })
  // بطيء جداً!
}

// ✅ بدلاً من ذلك:
const dispatches = await prisma.dispatch.findMany({
  include: { assigned_nurse: true }
})
```

---

## 🧪 أمثلة الاختبار

```typescript
// tests/dispatch.test.ts
describe('Dispatch Service', () => {
  it('should assign dispatch to nurse', async () => {
    const dispatch = await prisma.dispatch.create({
      data: {
        patient_id: 'patient-123',
        assigned_nurse_id: 'nurse-456',
        status: 'ASSIGNED'
      }
    })

    expect(dispatch.status).toBe('ASSIGNED')
    expect(dispatch.assigned_nurse_id).toBe('nurse-456')
  })

  it('should calculate performance metrics', async () => {
    const stats = await getPerformanceMetrics('nurse-123')

    expect(stats.totalDispatches).toBeGreaterThan(0)
    expect(stats.avgDuration).toBeGreaterThan(0)
    expect(stats.completionRate).toBeLessThanOrEqual(100)
  })
})
```

---

## 📚 مراجع إضافية

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Prisma ORM Best Practices](https://www.prisma.io/docs/concepts/components/prisma-client/performance-optimization)
- [Database Schema](./README.md)
- [Setup Guide](./DATABASE_SETUP.md)

---

**آخر تحديث**: 2026-06-17

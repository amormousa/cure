import { Role, Priority, DispatchStatus } from '@prisma/client'
import { prisma } from '../app/lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('Starting seed...')

  // Clear existing data
  await prisma.auditLog.deleteMany()
  await prisma.dispatch.deleteMany()
  await prisma.patient.deleteMany()
  await prisma.user.deleteMany()

  console.log('Cleared existing data')

  // Hash passwords
  const adminPassword = await bcrypt.hash('Admin@123', 10)
  const dispatcherPassword = await bcrypt.hash('Disp@123', 10)
  const nursePassword = await bcrypt.hash('Nurse@123', 10)

  // 1. Create Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@cure.com',
      name: 'System Administrator',
      password: adminPassword,
      role: Role.ADMIN,
      phone: '+201001234567',
      isActive: true,
      isOnline: true,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    },
  })

  // 2. Create Dispatcher
  const dispatcher = await prisma.user.create({
    data: {
      email: 'dispatcher@cure.com',
      name: 'Operations Dispatcher',
      password: dispatcherPassword,
      role: Role.DISPATCHER,
      phone: '+201001234568',
      isActive: true,
      isOnline: true,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dispatcher',
    },
  })

  // 3. Create 3 Nurses
  const nurseNames = ['عائشة أحمد', 'فاطمة علي', 'ياسمين حسن']
  const nurses = []

  for (let i = 0; i < 3; i++) {
    const nurse = await prisma.user.create({
      data: {
        email: `nurse${i + 1}@cure.com`,
        name: nurseNames[i],
        password: nursePassword,
        role: Role.NURSE,
        phone: `+20100123457${i}`,
        isActive: true,
        isOnline: i !== 1, // Nurse 1 and 3 online, Nurse 2 offline
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=nurse${i + 1}`,
      },
    })
    nurses.push(nurse)
  }

  console.log('Created Users: 1 Admin, 1 Dispatcher, 3 Nurses')

  // 4. Create 5 Patients
  const patientsData = [
    { name: 'أحمد محمود', address: '123 شارع النيل، القاهرة', phone: '+201009876543', condition: 'Post-operative recovery' },
    { name: 'نور محمد', address: '456 ميدان التحرير، الجيزة', phone: '+201009876544', condition: 'Diabetes management' },
    { name: 'ليلى أحمد', address: '789 طريق حلوان، القاهرة', phone: '+201009876545', condition: 'Hypertension monitoring' },
    { name: 'إبراهيم علي', address: '321 طريق الكورنيش، الإسكندرية', phone: '+201009876546', condition: 'Wound care' },
    { name: 'سارة محمود', address: '654 شارع رمسيس، القاهرة', phone: '+201009876547', condition: 'Physical therapy' },
  ]

  const patients = []
  for (const p of patientsData) {
    const patient = await prisma.patient.create({
      data: {
        name: p.name,
        address: p.address,
        phone: p.phone,
        condition: p.condition,
        notes: `Patient requires home visits for ${p.condition.toLowerCase()}`,
      },
    })
    patients.push(patient)
  }

  console.log('Created 5 Patients')

  // 5. Create 10 Dispatches
  const now = new Date()
  
  const dispatchesData = [
    {
      patientIdx: 0,
      status: DispatchStatus.PENDING,
      priority: Priority.URGENT,
      scheduledFor: new Date(now.getTime() + 24 * 60 * 60 * 1000), // tomorrow
      nurseIdx: null,
      notes: 'Urgent checkup on post-operative vitals.',
    },
    {
      patientIdx: 1,
      status: DispatchStatus.ASSIGNED,
      priority: Priority.HIGH,
      scheduledFor: new Date(now.getTime() + 2 * 60 * 60 * 1000), // in 2 hours
      nurseIdx: 0, // Nurse 1
      notes: 'Insulin injection and diabetes monitoring.',
    },
    {
      patientIdx: 2,
      status: DispatchStatus.IN_PROGRESS,
      priority: Priority.MEDIUM,
      scheduledFor: now,
      nurseIdx: 2, // Nurse 3
      notes: 'Regular blood pressure monitoring visit.',
    },
    {
      patientIdx: 3,
      status: DispatchStatus.COMPLETED,
      priority: Priority.LOW,
      scheduledFor: new Date(now.getTime() - 24 * 60 * 60 * 1000), // yesterday
      completedAt: new Date(now.getTime() - 23 * 60 * 60 * 1000),
      nurseIdx: 1, // Nurse 2
      notes: 'Wound dressing replacement completed.',
    },
    {
      patientIdx: 4,
      status: DispatchStatus.COMPLETED,
      priority: Priority.HIGH,
      scheduledFor: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      completedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      nurseIdx: 0, // Nurse 1
      notes: 'Intensive physical rehabilitation session.',
    },
    {
      patientIdx: 0,
      status: DispatchStatus.PENDING,
      priority: Priority.LOW,
      scheduledFor: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // in 3 days
      nurseIdx: null,
      notes: 'Routine recovery follow-up visit.',
    },
    {
      patientIdx: 1,
      status: DispatchStatus.ASSIGNED,
      priority: Priority.MEDIUM,
      scheduledFor: new Date(now.getTime() + 4 * 60 * 60 * 1000), // in 4 hours
      nurseIdx: 2, // Nurse 3
      notes: 'Dietary counseling and glucose check.',
    },
    {
      patientIdx: 2,
      status: DispatchStatus.CANCELLED,
      priority: Priority.HIGH,
      scheduledFor: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      nurseIdx: 1, // Nurse 2
      notes: 'Hypertension check cancelled by patient request.',
    },
    {
      patientIdx: 3,
      status: DispatchStatus.COMPLETED,
      priority: Priority.URGENT,
      scheduledFor: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      completedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
      nurseIdx: 0, // Nurse 1
      notes: 'Urgent wound care dressing replacement.',
    },
    {
      patientIdx: 4,
      status: DispatchStatus.IN_PROGRESS,
      priority: Priority.URGENT,
      scheduledFor: new Date(now.getTime() + 60 * 60 * 1000), // in 1 hour
      nurseIdx: 2, // Nurse 3
      notes: 'Urgent assistance required for physical therapy pain spike.',
    },
  ]

  const dispatches = []
  for (const d of dispatchesData) {
    const dispatch = await prisma.dispatch.create({
      data: {
        patientId: patients[d.patientIdx].id,
        status: d.status,
        priority: d.priority,
        scheduledFor: d.scheduledFor,
        nurseId: d.nurseIdx !== null ? nurses[d.nurseIdx].id : null,
        notes: d.notes,
        completedAt: d.completedAt || null,
        createdAt: new Date(d.scheduledFor.getTime() - 12 * 60 * 60 * 1000), // Created 12h before scheduled
      },
    })
    dispatches.push(dispatch)
  }

  console.log('Created 10 Dispatches')

  // 6. Create Audit Logs
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: dispatcher.id,
      details: { role: 'DISPATCHER', email: dispatcher.email },
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: dispatcher.id,
      action: 'DISPATCH_CREATED',
      entityType: 'Dispatch',
      entityId: dispatches[0].id,
      dispatchId: dispatches[0].id,
      details: { patientId: dispatches[0].patientId, priority: 'URGENT' },
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: dispatcher.id,
      action: 'DISPATCH_ASSIGNED',
      entityType: 'Dispatch',
      entityId: dispatches[1].id,
      dispatchId: dispatches[1].id,
      details: { nurseId: nurses[0].id },
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: nurses[1].id,
      action: 'DISPATCH_STATUS_CHANGED',
      entityType: 'Dispatch',
      entityId: dispatches[3].id,
      dispatchId: dispatches[3].id,
      details: { before: 'IN_PROGRESS', after: 'COMPLETED' },
    },
  })

  console.log('Created Audit Logs')
  console.log('Seed completed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

import 'dotenv/config'
import { PrismaClient, Priority, Role, DispatchStatus } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcryptjs'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

async function main() {
  const password = await bcrypt.hash('Admin@123', 10)
  const nursePassword = await bcrypt.hash('Nurse@123', 10)
  const dispatcherPassword = await bcrypt.hash('Disp@123', 10)

  const departments = await Promise.all([
    prisma.department.upsert({
      where: { name: 'Home Care' },
      update: { description: 'Home visit operations', isActive: true },
      create: { name: 'Home Care', description: 'Home visit operations' },
    }),
    prisma.department.upsert({
      where: { name: 'Emergency Response' },
      update: { description: 'Urgent dispatch team', isActive: true },
      create: { name: 'Emergency Response', description: 'Urgent dispatch team' },
    }),
    prisma.department.upsert({
      where: { name: 'Chronic Care' },
      update: { description: 'Long-term patient support', isActive: true },
      create: { name: 'Chronic Care', description: 'Long-term patient support' },
    }),
  ])

  const specializations = await Promise.all([
    prisma.specialization.upsert({
      where: { name: 'Wound Care' },
      update: { description: 'Post-operative and wound dressing care', isActive: true },
      create: { name: 'Wound Care', description: 'Post-operative and wound dressing care' },
    }),
    prisma.specialization.upsert({
      where: { name: 'Medication Management' },
      update: { description: 'Medication adherence and administration', isActive: true },
      create: { name: 'Medication Management', description: 'Medication adherence and administration' },
    }),
    prisma.specialization.upsert({
      where: { name: 'Emergency Care' },
      update: { description: 'Urgent triage and stabilization', isActive: true },
      create: { name: 'Emergency Care', description: 'Urgent triage and stabilization' },
    }),
  ])

  const admin = await prisma.user.upsert({
    where: { email: 'admin@cure.com' },
    update: { name: 'System Admin', role: Role.ADMIN, isActive: true, departmentId: departments[0].id },
    create: {
      email: 'admin@cure.com',
      password,
      name: 'System Admin',
      role: Role.ADMIN,
      phone: '+201000000001',
      departmentId: departments[0].id,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    },
  })

  await prisma.user.upsert({
    where: { email: 'dispatcher@cure.com' },
    update: { name: 'Operations Dispatcher', role: Role.DISPATCHER, isActive: true, departmentId: departments[0].id },
    create: {
      email: 'dispatcher@cure.com',
      password: dispatcherPassword,
      name: 'Operations Dispatcher',
      role: Role.DISPATCHER,
      phone: '+201000000002',
      departmentId: departments[0].id,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dispatcher',
    },
  })

  const nurseSeeds = [
    { email: 'nurse.amina@cure.com', name: 'Amina Hassan', phone: '+201000000101', departmentId: departments[0].id, specs: [0, 1], isOnline: true },
    { email: 'nurse.mariam@cure.com', name: 'Mariam Ali', phone: '+201000000102', departmentId: departments[1].id, specs: [2], isOnline: true },
    { email: 'nurse.omar@cure.com', name: 'Omar Saleh', phone: '+201000000103', departmentId: departments[2].id, specs: [1], isOnline: false },
  ]

  const nurses = []
  for (const seed of nurseSeeds) {
    const nurse = await prisma.user.upsert({
      where: { email: seed.email },
      update: {
        name: seed.name,
        phone: seed.phone,
        role: Role.NURSE,
        isActive: true,
        isOnline: seed.isOnline,
        departmentId: seed.departmentId,
      },
      create: {
        email: seed.email,
        password: nursePassword,
        name: seed.name,
        role: Role.NURSE,
        phone: seed.phone,
        isOnline: seed.isOnline,
        departmentId: seed.departmentId,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed.name)}`,
      },
    })

    await prisma.userSpecialization.deleteMany({ where: { userId: nurse.id } })
    await prisma.userSpecialization.createMany({
      data: seed.specs.map((index) => ({
        userId: nurse.id,
        specializationId: specializations[index].id,
        yearsExperience: 3 + index,
      })),
      skipDuplicates: true,
    })
    nurses.push(nurse)
  }

  const patientSeeds = [
    {
      name: 'Ahmed Mahmoud',
      phone: '+201009876543',
      address: '123 Nile Street, Cairo',
      condition: 'Post-operative recovery',
      notes: 'Requires wound dressing every two days',
    },
    {
      name: 'Laila Ibrahim',
      phone: '+201001112223',
      address: '45 Tahrir Square, Cairo',
      condition: 'Medication management',
      notes: 'Hypertension and diabetes follow-up',
    },
    {
      name: 'Youssef Kamal',
      phone: '+201004445556',
      address: '12 Maadi Corniche, Cairo',
      condition: 'High risk respiratory monitoring',
      notes: 'Escalate if oxygen saturation drops',
    },
  ]

  const existingSeedPatients = await prisma.patient.findMany({
    where: { phone: { in: patientSeeds.map((patient) => patient.phone) } },
    select: { id: true },
  })
  const existingSeedPatientIds = existingSeedPatients.map((patient) => patient.id)

  if (existingSeedPatientIds.length > 0) {
    const existingSeedDispatches = await prisma.dispatch.findMany({
      where: { patientId: { in: existingSeedPatientIds } },
      select: { id: true },
    })
    const existingSeedDispatchIds = existingSeedDispatches.map((dispatch) => dispatch.id)

    if (existingSeedDispatchIds.length > 0) {
      await prisma.auditLog.deleteMany({
        where: { dispatchId: { in: existingSeedDispatchIds } },
      })
      await prisma.dispatch.deleteMany({
        where: { id: { in: existingSeedDispatchIds } },
      })
    }

    await prisma.patient.deleteMany({
      where: { id: { in: existingSeedPatientIds } },
    })
  }
  const patients = []
  for (const patient of patientSeeds) {
    patients.push(await prisma.patient.create({ data: patient }))
  }

  await prisma.dispatch.deleteMany({
    where: { patientId: { in: patients.map((patient) => patient.id) } },
  })

  const now = new Date()
  const dispatchSeeds = [
    { patient: 0, nurse: 0, priority: Priority.HIGH, status: DispatchStatus.COMPLETED, offsetHours: -28, completedHours: -25, notes: 'Completed wound-care visit' },
    { patient: 1, nurse: 2, priority: Priority.MEDIUM, status: DispatchStatus.ASSIGNED, offsetHours: 4, notes: 'Medication review visit' },
    { patient: 2, nurse: 1, priority: Priority.URGENT, status: DispatchStatus.IN_PROGRESS, offsetHours: -1, notes: 'Respiratory assessment' },
    { patient: 0, nurse: null, priority: Priority.LOW, status: DispatchStatus.PENDING, offsetHours: 24, notes: 'Routine follow-up' },
  ]

  for (const seed of dispatchSeeds) {
    const dispatch = await prisma.dispatch.create({
      data: {
        patientId: patients[seed.patient].id,
        nurseId: seed.nurse === null ? null : nurses[seed.nurse].id,
        priority: seed.priority,
        status: seed.status,
        scheduledFor: new Date(now.getTime() + seed.offsetHours * 60 * 60 * 1000),
        completedAt: seed.completedHours ? new Date(now.getTime() + seed.completedHours * 60 * 60 * 1000) : null,
        notes: seed.notes,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: 'DISPATCH_SEEDED',
        entityType: 'Dispatch',
        entityId: dispatch.id,
        dispatchId: dispatch.id,
        newValue: dispatch,
        details: { after: dispatch },
      },
    })
  }

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'DATABASE_SEEDED',
      entityType: 'System',
      entityId: 'seed',
      newValue: {
        departments: departments.length,
        specializations: specializations.length,
        nurses: nurses.length,
        patients: patients.length,
        dispatches: dispatchSeeds.length,
      },
      details: {
        departments: departments.length,
        specializations: specializations.length,
        nurses: nurses.length,
        patients: patients.length,
        dispatches: dispatchSeeds.length,
      },
    },
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    await pool.end()
    process.exit(1)
  })

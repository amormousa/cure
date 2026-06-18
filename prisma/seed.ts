// prisma/seed.ts - Production-quality data seeding script
import 'dotenv/config'
import { PrismaClient, Role, DispatchStatus, Priority } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

// ============= CONFIGURATION =============
const CONFIG = {
  users: { total: 750, admins: 8, dispatchers: 25, nurses: 717 },
  departments: 25,
  specializations: 75,
  patients: 2000,
  dispatches: 8000,
  auditLogs: 15000,
  notifications: 5000,
}

// ============= HELPER FUNCTIONS =============

function randomDate(daysBack: number): Date {
  const now = new Date()
  return new Date(now.getTime() - Math.random() * daysBack * 24 * 60 * 60 * 1000)
}

function randomDateBetween(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomElements<T>(arr: T[], count: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, count)
}

function weightedRandom(weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0)
  let random = Math.random() * total
  for (let i = 0; i < weights.length; i++) {
    random -= weights[i]
    if (random <= 0) return i
  }
  return weights.length - 1
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

// ============= DATA DEFINITIONS =============

const DEPARTMENT_DATA = [
  { name: 'Emergency Department', description: 'Emergency and critical care services' },
  { name: 'Intensive Care Unit', description: 'Critical care for severely ill patients' },
  { name: 'Cardiology', description: 'Heart and cardiovascular care' },
  { name: 'Neurology', description: 'Brain and nervous system disorders' },
  { name: 'Orthopedics', description: 'Bone, joint, and muscle treatments' },
  { name: 'Pediatrics', description: 'Healthcare for infants and children' },
  { name: 'Geriatrics', description: 'Healthcare for elderly patients' },
  { name: 'Oncology', description: 'Cancer treatment and care' },
  { name: 'Surgery', description: 'Surgical procedures and operations' },
  { name: 'Radiology', description: 'Medical imaging and diagnostics' },
  { name: 'Laboratory', description: 'Medical tests and analysis' },
  { name: 'Pharmacy', description: 'Medication management and distribution' },
  { name: 'Maternity', description: 'Childbirth and newborn care' },
  { name: 'Psychiatry', description: 'Mental health and psychological care' },
  { name: 'Rehabilitation', description: 'Physical therapy and recovery' },
  { name: 'Pulmonary Care', description: 'Respiratory and lung health' },
  { name: 'Nephrology', description: 'Kidney care and dialysis' },
  { name: 'Gastroenterology', description: 'Digestive system care' },
  { name: 'Dermatology', description: 'Skin health and treatments' },
  { name: 'Ophthalmology', description: 'Eye care and vision health' },
  { name: 'ENT', description: 'Ear, nose, and throat care' },
  { name: 'Urology', description: 'Urinary system care' },
  { name: 'Endocrinology', description: 'Hormone and metabolic care' },
  { name: 'Rheumatology', description: 'Joint and autoimmune care' },
  { name: 'Infectious Disease', description: 'Infection control and treatment' },
]

const SPECIALIZATION_DATA = [
  'Emergency Nursing', 'Critical Care Nursing', 'Cardiac Care Nursing', 'Neurological Nursing', 'Orthopedic Nursing',
  'Pediatric Nursing', 'Geriatric Nursing', 'Oncology Nursing', 'Surgical Nursing', 'Operating Room Nursing',
  'Radiology Nursing', 'Pharmacy Operations', 'Maternity Nursing', 'Neo-Natal Care', 'Psychiatric Nursing',
  'Rehabilitation Therapy', 'Physical Therapy', 'Occupational Therapy', 'Respiratory Therapy', 'Anesthesia Assistance',
  'Wound Care', 'Infection Control', 'Quality Assurance', 'Patient Safety', 'Clinical Documentation',
  'Triage Nursing', 'Ambulance Services', 'Home Health Care', 'Telehealth Nursing', 'Dialysis Nursing',
  'Endoscopy Nursing', 'Cath Lab Nursing', 'Emergency Response', 'Disaster Management', 'Trauma Nursing',
  'Burn Care', 'Palliative Care', 'Hospice Care', 'Research Nursing', 'IV Therapy', 'Cardiac Monitoring',
  'ECG Interpretation', 'Defibrillation', 'Pacemaker Management', 'Ventilator Care', 'Tracheostomy Care',
  'Stoma Care', 'Catheterization', 'Phlebotomy', 'Blood Transfusion', 'Chemotherapy Administration',
  'Radiation Safety', 'Nuclear Medicine', 'MRI Safety', 'CT Scanning', 'Ultrasound Assisted',
  'Labor and Delivery', 'Midwifery', 'Fetal Monitoring', 'Newborn Resuscitation', 'Pediatric ICU',
  'Adult ICU', 'Neo-Natal ICU', 'Cardiac ICU', 'Surgical ICU', 'Trauma ICU', 'Burn Unit',
  'Stroke Care', 'Movement Disorders', 'Dementia Care', 'Eating Disorder Management', 'Substance Abuse',
  'Pain Management', 'Acupuncture', 'Chiropractic Care', 'Music Therapy', 'Art Therapy',
]

const FIRST_NAMES = [
  'Ahmed', 'Mohamed', 'Ali', 'Omar', 'Youssef', 'Ibrahim', 'Hassan', 'Tariq', 'Karim', 'Hossam',
  'Khaled', 'Amr', 'Wael', 'Sami', 'Fadi', 'Rami', 'Bassam', 'Tamer', 'Jamal', 'Nabil',
  'Sarah', 'Fatima', 'Mariam', 'Nour', 'Laila', 'Hana', 'Layla', 'Amira', 'Salma', 'Ranya',
  'Dina', 'Rana', 'Mona', 'Huda', 'Yasmin', 'Sara', 'Noor', 'Maya', 'Reem', 'Jana',
  'John', 'Michael', 'David', 'James', 'Robert', 'William', 'Richard', 'Joseph', 'Thomas', 'Charles',
  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Barbara', 'Elizabeth', 'Susan', 'Jessica', 'Sarah', 'Karen',
]

const LAST_NAMES = [
  'Ahmed', 'Ali', 'Hassan', 'Ibrahim', 'Mahmoud', 'Mostafa', 'Khalid', 'Tarek', 'Ashraf', 'Nasser',
  'Abdelrahman', 'Osman', 'Saeed', 'Gamal', 'Farid', 'Hamdy', 'Bashar', 'Adel', 'Sami', 'Fouad',
  'Abdelaziz', 'Botros', 'Charbel', 'Daniel', 'George', 'Habib', 'Issa', 'Joseph', 'Kamel', 'Milad',
  'Hussein', 'Abbas', 'Kazem', 'Mahdi', 'Naqvi', 'Qadir', 'Rashid', 'Salim', 'Taher', 'Yonis',
  'Soliman', 'Awad', 'Baz', 'Darwish', 'Eissa', 'Fayad', 'Galal', 'Hosny', 'Irshad', 'Jamal',
]

const PATIENT_CONDITIONS = [
  'Diabetes Type 2', 'Hypertension', 'Asthma', 'Arthritis', 'Heart Disease', 'COPD',
  'Back Pain', 'Depression', 'Anxiety', 'Insomnia', 'Migraine', 'Allergies',
  'Chronic Pain', 'Fibromyalgia', 'Osteoporosis', 'Cancer Recovery', 'Post-Surgery Care',
  'Pneumonia Recovery', 'Stroke Recovery', 'Heart Failure', 'Kidney Disease', 'Liver Disease',
  'Pulmonary Disease', 'Neurological Disorder', 'Autoimmune Disorder', 'Infectious Disease',
]

const ADDRESSES = [
  '123 Main Street, Downtown', '456 Oak Avenue, Midtown', '789 Park Road, Uptown',
  '321 Cedar Lane, Westside', '654 Pine Boulevard', '987 Maple Drive',
  '147 Birch Court', '258 Elm Street', '369 Willow Way',
  '741 Maple Street', '852 Oak Avenue', '963 Pine Road',
  '159 Cedar Lane', '357 Elm Street', '951 Birch Court',
  '753 Willow Way', '159 Oak Drive', '357 Pine Avenue',
]

const DISPATCH_NOTES = [
  'Patient requires routine checkup', 'Follow-up appointment needed', 'Medication adjustment required',
  'Vital signs monitoring', 'Wound care and dressing change', 'Physical therapy session',
  'Blood pressure monitoring', 'Glucose level check', 'Post-surgery observation',
  'Chronic condition management', 'Pain assessment needed', 'Equipment delivery',
  'Therapy session scheduled', 'Health assessment follow-up', 'Lab results review',
]

// ============= SEED FUNCTIONS =============

async function clearDatabase() {
  console.log('🗑️  Clearing database...')
  await prisma.auditLog.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.dispatch.deleteMany()
  await prisma.patient.deleteMany()
  await prisma.userSpecialization.deleteMany()
  await prisma.rolePermission.deleteMany()
  await prisma.permission.deleteMany()
  await prisma.user.deleteMany()
  await prisma.department.deleteMany()
  await prisma.specialization.deleteMany()
  console.log('✅ Database cleared')
}

async function seedDepartments() {
  console.log('🏥 Seeding departments...')
  for (const dept of DEPARTMENT_DATA) {
    await prisma.department.create({
      data: { name: dept.name, description: dept.description, isActive: true, createdAt: randomDate(180) },
    })
  }
  console.log(`✅ Created ${DEPARTMENT_DATA.length} departments`)
}

async function seedSpecializations() {
  console.log('⚕️  Seeding specializations...')
  for (const name of SPECIALIZATION_DATA) {
    await prisma.specialization.create({
      data: { name, description: `${name} - Medical specialization`, isActive: true, createdAt: randomDate(180) },
    })
  }
  console.log(`✅ Created ${SPECIALIZATION_DATA.length} specializations`)
}

async function seedUsers() {
  console.log('👥 Seeding users...')
  const departments = await prisma.department.findMany()
  const specializations = await prisma.specialization.findMany()
  const password = await hashPassword('password123')
  const adminPassword = await hashPassword('Admin@123')

  // Create fixed admin account for login
  await prisma.user.create({
    data: {
      email: 'admin@cure.com',
      name: 'System Admin',
      password: adminPassword,
      role: Role.ADMIN,
      isActive: true,
      isOnline: true,
      departmentId: departments[0]?.id,
      createdAt: new Date(),
    },
  }).catch(() => {}) // Ignore if already exists

  // Create ADMIN users
  for (let i = 0; i < CONFIG.users.admins; i++) {
    const name = `${randomElement(FIRST_NAMES)} ${randomElement(LAST_NAMES)}`
    const user = await prisma.user.create({
      data: {
        email: `${name.toLowerCase().replace(' ', '.')}@cure.health`,
        name, password, role: Role.ADMIN,
        isActive: true, isOnline: Math.random() > 0.7,
        departmentId: randomElement(departments).id,
        createdAt: randomDate(180),
      },
    })
    const userSpecs = randomElements(specializations, Math.floor(Math.random() * 3) + 1)
    for (const spec of userSpecs) {
      await prisma.userSpecialization.create({
        data: { userId: user.id, specializationId: spec.id, yearsExperience: Math.floor(Math.random() * 10) + 1 },
      })
    }
  }

  // Create DISPATCHER users
  for (let i = 0; i < CONFIG.users.dispatchers; i++) {
    const name = `${randomElement(FIRST_NAMES)} ${randomElement(LAST_NAMES)}`
    const user = await prisma.user.create({
      data: {
        email: `dispatcher.${i + 1}@cure.health`,
        name, password, role: Role.DISPATCHER,
        isActive: true, isOnline: Math.random() > 0.6,
        departmentId: randomElement(departments).id,
        createdAt: randomDate(180),
      },
    })
    const userSpecs = randomElements(specializations, Math.floor(Math.random() * 3) + 1)
    for (const spec of userSpecs) {
      await prisma.userSpecialization.create({
        data: { userId: user.id, specializationId: spec.id, yearsExperience: Math.floor(Math.random() * 10) + 1 },
      })
    }
  }

  // Create NURSE users
  for (let i = 0; i < CONFIG.users.nurses; i++) {
    const name = `${randomElement(FIRST_NAMES)} ${randomElement(LAST_NAMES)}`
    const user = await prisma.user.create({
      data: {
        email: `nurse.${i + 1}@cure.health`,
        name, password, role: Role.NURSE,
        isActive: Math.random() > 0.15,
        isOnline: Math.random() > 0.6,
        phone: `+20${Math.floor(Math.random() * 900000000 + 100000000)}`,
        departmentId: randomElement(departments).id,
        createdAt: randomDate(180),
      },
    })
    const userSpecs = randomElements(specializations, Math.floor(Math.random() * 4) + 2)
    for (const spec of userSpecs) {
      await prisma.userSpecialization.create({
        data: { userId: user.id, specializationId: spec.id, yearsExperience: Math.floor(Math.random() * 15) },
      })
    }
  }

  console.log(`✅ Created ${CONFIG.users.total} users`)
}

async function seedPatients() {
  console.log('🏃 Seeding patients...')
  for (let i = 0; i < CONFIG.patients; i++) {
    await prisma.patient.create({
      data: {
        name: `${randomElement(FIRST_NAMES)} ${randomElement(LAST_NAMES)}`,
        address: randomElement(ADDRESSES),
        phone: `+20${Math.floor(Math.random() * 900000000 + 100000000)}`,
        condition: randomElement(PATIENT_CONDITIONS),
        notes: Math.random() > 0.5 ? randomElement(DISPATCH_NOTES) : null,
        createdAt: randomDate(180),
      },
    })
  }
  console.log(`✅ Created ${CONFIG.patients} patients`)
}

async function seedDispatches() {
  console.log('📋 Seeding dispatches...')
  const patients = await prisma.patient.findMany()
  const nurses = await prisma.user.findMany({ where: { role: Role.NURSE, isActive: true } })

  const today = new Date()
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000)
  const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
  const sixMonthsAgo = new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000)

  const statusWeights = [15, 20, 25, 30, 10]
  const priorityWeights = [5, 40, 35, 20]

  for (let i = 0; i < CONFIG.dispatches; i++) {
    // Determine date range based on distribution
    let createdAt: Date
    const rand = Math.random()
    if (rand < 0.4) createdAt = randomDateBetween(thirtyDaysAgo, today)
    else if (rand < 0.7) createdAt = randomDateBetween(sixtyDaysAgo, thirtyDaysAgo)
    else if (rand < 0.9) createdAt = randomDateBetween(ninetyDaysAgo, sixtyDaysAgo)
    else createdAt = randomDateBetween(sixMonthsAgo, ninetyDaysAgo)

    const statusIndex = weightedRandom(statusWeights)
    const status = Object.values(DispatchStatus)[statusIndex]

    const priorityIndex = weightedRandom(priorityWeights)
    const priority = Object.values(Priority)[priorityIndex]

    let nurseId: string | null = null
    let completedAt: Date | null = null

    if (status !== DispatchStatus.PENDING) nurseId = randomElement(nurses).id

    if (status === DispatchStatus.COMPLETED || status === DispatchStatus.CANCELLED) {
      completedAt = new Date(createdAt.getTime() + Math.random() * 48 * 60 * 60 * 1000)
    }

    const scheduledFor = new Date(createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000)

    await prisma.dispatch.create({
      data: {
        patientId: randomElement(patients).id,
        nurseId, status, priority, scheduledFor, completedAt,
        notes: Math.random() > 0.3 ? randomElement(DISPATCH_NOTES) : null,
        createdAt, updatedAt: completedAt || scheduledFor,
      },
    })
  }

  console.log(`✅ Created ${CONFIG.dispatches} dispatches`)
}

async function seedAuditLogs() {
  console.log('📝 Seeding audit logs...')
  const users = await prisma.user.findMany()
  const dispatchers = await prisma.dispatch.findMany({ take: 500 })

  const actions = [
    'LOGIN', 'LOGOUT', 'VIEW_DISPATCH', 'CREATE_DISPATCH', 'UPDATE_DISPATCH',
    'ASSIGN_NURSE', 'COMPLETE_DISPATCH', 'CANCEL_DISPATCH', 'UPDATE_USER',
    'CREATE_USER', 'VIEW_PATIENT', 'UPDATE_PATIENT', 'VIEW_ANALYTICS',
    'EXPORT_REPORT', 'VIEW_NOTIFICATION', 'UPDATE_PROFILE', 'CHANGE_PASSWORD',
  ]

  for (let i = 0; i < CONFIG.auditLogs; i++) {
    const user = randomElement(users)
    const dispatch = randomElement(dispatchers)
    const action = randomElement(actions)

    await prisma.auditLog.create({
      data: {
        userId: user.id, action,
        entityType: action.includes('DISPATCH') ? 'Dispatch' : action.includes('USER') ? 'User' : 'Patient',
        entityId: dispatch?.id || crypto.randomUUID(),
        newValue: { action, timestamp: new Date().toISOString() },
        createdAt: randomDate(90),
      },
    })
  }

  console.log(`✅ Created ${CONFIG.auditLogs} audit logs`)
}

async function verifyData() {
  console.log('\n📊 Verifying data...\n')

  const counts = {
    departments: await prisma.department.count(),
    specializations: await prisma.specialization.count(),
    users: await prisma.user.count(),
    activeUsers: await prisma.user.count({ where: { isActive: true } }),
    onlineUsers: await prisma.user.count({ where: { isOnline: true } }),
    nurses: await prisma.user.count({ where: { role: Role.NURSE } }),
    dispatchers: await prisma.user.count({ where: { role: Role.DISPATCHER } }),
    admins: await prisma.user.count({ where: { role: Role.ADMIN } }),
    patients: await prisma.patient.count(),
    dispatches: await prisma.dispatch.count(),
    pendingTasks: await prisma.dispatch.count({ where: { status: DispatchStatus.PENDING } }),
    completedTasks: await prisma.dispatch.count({ where: { status: DispatchStatus.COMPLETED } }),
    inProgressTasks: await prisma.dispatch.count({ where: { status: DispatchStatus.IN_PROGRESS } }),
    auditLogs: await prisma.auditLog.count(),
  }

  console.log('📈 Table Counts:')
  console.table(counts)

  console.log('\n👤 Sample Users:')
  const sampleUsers = await prisma.user.findMany({ take: 5, select: { name: true, email: true, role: true, isActive: true } })
  console.table(sampleUsers)

  console.log('\n📊 Dispatches by Status:')
  const byStatus = await prisma.dispatch.groupBy({ by: ['status'], _count: { id: true } })
  console.table(byStatus.map(s => ({ status: s.status, count: s._count.id })))

  console.log('\n📅 Recent Dispatches:')
  const recent = await prisma.dispatch.findMany({ take: 5, orderBy: { createdAt: 'desc' }, select: { status: true, priority: true, createdAt: true } })
  console.table(recent)

  return counts
}

async function main() {
  console.log('🚀 Starting production seed...\n')
  try {
    await clearDatabase()
    await seedDepartments()
    await seedSpecializations()
    await seedUsers()
    await seedPatients()
    await seedDispatches()
    await seedAuditLogs()
    const counts = await verifyData()
    console.log('\n✅ Seed completed!')
  } catch (error) {
    console.error('❌ Seed failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
// prisma/seed.ts
import { PrismaClient, Role, Priority, DispatchStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const egyptianNames = [
  'أحمد محمود',
  'فاطمة علي',
  'محمد حسن',
  'نور محمد',
  'ليلى أحمد',
  'سارة محمود',
  'إبراهيم علي',
  'هناء حسن',
]

const conditions = [
  'Post-operative recovery',
  'Diabetes management',
  'Hypertension monitoring',
  'Wound care',
  'Physical therapy',
  'Medication administration',
  'Vital signs monitoring',
  'Pain management',
]

const addresses = [
  '123 Nile Street, Cairo',
  '456 Tahrir Square, Giza',
  '789 Helwan Road, Cairo',
  '321 Abbas Mahmoud, Alexandria',
  '654 Ramses Street, Cairo',
  '987 corniche, Alexandria',
]

async function main() {
  console.log('Starting seed...')

  // Clear existing data
  await prisma.auditLog.deleteMany()
  await prisma.dispatch.deleteMany()
  await prisma.patient.deleteMany()
  await prisma.user.deleteMany()

  console.log('Cleared existing data')

  // Create admin users
  const admin1 = await prisma.user.create({
    data: {
      email: 'admin@cure.com',
      name: 'Admin User',
      password: await bcrypt.hash('password123', 10),
      role: 'ADMIN',
      phone: '+201001234567',
      isActive: true,
      isOnline: true,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    },
  })

  const admin2 = await prisma.user.create({
    data: {
      email: 'manager@cure.com',
      name: 'Operations Manager',
      password: await bcrypt.hash('password123', 10),
      role: 'ADMIN',
      phone: '+201001234568',
      isActive: true,
      isOnline: true,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=manager',
    },
  })

  console.log('Created admin users')

  // Create nurses
  const nurses = []
  for (let i = 0; i < 5; i++) {
    const nurse = await prisma.user.create({
      data: {
        email: `nurse${i + 1}@cure.com`,
        name: egyptianNames[i],
        password: await bcrypt.hash('password123', 10),
        role: 'NURSE',
        phone: `+2010012345${67 + i}`,
        isActive: true,
        isOnline: i % 2 === 0, // Alternate online/offline
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=nurse${i}`,
      },
    })
    nurses.push(nurse)
  }

  console.log(`Created ${nurses.length} nurses`)

  // Create patients
  const patients = []
  for (let i = 0; i < 10; i++) {
    const patient = await prisma.patient.create({
      data: {
        name: egyptianNames[i % egyptianNames.length],
        phone: `+2010098765${43 + i}`,
        address: addresses[i % addresses.length],
        condition: conditions[i % conditions.length],
        notes: `Patient requires ${conditions[i % conditions.length].toLowerCase()}`,
      },
    })
    patients.push(patient)
  }

  console.log(`Created ${patients.length} patients`)

  // Create dispatches
  const now = new Date()
  const statuses: DispatchStatus[] = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
  const priorities: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

  const dispatches = []
  for (let i = 0; i < 30; i++) {
    const status = statuses[i % statuses.length]
    const dispatch = await prisma.dispatch.create({
      data: {
        patientId: patients[i % patients.length].id,
        status: status,
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        scheduledFor: new Date(now.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time within 7 days
        nurseId: status !== 'PENDING' ? nurses[Math.floor(Math.random() * nurses.length)].id : null,
        notes: `Dispatch for ${conditions[i % conditions.length]}`,
        completedAt: status === 'COMPLETED' ? new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
        createdAt: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      },
    })
    dispatches.push(dispatch)
  }

  console.log(`Created ${dispatches.length} dispatches`)

  // Create audit logs
  for (let i = 0; i < 20; i++) {
    await prisma.auditLog.create({
      data: {
        userId: admin1.id,
        action: ['DISPATCH_CREATED', 'DISPATCH_STATUS_CHANGED', 'DISPATCH_ASSIGNED'][Math.floor(Math.random() * 3)],
        entityType: 'Dispatch',
        entityId: dispatches[Math.floor(Math.random() * dispatches.length)].id,
        details: { action: 'system', timestamp: new Date() },
      },
    })
  }

  console.log('Created audit logs')

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

import { Role, UserStatus, DispatchStatus, Priority, ShiftType, ServiceType, PatientStatus, FeedbackRating } from '@prisma/client'
import { prisma } from '../app/lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('🌱 Starting database seed...\n')

  try {
    // ═══════════════════════════════════════════════════════════════
    // 1. Clear existing data (with proper foreign key handling)
    // ═══════════════════════════════════════════════════════════════
    console.log('🗑️  Clearing existing data...')
    await prisma.feedback.deleteMany()
    await prisma.notification.deleteMany()
    await prisma.activityLog.deleteMany()
    await prisma.auditLog.deleteMany()
    await prisma.userShift.deleteMany()
    await prisma.dispatch.deleteMany()
    await prisma.patient.deleteMany()
    await prisma.userSpecialization.deleteMany()
    await prisma.shift.deleteMany()
    await prisma.user.deleteMany()
    await prisma.specialization.deleteMany()
    await prisma.location.deleteMany()
    await prisma.department.deleteMany()

    // ═══════════════════════════════════════════════════════════════
    // 2. Create Departments
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📋 Creating departments...')
    const deptEmergency = await prisma.department.create({
      data: { name: 'Emergency', description: 'Emergency & Critical Care', phone: '+201001111111' }
    })
    const deptCardio = await prisma.department.create({
      data: { name: 'Cardiology', description: 'Heart & Cardiovascular', phone: '+201002222222' }
    })
    const deptOncology = await prisma.department.create({
      data: { name: 'Oncology', description: 'Cancer Care', phone: '+201003333333' }
    })
    console.log(`✅ Created 3 departments`)

    // ═══════════════════════════════════════════════════════════════
    // 3. Create Specializations
    // ═══════════════════════════════════════════════════════════════
    console.log('\n🎓 Creating specializations...')
    const specEmergency = await prisma.specialization.create({
      data: { name: 'Emergency Care', description: 'Critical emergency response' }
    })
    const specCardiac = await prisma.specialization.create({
      data: { name: 'Cardiac Care', description: 'Cardiac nursing specialization' }
    })
    const specOncology = await prisma.specialization.create({
      data: { name: 'Oncology Nursing', description: 'Cancer patient care' }
    })
    const specWoundCare = await prisma.specialization.create({
      data: { name: 'Wound Care', description: 'Wound management & prevention' }
    })
    console.log(`✅ Created 4 specializations`)

    // ═══════════════════════════════════════════════════════════════
    // 4. Create Locations
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📍 Creating locations...')
    const loc1 = await prisma.location.create({
      data: { name: 'Cairo Downtown', address: 'Tahrir Square, Cairo', zone: 'Downtown', latitude: 30.0444, longitude: 31.2357 }
    })
    const loc2 = await prisma.location.create({
      data: { name: 'Giza', address: 'Giza Plateau, Cairo', zone: 'West Bank', latitude: 30.0082, longitude: 31.1858 }
    })
    const loc3 = await prisma.location.create({
      data: { name: 'New Cairo', address: 'New Cairo City', zone: 'East', latitude: 30.0070, longitude: 31.4925 }
    })
    console.log(`✅ Created 3 locations`)

    // ═══════════════════════════════════════════════════════════════
    // 5. Create Users (Admin, Dispatchers, Nurses, Supervisors)
    // ═══════════════════════════════════════════════════════════════
    console.log('\n👥 Creating users...')

    const passwordHash = (pwd: string) => bcrypt.hashSync(pwd, 10)

    // Admin
    const admin = await prisma.user.create({
      data: {
        email: 'admin@cure.com',
        password: passwordHash('Admin@123'),
        name: 'System Administrator',
        phone: '+201001111111',
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
        designation: 'System Admin',
        isOnline: true,
      }
    })

    // Supervisors
    const supervisor1 = await prisma.user.create({
      data: {
        email: 'supervisor1@cure.com',
        password: passwordHash('Super@123'),
        name: 'Dr. Ahmed Hassan',
        phone: '+201002222222',
        role: Role.SUPERVISOR,
        status: UserStatus.ACTIVE,
        designation: 'Clinical Supervisor',
        department_id: deptEmergency.id,
        isOnline: true,
      }
    })

    const supervisor2 = await prisma.user.create({
      data: {
        email: 'supervisor2@cure.com',
        password: passwordHash('Super@123'),
        name: 'Dr. Fatima Ahmed',
        phone: '+201003333333',
        role: Role.SUPERVISOR,
        status: UserStatus.ACTIVE,
        designation: 'Cardiology Supervisor',
        department_id: deptCardio.id,
      }
    })

    // Update admin to set supervisor
    await prisma.department.update({
      where: { id: deptEmergency.id },
      data: { head_id: supervisor1.id }
    })
    await prisma.department.update({
      where: { id: deptCardio.id },
      data: { head_id: supervisor2.id }
    })

    // Dispatchers
    const dispatcher1 = await prisma.user.create({
      data: {
        email: 'dispatcher1@cure.com',
        password: passwordHash('Disp@123'),
        name: 'Mohammed Ali',
        phone: '+201004444444',
        role: Role.DISPATCHER,
        status: UserStatus.ACTIVE,
        designation: 'Dispatch Coordinator',
        department_id: deptEmergency.id,
        supervisor_id: supervisor1.id,
      }
    })

    const dispatcher2 = await prisma.user.create({
      data: {
        email: 'dispatcher2@cure.com',
        password: passwordHash('Disp@123'),
        name: 'Nadia Khalil',
        phone: '+201005555555',
        role: Role.DISPATCHER,
        status: UserStatus.ACTIVE,
        designation: 'Dispatch Manager',
        department_id: deptCardio.id,
        supervisor_id: supervisor2.id,
      }
    })

    // Nurses
    const nurses = []
    for (let i = 1; i <= 10; i++) {
      const nurse = await prisma.user.create({
        data: {
          email: `nurse${i}@cure.com`,
          password: passwordHash('Nurse@123'),
          name: `Nurse ${String.fromCharCode(64 + i)} (${['Emergency', 'Cardiology', 'Oncology'][i % 3]})`,
          phone: `+20100${String(6000000 + i).padStart(7, '0')}`,
          role: Role.NURSE,
          status: i <= 8 ? UserStatus.ACTIVE : UserStatus.ON_LEAVE,
          designation: 'Registered Nurse',
          department_id: [deptEmergency.id, deptCardio.id, deptOncology.id][i % 3],
          supervisor_id: i <= 5 ? supervisor1.id : supervisor2.id,
          isOnline: i <= 5,
        }
      })
      nurses.push(nurse)
    }

    console.log(`✅ Created 1 admin + 2 supervisors + 2 dispatchers + 10 nurses`)

    // ═══════════════════════════════════════════════════════════════
    // 6. Assign Specializations to Nurses
    // ═══════════════════════════════════════════════════════════════
    console.log('\n🏆 Assigning specializations...')
    for (let i = 0; i < nurses.length; i++) {
      await prisma.userSpecialization.create({
        data: {
          user_id: nurses[i].id,
          specialization_id: [specEmergency, specCardiac, specOncology, specWoundCare][i % 4].id,
          years_of_experience: Math.floor(Math.random() * 15) + 1,
          verified: true,
        }
      })
    }
    console.log(`✅ Assigned specializations to all nurses`)

    // ═══════════════════════════════════════════════════════════════
    // 7. Create Shifts
    // ═══════════════════════════════════════════════════════════════
    console.log('\n⏰ Creating shifts...')
    const shiftMorning = await prisma.shift.create({
      data: {
        name: 'Morning Shift',
        type: ShiftType.MORNING,
        start_time: '06:00',
        end_time: '14:00',
        department_id: deptEmergency.id,
        max_nurses: 8,
      }
    })
    const shiftAfternoon = await prisma.shift.create({
      data: {
        name: 'Afternoon Shift',
        type: ShiftType.AFTERNOON,
        start_time: '14:00',
        end_time: '22:00',
        department_id: deptEmergency.id,
        max_nurses: 8,
      }
    })
    const shiftNight = await prisma.shift.create({
      data: {
        name: 'Night Shift',
        type: ShiftType.NIGHT,
        start_time: '22:00',
        end_time: '06:00',
        department_id: deptEmergency.id,
        max_nurses: 6,
      }
    })
    console.log(`✅ Created 3 shifts`)

    // ═══════════════════════════════════════════════════════════════
    // 8. Assign Nurses to Shifts
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📅 Assigning nurses to shifts...')
    const today = new Date()
    for (let i = 0; i < 6; i++) {
      await prisma.userShift.create({
        data: {
          user_id: nurses[i].id,
          shift_id: [shiftMorning.id, shiftAfternoon.id, shiftNight.id][i % 3],
          start_date: today,
          end_date: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
          is_active: true,
        }
      })
    }
    console.log(`✅ Assigned nurses to shifts`)

    // ═══════════════════════════════════════════════════════════════
    // 9. Create Patients
    // ═══════════════════════════════════════════════════════════════
    console.log('\n🏥 Creating patients...')
    const patients = []
    const patientNames = [
      'Ahmed Ibrahim', 'Fatima Mohamed', 'Hassan Ali', 'Leila Ahmed',
      'Ibrahim Hassan', 'Noor Khalil', 'Amr Salem', 'Zainab Ahmed',
      'Omar Karim', 'Yasmin Karim'
    ]

    for (let i = 0; i < patientNames.length; i++) {
      const patient = await prisma.patient.create({
        data: {
          mrn: `MRN-${String(2024001 + i).padStart(8, '0')}`,
          name: patientNames[i],
          date_of_birth: new Date(1960 + Math.floor(Math.random() * 50), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          gender: i % 2 === 0 ? 'M' : 'F',
          blood_type: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'][i % 8],
          phone: `+20100${String(8000000 + i).padStart(7, '0')}`,
          location_id: [loc1.id, loc2.id, loc3.id][i % 3],
          status: i <= 7 ? PatientStatus.ACTIVE : PatientStatus.INACTIVE,
          medical_history: 'Regular check-ups, hypertension managed with medication',
          allergies: ['Penicillin', 'Aspirin', 'None'][i % 3],
          chronic_conditions: ['Hypertension', 'Diabetes', 'Asthma', 'None'][i % 4],
          current_medications: 'Lisinopril 10mg daily, Metformin 500mg',
        }
      })
      patients.push(patient)
    }
    console.log(`✅ Created 10 patients`)

    // ═══════════════════════════════════════════════════════════════
    // 10. Create Dispatches
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📋 Creating dispatches...')
    for (let i = 0; i < 20; i++) {
      const status = [DispatchStatus.PENDING, DispatchStatus.ASSIGNED, DispatchStatus.IN_PROGRESS, DispatchStatus.COMPLETED][i % 4]
      const scheduled = new Date(today.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000)
      await prisma.dispatch.create({
        data: {
          dispatch_number: `DSP-${String(100001 + i).padStart(6, '0')}`,
          patient_id: patients[i % patients.length].id,
          service_type: [ServiceType.CHECKUP, ServiceType.VACCINATION, ServiceType.MEDICATION, ServiceType.WOUND_CARE][i % 4],
          status,
          priority: [Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.URGENT][i % 4],
          assigned_nurse_id: status !== DispatchStatus.PENDING ? nurses[i % nurses.length].id : null,
          supervisor_id: [supervisor1.id, supervisor2.id][i % 2],
          location_id: patients[i % patients.length].location_id,
          scheduled_date: scheduled,
          scheduled_time: `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
          assigned_date: status !== DispatchStatus.PENDING ? new Date() : null,
          start_time: [DispatchStatus.IN_PROGRESS, DispatchStatus.COMPLETED].includes(status) ? new Date() : null,
          completion_time: status === DispatchStatus.COMPLETED ? new Date(Date.now() - Math.random() * 4 * 60 * 60 * 1000) : null,
          estimated_duration: 30 + Math.floor(Math.random() * 60),
          actual_duration: status === DispatchStatus.COMPLETED ? 30 + Math.floor(Math.random() * 60) : null,
          notes: 'Routine patient visit scheduled',
          instructions: 'Please check blood pressure and temperature',
          contact_person: patients[i % patients.length].name,
          contact_phone: patients[i % patients.length].phone,
        }
      })
    }
    console.log(`✅ Created 20 dispatches`)

    // ═══════════════════════════════════════════════════════════════
    // 11. Create Feedback
    // ═══════════════════════════════════════════════════════════════
    console.log('\n⭐ Creating feedback...')
    const completedDispatches = await prisma.dispatch.findMany({
      where: { status: DispatchStatus.COMPLETED }
    })

    for (let i = 0; i < Math.min(5, completedDispatches.length); i++) {
      await prisma.feedback.create({
        data: {
          dispatch_id: completedDispatches[i].id,
          nurse_id: completedDispatches[i].assigned_nurse_id!,
          given_by_id: supervisor1.id,
          rating: [FeedbackRating.GOOD, FeedbackRating.EXCELLENT][i % 2],
          timeliness: 4 + Math.floor(Math.random() * 2),
          professionalism: 4 + Math.floor(Math.random() * 2),
          knowledge: 4 + Math.floor(Math.random() * 2),
          communication: 4 + Math.floor(Math.random() * 2),
          quality: 4 + Math.floor(Math.random() * 2),
          comments: 'Excellent service delivery',
        }
      })
    }
    console.log(`✅ Created feedback records`)

    // ═══════════════════════════════════════════════════════════════
    // 12. Create Audit & Activity Logs
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📝 Creating audit & activity logs...')
    for (let i = 0; i < 5; i++) {
      await prisma.auditLog.create({
        data: {
          user_id: admin.id,
          action: 'CREATE',
          entity_type: 'Dispatch',
          entity_id: `DSP-100${i}`,
          new_values: { status: 'PENDING', priority: 'MEDIUM' },
        }
      })
    }
    console.log(`✅ Created audit logs`)

    // ═══════════════════════════════════════════════════════════════
    // 13. Summary
    // ═══════════════════════════════════════════════════════════════
    console.log('\n✅ ════════════════════════════════════════════════════════════')
    console.log('✅  Database seed completed successfully! 🚀')
    console.log('✅ ════════════════════════════════════════════════════════════\n')
    console.log('📊 Summary:')
    console.log(`   ✓ 3 Departments`)
    console.log(`   ✓ 4 Specializations`)
    console.log(`   ✓ 3 Locations`)
    console.log(`   ✓ 15 Users (1 Admin + 2 Supervisors + 2 Dispatchers + 10 Nurses)`)
    console.log(`   ✓ 3 Shifts`)
    console.log(`   ✓ 10 Patients`)
    console.log(`   ✓ 20 Dispatches`)
    console.log(`   ✓ Feedback & Audit Logs\n`)
    console.log('🔐 Test Credentials:')
    console.log(`   👨‍💼 Admin: admin@cure.com / Admin@123`)
    console.log(`   👮 Supervisor: supervisor1@cure.com / Super@123`)
    console.log(`   📞 Dispatcher: dispatcher1@cure.com / Disp@123`)
    console.log(`   👩‍⚕️ Nurse: nurse1@cure.com / Nurse@123\n`)

  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })

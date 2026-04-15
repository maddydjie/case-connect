import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hospital = await prisma.hospital.upsert({
    where: { code: 'HOSP001' },
    update: {},
    create: {
      name: 'CaseConnect Demo Hospital',
      code: 'HOSP001',
      type: 'private_hospital',
      addressLine1: '123 Medical Complex',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600001',
      country: 'India',
      phone: '+919876543210',
      email: 'admin@demohospital.in',
      registrationNumber: 'TN-MED-2024-001',
      totalBeds: 200,
    },
  });

  const departments = [
    { name: 'Cardiology', code: 'CARD', bedCount: 30 },
    { name: 'Neurology', code: 'NEUR', bedCount: 20 },
    { name: 'Orthopedics', code: 'ORTH', bedCount: 25 },
    { name: 'Pediatrics', code: 'PEDI', bedCount: 20 },
    { name: 'General Medicine', code: 'GENM', bedCount: 40 },
    { name: 'Gynecology', code: 'GYNE', bedCount: 15 },
    { name: 'Dermatology', code: 'DERM', bedCount: 5 },
    { name: 'Psychiatry', code: 'PSYC', bedCount: 10 },
    { name: 'Emergency', code: 'EMER', bedCount: 15 },
    { name: 'Surgery', code: 'SURG', bedCount: 20 },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { hospitalId_code: { hospitalId: hospital.id, code: dept.code } },
      update: {},
      create: {
        ...dept,
        hospitalId: hospital.id,
      },
    });
  }

  const admin = await prisma.user.upsert({
    where: { email: 'admin@caseconnect.in' },
    update: {},
    create: {
      email: 'admin@caseconnect.in',
      phone: '+919876543211',
      firstName: 'Admin',
      lastName: 'User',
      role: 'hospital_admin',
      hospitalId: hospital.id,
      isActive: true,
      mfaEnabled: true,
    },
  });

  const doctor = await prisma.user.upsert({
    where: { email: 'dr.sharma@caseconnect.in' },
    update: {},
    create: {
      email: 'dr.sharma@caseconnect.in',
      phone: '+919876543212',
      firstName: 'Rajesh',
      lastName: 'Sharma',
      role: 'doctor',
      hospitalId: hospital.id,
      isActive: true,
      mfaEnabled: true,
    },
  });

  await prisma.doctorProfile.upsert({
    where: { userId: doctor.id },
    update: {},
    create: {
      userId: doctor.id,
      registrationNumber: 'MCI-2015-12345',
      specialization: 'Cardiology',
      qualification: 'MD, DM Cardiology',
      experienceYears: 11,
      consultationFee: 800,
    },
  });

  const patient = await prisma.user.upsert({
    where: { email: 'patient.kumar@example.com' },
    update: {},
    create: {
      email: 'patient.kumar@example.com',
      phone: '+919876543213',
      firstName: 'Amit',
      lastName: 'Kumar',
      role: 'patient',
      isActive: true,
    },
  });

  await prisma.patientProfile.upsert({
    where: { userId: patient.id },
    update: {},
    create: {
      userId: patient.id,
      dateOfBirth: new Date('1985-06-15'),
      gender: 'male',
      bloodGroup: 'B+',
      allergies: ['Penicillin'],
      chronicConditions: ['Hypertension'],
    },
  });

  // Seed beds for the first department
  const cardDept = await prisma.department.findFirst({
    where: { code: 'CARD', hospitalId: hospital.id },
  });

  if (cardDept) {
    for (let i = 1; i <= 10; i++) {
      await prisma.bed.upsert({
        where: {
          hospitalId_bedNumber: { hospitalId: hospital.id, bedNumber: `CARD-${i.toString().padStart(2, '0')}` },
        },
        update: {},
        create: {
          hospitalId: hospital.id,
          departmentId: cardDept.id,
          wardName: 'Cardiac Ward A',
          floor: 2,
          bedNumber: `CARD-${i.toString().padStart(2, '0')}`,
          type: i <= 2 ? 'icu' : 'general',
          status: i <= 3 ? 'occupied' : i === 4 ? 'cleaning' : 'available',
          features: i <= 2 ? ['cardiac_monitor', 'ventilator', 'central_line'] : ['call_button'],
        },
      });
    }
  }

  console.log('Seed completed successfully!');
  console.log(`Hospital: ${hospital.name} (${hospital.code})`);
  console.log(`Departments: ${departments.length}`);
  console.log(`Admin: ${admin.email}`);
  console.log(`Doctor: ${doctor.email}`);
  console.log(`Patient: ${patient.email}`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

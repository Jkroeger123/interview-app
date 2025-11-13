import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // F-1 Student Visa Document Types
  const f1DocumentTypes = [
    {
      visaType: 'student',
      internalName: 'ds_160',
      friendlyName: 'DS-160 Confirmation Page',
      description: 'Confirmation page from your completed DS-160 form',
      isRequired: true,
      sortOrder: 1,
    },
    {
      visaType: 'student',
      internalName: 'sevis_i901',
      friendlyName: 'SEVIS I-901 Fee Receipt',
      description: 'Receipt showing payment of SEVIS I-901 fee',
      isRequired: true,
      sortOrder: 2,
    },
    {
      visaType: 'student',
      internalName: 'i20_form',
      friendlyName: 'I-20 Form',
      description: 'Certificate of Eligibility for Nonimmigrant Student Status',
      isRequired: true,
      sortOrder: 3,
    },
    {
      visaType: 'student',
      internalName: 'passport',
      friendlyName: 'Passport',
      description: 'Biographic page, prior visas (if applicable)',
      isRequired: true,
      sortOrder: 4,
    },
    {
      visaType: 'student',
      internalName: 'admission_letter',
      friendlyName: 'Admission/Acceptance Letter',
      description: 'Official acceptance letter from your university',
      isRequired: true,
      sortOrder: 5,
    },
    {
      visaType: 'student',
      internalName: 'transcripts',
      friendlyName: 'Transcripts, Diplomas, Test Scores',
      description: 'Academic records (TOEFL, GRE, SAT, etc.)',
      isRequired: true,
      sortOrder: 6,
    },
    {
      visaType: 'student',
      internalName: 'bank_statements',
      friendlyName: 'Bank Statements',
      description: '3–6 months of bank statements showing financial support',
      isRequired: true,
      sortOrder: 7,
    },
    {
      visaType: 'student',
      internalName: 'sponsor_affidavit',
      friendlyName: 'Sponsor Affidavit/Support Letter',
      description: 'Letter from sponsor confirming financial support',
      isRequired: false,
      sortOrder: 8,
    },
    {
      visaType: 'student',
      internalName: 'sponsor_tax_returns',
      friendlyName: 'Tax Returns/Pay Slips of Sponsor',
      description: 'Financial documents from your sponsor',
      isRequired: false,
      sortOrder: 9,
    },
    {
      visaType: 'student',
      internalName: 'funding_letters',
      friendlyName: 'Scholarship or Funding Letters',
      description: 'Documentation of scholarships, assistantships, or other funding',
      isRequired: false,
      sortOrder: 10,
    },
    {
      visaType: 'student',
      internalName: 'ties_to_home',
      friendlyName: 'Proof of Ties to Home Country',
      description: 'Evidence of family, property, or employment ties',
      isRequired: false,
      sortOrder: 11,
    },
  ];

  console.log('Creating F-1 Student Visa document types...');
  
  for (const docType of f1DocumentTypes) {
    await prisma.documentType.upsert({
      where: {
        visaType_internalName: {
          visaType: docType.visaType,
          internalName: docType.internalName,
        },
      },
      update: {
        friendlyName: docType.friendlyName,
        description: docType.description,
        isRequired: docType.isRequired,
        sortOrder: docType.sortOrder,
      },
      create: docType,
    });
  }

  console.log(`✅ Created ${f1DocumentTypes.length} document types for F-1 Student Visa`);
  console.log('🌱 Database seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


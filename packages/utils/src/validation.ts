import { z } from 'zod';

export const phoneSchema = z.string().regex(/^(\+91)?[6-9]\d{9}$/, 'Invalid Indian phone number');

export const abhaIdSchema = z.string().regex(/^\d{14}$/, 'ABHA ID must be 14 digits');

export const pincodeSchema = z.string().regex(/^\d{6}$/, 'Invalid pincode');

export const emailSchema = z.string().email('Invalid email address');

export const icdCodeSchema = z.string().regex(
  /^[A-Z]\d{2}(\.\d{1,4})?$/,
  'Invalid ICD-10 code format',
);

export const vitalsSchema = z.object({
  temperature: z.number().min(90).max(110).optional(),
  pulse: z.number().min(20).max(300).optional(),
  bloodPressureSystolic: z.number().min(50).max(300).optional(),
  bloodPressureDiastolic: z.number().min(20).max(200).optional(),
  respiratoryRate: z.number().min(5).max(60).optional(),
  spo2: z.number().min(50).max(100).optional(),
  weight: z.number().min(0.5).max(500).optional(),
  height: z.number().min(20).max(300).optional(),
});

export const medicationSchema = z.object({
  name: z.string().min(1),
  genericName: z.string().optional(),
  dosage: z.string().min(1),
  route: z.enum(['oral', 'iv', 'im', 'sc', 'topical', 'inhaled', 'sublingual', 'rectal']),
  frequency: z.string().min(1),
  duration: z.string().min(1),
  instructions: z.string().optional(),
});

export const createCaseSheetSchema = z.object({
  patientId: z.string().uuid(),
  departmentCode: z.string().min(2).max(4),
  chiefComplaints: z.array(z.string()).min(1),
  historyOfPresentIllness: z.string().min(1),
  pastMedicalHistory: z.string().default('None'),
  familyHistory: z.string().optional(),
  personalHistory: z.string().optional(),
  generalExamination: z.object({
    vitals: vitalsSchema,
    generalCondition: z.string(),
    consciousness: z.string(),
  }).passthrough(),
  investigations: z.array(z.object({
    name: z.string(),
    type: z.enum(['lab', 'imaging', 'procedure']),
  })).default([]),
  diagnosis: z.array(z.object({
    description: z.string(),
    type: z.enum(['primary', 'secondary', 'differential']),
    icdCode: z.string().optional(),
  })).min(1),
  treatmentPlan: z.object({
    medications: z.array(medicationSchema).default([]),
    procedures: z.array(z.string()).default([]),
    diet: z.string().optional(),
    activity: z.string().optional(),
    specialInstructions: z.string().optional(),
  }),
});

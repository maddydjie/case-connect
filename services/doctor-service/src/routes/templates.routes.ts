import { Router, Request, Response } from "express";

export const templatesRouter = Router();

interface TemplateField {
  name: string;
  label: string;
  type: "text" | "number" | "select" | "multiselect" | "textarea" | "checkbox" | "date";
  required: boolean;
  options?: string[];
  placeholder?: string;
  unit?: string;
}

interface TemplateSection {
  title: string;
  fields: TemplateField[];
}

interface DepartmentTemplate {
  departmentCode: string;
  departmentName: string;
  sections: TemplateSection[];
  commonDiagnoses: string[];
  commonInvestigations: string[];
}

const departmentTemplates: Record<string, DepartmentTemplate> = {
  CARD: {
    departmentCode: "CARD",
    departmentName: "Cardiology",
    sections: [
      {
        title: "Cardiac History",
        fields: [
          { name: "chestPain", label: "Chest Pain", type: "select", required: true, options: ["Typical angina", "Atypical angina", "Non-cardiac", "None"] },
          { name: "dyspnea", label: "Dyspnea", type: "select", required: true, options: ["NYHA I", "NYHA II", "NYHA III", "NYHA IV", "None"] },
          { name: "palpitations", label: "Palpitations", type: "checkbox", required: false },
          { name: "syncope", label: "Syncope/Pre-syncope", type: "checkbox", required: false },
          { name: "edema", label: "Peripheral Edema", type: "select", required: false, options: ["None", "Mild", "Moderate", "Severe"] },
          { name: "riskFactors", label: "Risk Factors", type: "multiselect", required: false, options: ["Hypertension", "Diabetes", "Dyslipidemia", "Smoking", "Family history", "Obesity", "Sedentary lifestyle"] },
        ],
      },
      {
        title: "Cardiac Examination",
        fields: [
          { name: "jvp", label: "JVP", type: "text", required: false, placeholder: "cm above sternal angle" },
          { name: "heartSounds", label: "Heart Sounds", type: "text", required: true, placeholder: "S1, S2, murmurs" },
          { name: "lungAuscultation", label: "Lung Auscultation", type: "text", required: true },
          { name: "peripheralPulses", label: "Peripheral Pulses", type: "text", required: false },
        ],
      },
    ],
    commonDiagnoses: ["Acute Coronary Syndrome", "Heart Failure", "Atrial Fibrillation", "Hypertensive Heart Disease", "Valvular Heart Disease", "Myocardial Infarction", "Stable Angina"],
    commonInvestigations: ["ECG", "Echocardiography", "Troponin", "BNP/NT-proBNP", "Lipid Profile", "Coronary Angiography", "Stress Test", "Holter Monitor", "Chest X-ray"],
  },

  NEUR: {
    departmentCode: "NEUR",
    departmentName: "Neurology",
    sections: [
      {
        title: "Neurological History",
        fields: [
          { name: "headache", label: "Headache", type: "textarea", required: false, placeholder: "Character, location, duration, triggers" },
          { name: "seizures", label: "Seizures", type: "select", required: false, options: ["None", "Generalized tonic-clonic", "Focal", "Absence", "Myoclonic"] },
          { name: "weakness", label: "Weakness", type: "text", required: false, placeholder: "Distribution and onset" },
          { name: "sensoryChanges", label: "Sensory Changes", type: "text", required: false },
          { name: "speechDifficulty", label: "Speech Difficulty", type: "checkbox", required: false },
          { name: "visionChanges", label: "Vision Changes", type: "checkbox", required: false },
        ],
      },
      {
        title: "Neurological Examination",
        fields: [
          { name: "mentalStatus", label: "Mental Status (GCS)", type: "number", required: true, unit: "/15" },
          { name: "cranialNerves", label: "Cranial Nerves", type: "textarea", required: true },
          { name: "motorExam", label: "Motor Examination", type: "textarea", required: true, placeholder: "Power, tone, reflexes" },
          { name: "sensoryExam", label: "Sensory Examination", type: "textarea", required: true },
          { name: "coordination", label: "Coordination/Cerebellar", type: "text", required: false },
          { name: "gait", label: "Gait", type: "text", required: false },
        ],
      },
    ],
    commonDiagnoses: ["Stroke", "Epilepsy", "Migraine", "Parkinson's Disease", "Multiple Sclerosis", "Peripheral Neuropathy", "Bell's Palsy", "Meningitis"],
    commonInvestigations: ["CT Head", "MRI Brain", "EEG", "Nerve Conduction Study", "Lumbar Puncture", "Carotid Doppler", "MR Angiography"],
  },

  ORTH: {
    departmentCode: "ORTH",
    departmentName: "Orthopedics",
    sections: [
      {
        title: "Musculoskeletal History",
        fields: [
          { name: "painLocation", label: "Pain Location", type: "text", required: true },
          { name: "painDuration", label: "Pain Duration", type: "text", required: true },
          { name: "painCharacter", label: "Pain Character", type: "select", required: true, options: ["Aching", "Sharp", "Throbbing", "Burning", "Stabbing"] },
          { name: "painScore", label: "Pain Score (VAS)", type: "number", required: true, unit: "/10" },
          { name: "mechanismOfInjury", label: "Mechanism of Injury", type: "textarea", required: false },
          { name: "functionalLimitation", label: "Functional Limitation", type: "textarea", required: false },
        ],
      },
      {
        title: "Orthopedic Examination",
        fields: [
          { name: "inspection", label: "Inspection", type: "textarea", required: true, placeholder: "Swelling, deformity, bruising" },
          { name: "palpation", label: "Palpation", type: "textarea", required: true, placeholder: "Tenderness, crepitus" },
          { name: "rangeOfMotion", label: "Range of Motion", type: "textarea", required: true },
          { name: "specialTests", label: "Special Tests", type: "textarea", required: false },
          { name: "neurovascularStatus", label: "Neurovascular Status", type: "text", required: true },
        ],
      },
    ],
    commonDiagnoses: ["Fracture", "Osteoarthritis", "Ligament Injury", "Tendinitis", "Disc Herniation", "Spondylosis", "Dislocation", "Rotator Cuff Tear"],
    commonInvestigations: ["X-ray", "MRI", "CT Scan", "Bone Density (DEXA)", "Ultrasound", "Arthroscopy", "Bone Scan"],
  },

  PEDI: {
    departmentCode: "PEDI",
    departmentName: "Pediatrics",
    sections: [
      {
        title: "Pediatric History",
        fields: [
          { name: "birthHistory", label: "Birth History", type: "textarea", required: true, placeholder: "Gestational age, mode of delivery, birth weight" },
          { name: "feedingHistory", label: "Feeding History", type: "select", required: true, options: ["Exclusive breastfeeding", "Formula feeding", "Mixed feeding", "Weaning foods", "Regular diet"] },
          { name: "immunizationStatus", label: "Immunization Status", type: "select", required: true, options: ["Up to date", "Partially immunized", "Unimmunized", "Unknown"] },
          { name: "developmentalMilestones", label: "Developmental Milestones", type: "select", required: true, options: ["Age-appropriate", "Delayed", "Advanced", "Regressed"] },
          { name: "growthConcerns", label: "Growth Concerns", type: "text", required: false },
        ],
      },
      {
        title: "Pediatric Examination",
        fields: [
          { name: "weightPercentile", label: "Weight Percentile", type: "text", required: true },
          { name: "heightPercentile", label: "Height Percentile", type: "text", required: true },
          { name: "headCircumference", label: "Head Circumference", type: "number", required: false, unit: "cm" },
          { name: "generalAppearance", label: "General Appearance", type: "textarea", required: true },
          { name: "fontanelle", label: "Fontanelle (if applicable)", type: "text", required: false },
          { name: "hydration", label: "Hydration Status", type: "select", required: true, options: ["Well hydrated", "Mildly dehydrated", "Moderately dehydrated", "Severely dehydrated"] },
        ],
      },
    ],
    commonDiagnoses: ["Upper Respiratory Infection", "Acute Gastroenteritis", "Pneumonia", "Bronchiolitis", "Febrile Seizures", "Urinary Tract Infection", "Otitis Media", "Asthma Exacerbation"],
    commonInvestigations: ["Complete Blood Count", "CRP", "Blood Culture", "Urine Analysis", "Chest X-ray", "Stool Examination", "Rapid Strep Test"],
  },

  GENM: {
    departmentCode: "GENM",
    departmentName: "General Medicine",
    sections: [
      {
        title: "General History",
        fields: [
          { name: "presentingComplaint", label: "Presenting Complaint", type: "textarea", required: true },
          { name: "duration", label: "Duration", type: "text", required: true },
          { name: "associatedSymptoms", label: "Associated Symptoms", type: "textarea", required: false },
          { name: "pastMedicalHistory", label: "Past Medical History", type: "multiselect", required: false, options: ["Diabetes", "Hypertension", "Asthma", "COPD", "Thyroid disorder", "Liver disease", "Kidney disease", "Cancer", "None"] },
          { name: "surgicalHistory", label: "Surgical History", type: "textarea", required: false },
          { name: "drugHistory", label: "Drug History", type: "textarea", required: false },
          { name: "familyHistory", label: "Family History", type: "textarea", required: false },
          { name: "socialHistory", label: "Social History", type: "textarea", required: false, placeholder: "Smoking, alcohol, occupation" },
        ],
      },
      {
        title: "Systemic Examination",
        fields: [
          { name: "general", label: "General Examination", type: "textarea", required: true, placeholder: "Pallor, icterus, cyanosis, clubbing, edema, lymphadenopathy" },
          { name: "respiratory", label: "Respiratory System", type: "textarea", required: true },
          { name: "cardiovascular", label: "Cardiovascular System", type: "textarea", required: true },
          { name: "abdominal", label: "Abdominal Examination", type: "textarea", required: true },
          { name: "cns", label: "Central Nervous System", type: "textarea", required: false },
        ],
      },
    ],
    commonDiagnoses: ["Fever of Unknown Origin", "Anemia", "Diabetes Mellitus", "Hypertension", "COPD Exacerbation", "Pneumonia", "Urinary Tract Infection", "Dengue Fever", "Typhoid Fever"],
    commonInvestigations: ["Complete Blood Count", "Blood Sugar", "Renal Function Test", "Liver Function Test", "Urine Analysis", "Chest X-ray", "ECG", "Blood Culture", "Thyroid Profile"],
  },

  GYNE: {
    departmentCode: "GYNE",
    departmentName: "Gynecology",
    sections: [
      {
        title: "Gynecological History",
        fields: [
          { name: "menstrualHistory", label: "Menstrual History (LMP)", type: "date", required: true },
          { name: "cycleRegularity", label: "Cycle Regularity", type: "select", required: true, options: ["Regular", "Irregular", "Amenorrhea", "Post-menopausal"] },
          { name: "obstetricHistory", label: "Obstetric History (G/P/A/L)", type: "text", required: true, placeholder: "e.g., G2P1A0L1" },
          { name: "contraception", label: "Contraception", type: "select", required: false, options: ["None", "OCP", "IUD", "Barrier", "Injectable", "Implant", "Sterilization"] },
          { name: "vaginalDischarge", label: "Vaginal Discharge", type: "text", required: false },
          { name: "postCoitalBleeding", label: "Post-coital Bleeding", type: "checkbox", required: false },
        ],
      },
      {
        title: "Gynecological Examination",
        fields: [
          { name: "abdominalExam", label: "Abdominal Examination", type: "textarea", required: true },
          { name: "speculumExam", label: "Speculum Examination", type: "textarea", required: false },
          { name: "bimanualExam", label: "Bimanual Examination", type: "textarea", required: false },
          { name: "breastExam", label: "Breast Examination", type: "textarea", required: false },
        ],
      },
    ],
    commonDiagnoses: ["PCOS", "Fibroid Uterus", "Ovarian Cyst", "Endometriosis", "Cervicitis", "Pelvic Inflammatory Disease", "Abnormal Uterine Bleeding", "Menopause-related symptoms"],
    commonInvestigations: ["Pelvic Ultrasound", "Pap Smear", "Hormonal Profile (FSH, LH, Estradiol)", "CA-125", "Endometrial Biopsy", "Hysteroscopy", "Complete Blood Count"],
  },

  DERM: {
    departmentCode: "DERM",
    departmentName: "Dermatology",
    sections: [
      {
        title: "Dermatological History",
        fields: [
          { name: "lesionOnset", label: "Onset of Lesion", type: "text", required: true },
          { name: "lesionProgression", label: "Progression", type: "select", required: true, options: ["Spreading", "Static", "Resolving", "Recurrent"] },
          { name: "itching", label: "Itching/Pruritus", type: "select", required: true, options: ["None", "Mild", "Moderate", "Severe"] },
          { name: "pain", label: "Pain/Burning", type: "select", required: false, options: ["None", "Mild", "Moderate", "Severe"] },
          { name: "previousTreatment", label: "Previous Treatment", type: "textarea", required: false },
          { name: "allergies", label: "Drug/Contact Allergies", type: "text", required: false },
        ],
      },
      {
        title: "Dermatological Examination",
        fields: [
          { name: "distribution", label: "Distribution", type: "text", required: true, placeholder: "Localized, generalized, dermatomal" },
          { name: "morphology", label: "Morphology", type: "multiselect", required: true, options: ["Macule", "Papule", "Plaque", "Nodule", "Vesicle", "Bulla", "Pustule", "Patch", "Ulcer", "Erosion"] },
          { name: "color", label: "Color", type: "text", required: true },
          { name: "size", label: "Size", type: "text", required: true },
          { name: "surface", label: "Surface", type: "text", required: false, placeholder: "Smooth, scaly, crusted" },
          { name: "specialFindings", label: "Special Findings", type: "textarea", required: false, placeholder: "Koebner phenomenon, dermographism, etc." },
        ],
      },
    ],
    commonDiagnoses: ["Eczema/Dermatitis", "Psoriasis", "Fungal Infection", "Acne Vulgaris", "Urticaria", "Scabies", "Vitiligo", "Contact Dermatitis", "Herpes Zoster"],
    commonInvestigations: ["KOH Mount", "Skin Biopsy", "Patch Testing", "Wood's Lamp", "Dermoscopy", "Fungal Culture", "Complete Blood Count", "IgE Levels"],
  },

  PSYC: {
    departmentCode: "PSYC",
    departmentName: "Psychiatry",
    sections: [
      {
        title: "Psychiatric History",
        fields: [
          { name: "presentingComplaint", label: "Presenting Complaint", type: "textarea", required: true },
          { name: "historyOfPresentIllness", label: "History of Present Illness", type: "textarea", required: true },
          { name: "pastPsychiatricHistory", label: "Past Psychiatric History", type: "textarea", required: false },
          { name: "substanceUse", label: "Substance Use", type: "multiselect", required: false, options: ["Alcohol", "Tobacco", "Cannabis", "Opioids", "Stimulants", "Sedatives", "None"] },
          { name: "familyPsychHistory", label: "Family Psychiatric History", type: "textarea", required: false },
          { name: "suicidalIdeation", label: "Suicidal Ideation", type: "select", required: true, options: ["None", "Passive", "Active without plan", "Active with plan"] },
          { name: "selfHarm", label: "Self-Harm History", type: "checkbox", required: false },
        ],
      },
      {
        title: "Mental Status Examination",
        fields: [
          { name: "appearance", label: "Appearance & Behavior", type: "textarea", required: true },
          { name: "speech", label: "Speech", type: "text", required: true, placeholder: "Rate, volume, tone" },
          { name: "mood", label: "Mood (Subjective)", type: "text", required: true },
          { name: "affect", label: "Affect (Objective)", type: "select", required: true, options: ["Euthymic", "Depressed", "Anxious", "Euphoric", "Irritable", "Flat", "Blunted", "Labile"] },
          { name: "thoughtContent", label: "Thought Content", type: "textarea", required: true, placeholder: "Delusions, obsessions, phobias" },
          { name: "thoughtProcess", label: "Thought Process", type: "select", required: true, options: ["Logical", "Tangential", "Circumstantial", "Loose associations", "Flight of ideas", "Thought block"] },
          { name: "perception", label: "Perception", type: "textarea", required: false, placeholder: "Hallucinations - auditory, visual, etc." },
          { name: "cognition", label: "Cognition (MMSE Score)", type: "number", required: false, unit: "/30" },
          { name: "insight", label: "Insight", type: "select", required: true, options: ["Complete", "Partial", "None"] },
          { name: "judgment", label: "Judgment", type: "select", required: true, options: ["Intact", "Impaired"] },
        ],
      },
    ],
    commonDiagnoses: ["Major Depressive Disorder", "Generalized Anxiety Disorder", "Bipolar Disorder", "Schizophrenia", "PTSD", "OCD", "Panic Disorder", "Substance Use Disorder", "Adjustment Disorder"],
    commonInvestigations: ["Thyroid Function Test", "Complete Blood Count", "Liver Function Test", "Urine Drug Screen", "B12 and Folate Levels", "CT/MRI Brain (if indicated)", "EEG (if indicated)"],
  },
};

// GET / - List all department templates
templatesRouter.get("/", (_req: Request, res: Response) => {
  const summary = Object.values(departmentTemplates).map((t) => ({
    departmentCode: t.departmentCode,
    departmentName: t.departmentName,
    sectionCount: t.sections.length,
    fieldCount: t.sections.reduce((acc, s) => acc + s.fields.length, 0),
  }));

  res.json({ success: true, data: summary });
});

// GET /:departmentCode - Get template for specific department
templatesRouter.get("/:departmentCode", (req: Request, res: Response) => {
  const code = req.params.departmentCode.toUpperCase();
  const template = departmentTemplates[code];

  if (!template) {
    res.status(404).json({
      success: false,
      error: `Template not found for department code: ${code}`,
      availableCodes: Object.keys(departmentTemplates),
    });
    return;
  }

  res.json({ success: true, data: template });
});

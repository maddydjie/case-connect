export interface MedicalCase {
  id: string;
  department: string;
  difficulty: "easy" | "medium" | "hard";
  title: string;
  presentation: {
    chiefComplaint: string;
    symptoms: string[];
    history: string;
    vitals: {
      bloodPressure: string;
      heartRate: number;
      temperature: number;
      respiratoryRate: number;
      oxygenSaturation: number;
    };
    examinationFindings: string[];
    labResults?: string[];
    imagingResults?: string[];
  };
  correctDiagnosis: string;
  differentialDiagnoses: string[];
  keyFindings: string[];
  explanation: string;
  icdCode: string;
}

export const CASE_BANK: MedicalCase[] = [
  // ──────────────── CARDIOLOGY ────────────────
  {
    id: "CARD-001",
    department: "Cardiology",
    difficulty: "easy",
    title: "Chest Pain on Exertion",
    presentation: {
      chiefComplaint: "Chest pain during physical activity for the past 2 weeks",
      symptoms: [
        "Substernal chest pressure on exertion",
        "Pain radiates to left arm",
        "Relief with rest within 5 minutes",
        "Mild shortness of breath",
      ],
      history:
        "58-year-old male, smoker for 30 years, hypertension for 10 years, family history of coronary artery disease. Currently on amlodipine 5mg daily.",
      vitals: {
        bloodPressure: "152/94",
        heartRate: 82,
        temperature: 36.8,
        respiratoryRate: 18,
        oxygenSaturation: 97,
      },
      examinationFindings: [
        "S4 gallop on auscultation",
        "No murmurs",
        "Bilateral pedal pulses present",
        "No peripheral edema",
      ],
      labResults: [
        "Troponin: negative",
        "Total cholesterol: 268 mg/dL",
        "LDL: 182 mg/dL",
        "HbA1c: 5.9%",
      ],
      imagingResults: [
        "ECG: ST depression in leads V4-V6 during stress test",
        "Chest X-ray: mild cardiomegaly",
      ],
    },
    correctDiagnosis: "Stable Angina Pectoris",
    differentialDiagnoses: [
      "Unstable angina",
      "Musculoskeletal chest pain",
      "Gastroesophageal reflux disease",
      "Aortic stenosis",
    ],
    keyFindings: [
      "Exertional chest pain relieved by rest",
      "ST depression on stress test",
      "Multiple cardiovascular risk factors",
      "Negative troponin (ruling out acute MI)",
    ],
    explanation:
      "The classic pattern of substernal chest pain on exertion that resolves with rest, combined with ST depression during stress testing and negative troponin, is characteristic of stable angina. The patient's risk factors (smoking, hypertension, hyperlipidemia, family history) strongly support coronary artery disease as the underlying etiology.",
    icdCode: "I20.8",
  },
  {
    id: "CARD-002",
    department: "Cardiology",
    difficulty: "medium",
    title: "Sudden Palpitations and Dizziness",
    presentation: {
      chiefComplaint: "Sudden onset of rapid heartbeat and lightheadedness",
      symptoms: [
        "Rapid palpitations starting abruptly",
        "Lightheadedness",
        "Mild chest discomfort",
        "Episodes last 20-30 minutes",
        "Occurring 2-3 times per week for the past month",
      ],
      history:
        "34-year-old female, no significant past medical history. Drinks 4-5 cups of coffee daily. Social alcohol use. No medications.",
      vitals: {
        bloodPressure: "118/72",
        heartRate: 168,
        temperature: 36.7,
        respiratoryRate: 20,
        oxygenSaturation: 98,
      },
      examinationFindings: [
        "Tachycardic, regular rhythm",
        "No murmurs or gallops",
        "Lungs clear",
        "No jugular venous distension",
      ],
      labResults: ["TSH: 1.8 mIU/L (normal)", "CBC: normal", "BMP: normal"],
      imagingResults: [
        "ECG: narrow complex tachycardia at 168 bpm, no P waves visible, regular RR intervals",
        "Echocardiogram: normal structure and function",
      ],
    },
    correctDiagnosis: "Supraventricular Tachycardia (SVT)",
    differentialDiagnoses: [
      "Atrial flutter",
      "Atrial fibrillation",
      "Sinus tachycardia",
      "Anxiety/panic disorder",
      "Hyperthyroidism",
    ],
    keyFindings: [
      "Narrow complex tachycardia",
      "Sudden onset and offset pattern",
      "Regular rhythm without visible P waves",
      "Normal thyroid function",
    ],
    explanation:
      "The abrupt onset/offset of a narrow complex regular tachycardia at 168 bpm, without identifiable P waves and with a structurally normal heart, is classic for AV nodal re-entrant tachycardia (AVNRT), the most common type of SVT. The normal TSH excludes thyroid-driven tachycardia, and sinus tachycardia would not present with this abrupt onset/offset pattern.",
    icdCode: "I47.1",
  },
  {
    id: "CARD-003",
    department: "Cardiology",
    difficulty: "hard",
    title: "Progressive Dyspnea with Syncope",
    presentation: {
      chiefComplaint:
        "Worsening shortness of breath over 6 months with two episodes of fainting",
      symptoms: [
        "Progressive exertional dyspnea",
        "Two syncopal episodes during exercise",
        "Fatigue",
        "Lower extremity swelling",
        "Dry cough",
      ],
      history:
        "42-year-old female, history of Raynaud's phenomenon. Uses fenfluramine-derivative appetite suppressant for past 2 years. No smoking. BMI 31.",
      vitals: {
        bloodPressure: "104/68",
        heartRate: 96,
        temperature: 36.6,
        respiratoryRate: 24,
        oxygenSaturation: 91,
      },
      examinationFindings: [
        "Loud P2 component of second heart sound",
        "Right ventricular heave",
        "Elevated jugular venous pressure",
        "Bilateral ankle edema 2+",
        "Tricuspid regurgitation murmur",
      ],
      labResults: [
        "BNP: 680 pg/mL (elevated)",
        "D-dimer: mildly elevated",
        "ANA: negative",
        "Anti-Scl-70: negative",
      ],
      imagingResults: [
        "ECG: right axis deviation, right ventricular hypertrophy pattern",
        "Chest X-ray: enlarged pulmonary arteries, right heart enlargement",
        "Echocardiogram: estimated RVSP 72 mmHg, dilated RV with reduced function, normal LV",
      ],
    },
    correctDiagnosis: "Pulmonary Arterial Hypertension",
    differentialDiagnoses: [
      "Chronic thromboembolic pulmonary hypertension",
      "Left heart failure",
      "Interstitial lung disease",
      "Chronic pulmonary embolism",
      "Connective tissue disease-associated PAH",
    ],
    keyFindings: [
      "Elevated RVSP on echocardiogram",
      "Right heart failure signs (JVD, edema, TR murmur)",
      "Loud P2 and RV heave",
      "Appetite suppressant use (known PAH risk factor)",
      "Exertional syncope suggesting severe disease",
    ],
    explanation:
      "The combination of progressive exertional dyspnea, exertional syncope, signs of right heart failure, loud P2, and significantly elevated RVSP on echocardiography points to pulmonary arterial hypertension. The patient's use of fenfluramine-derivative appetite suppressants is a well-established risk factor for PAH. Exertional syncope is an ominous sign indicating severely limited cardiac output.",
    icdCode: "I27.0",
  },
  {
    id: "CARD-004",
    department: "Cardiology",
    difficulty: "medium",
    title: "Irregular Heartbeat and Stroke Risk",
    presentation: {
      chiefComplaint:
        "Irregular heartbeat noticed for 3 days with fatigue",
      symptoms: [
        "Irregular palpitations",
        "Fatigue and exercise intolerance",
        "Mild dyspnea on exertion",
        "No chest pain",
        "No syncope",
      ],
      history:
        "72-year-old male, hypertension, type 2 diabetes, prior TIA 1 year ago. On metformin, lisinopril, aspirin.",
      vitals: {
        bloodPressure: "138/86",
        heartRate: 112,
        temperature: 36.9,
        respiratoryRate: 18,
        oxygenSaturation: 96,
      },
      examinationFindings: [
        "Irregularly irregular pulse",
        "Variable intensity S1",
        "No murmurs",
        "Lungs clear bilaterally",
        "No peripheral edema",
      ],
      labResults: [
        "TSH: 2.1 mIU/L",
        "BNP: 245 pg/mL",
        "Creatinine: 1.1 mg/dL",
        "HbA1c: 7.2%",
      ],
      imagingResults: [
        "ECG: absent P waves, irregularly irregular RR intervals, ventricular rate 112 bpm",
        "Echocardiogram: mildly dilated left atrium, LVEF 50%",
      ],
    },
    correctDiagnosis: "Atrial Fibrillation",
    differentialDiagnoses: [
      "Atrial flutter with variable block",
      "Multifocal atrial tachycardia",
      "Frequent premature atrial contractions",
      "Sick sinus syndrome",
    ],
    keyFindings: [
      "Irregularly irregular rhythm",
      "Absent P waves on ECG",
      "Variable S1 intensity",
      "High CHA2DS2-VASc score requiring anticoagulation",
      "Prior TIA indicating prior embolic event",
    ],
    explanation:
      "The hallmark findings of an irregularly irregular pulse, absent P waves on ECG, and variable S1 intensity are diagnostic of atrial fibrillation. With a CHA2DS2-VASc score of 5 (age ≥75, hypertension, diabetes, prior TIA), this patient has a high stroke risk and requires systemic anticoagulation beyond aspirin alone.",
    icdCode: "I48.0",
  },

  // ──────────────── NEUROLOGY ────────────────
  {
    id: "NEURO-001",
    department: "Neurology",
    difficulty: "easy",
    title: "Unilateral Headache with Visual Aura",
    presentation: {
      chiefComplaint:
        "Severe throbbing headache on the right side with flashing lights",
      symptoms: [
        "Right-sided throbbing headache lasting 8-12 hours",
        "Visual aura: zigzag lines for 20 minutes before headache",
        "Nausea and vomiting",
        "Photophobia and phonophobia",
        "Worsened by physical activity",
      ],
      history:
        "28-year-old female, episodes occurring 3-4 times per month. Mother has similar headaches. On oral contraceptives. No other medications.",
      vitals: {
        bloodPressure: "122/76",
        heartRate: 78,
        temperature: 36.7,
        respiratoryRate: 16,
        oxygenSaturation: 99,
      },
      examinationFindings: [
        "Neurological exam normal between attacks",
        "No papilledema",
        "No focal neurological deficits",
        "Tenderness over right temporal region",
      ],
    },
    correctDiagnosis: "Migraine with Aura",
    differentialDiagnoses: [
      "Tension-type headache",
      "Cluster headache",
      "Intracranial mass lesion",
      "Subarachnoid hemorrhage",
      "Temporal arteritis",
    ],
    keyFindings: [
      "Unilateral throbbing headache",
      "Preceding visual aura (zigzag lines)",
      "Associated nausea, photophobia, phonophobia",
      "Family history of similar headaches",
      "Normal neurological exam",
    ],
    explanation:
      "This presentation meets ICHD-3 criteria for migraine with aura: recurrent unilateral headaches with typical visual aura (scintillating scotoma), accompanied by nausea, photo/phonophobia, lasting 4-72 hours. The family history supports a genetic predisposition. Notably, the use of oral contraceptives in a patient with migraine with aura confers increased stroke risk.",
    icdCode: "G43.1",
  },
  {
    id: "NEURO-002",
    department: "Neurology",
    difficulty: "medium",
    title: "Progressive Weakness and Numbness",
    presentation: {
      chiefComplaint:
        "Ascending weakness in legs progressing to arms over 5 days",
      symptoms: [
        "Symmetric ascending weakness starting in feet",
        "Tingling and numbness in hands and feet",
        "Difficulty walking, now needing assistance",
        "Back pain",
        "Difficulty swallowing solids (started yesterday)",
      ],
      history:
        "45-year-old male, had a diarrheal illness (Campylobacter) 2 weeks ago. No chronic medical conditions. No medications.",
      vitals: {
        bloodPressure: "144/88",
        heartRate: 104,
        temperature: 37.1,
        respiratoryRate: 22,
        oxygenSaturation: 95,
      },
      examinationFindings: [
        "Symmetric weakness: upper extremities 4/5, lower extremities 2/5",
        "Areflexia in all extremities",
        "Decreased sensation to light touch in glove-and-stocking pattern",
        "Facial weakness bilateral",
        "Forced vital capacity 1.8L (predicted 4.2L)",
      ],
      labResults: [
        "CSF: protein 128 mg/dL (elevated), WBC 2 cells/μL (albuminocytologic dissociation)",
        "Anti-ganglioside antibodies: pending",
      ],
      imagingResults: [
        "MRI spine: enhancement of cauda equina nerve roots",
        "Nerve conduction studies: severely prolonged distal latencies, reduced conduction velocities, conduction block",
      ],
    },
    correctDiagnosis: "Guillain-Barré Syndrome (AIDP variant)",
    differentialDiagnoses: [
      "Transverse myelitis",
      "Myasthenia gravis",
      "Spinal cord compression",
      "Tick paralysis",
      "Chronic inflammatory demyelinating polyneuropathy",
    ],
    keyFindings: [
      "Ascending symmetric weakness post-infectious",
      "Areflexia",
      "Albuminocytologic dissociation in CSF",
      "Preceding Campylobacter infection",
      "Respiratory compromise (reduced FVC)",
    ],
    explanation:
      "The ascending symmetric weakness with areflexia following a Campylobacter infection, combined with CSF showing elevated protein without pleocytosis (albuminocytologic dissociation) and demyelinating pattern on nerve conduction studies, is classic for Guillain-Barré syndrome (acute inflammatory demyelinating polyneuropathy). The respiratory compromise (FVC < 50% predicted) is an urgent indication for ICU monitoring.",
    icdCode: "G61.0",
  },
  {
    id: "NEURO-003",
    department: "Neurology",
    difficulty: "hard",
    title: "Acute Facial Droop and Speech Difficulty",
    presentation: {
      chiefComplaint:
        "Sudden onset right-sided facial droop and difficulty speaking, noticed 90 minutes ago",
      symptoms: [
        "Right facial droop (lower face)",
        "Slurred speech",
        "Right arm weakness",
        "Right leg mild weakness",
        "No headache",
      ],
      history:
        "67-year-old male, atrial fibrillation (not on anticoagulation), hypertension, hyperlipidemia. On aspirin only. Last known well: 90 minutes ago.",
      vitals: {
        bloodPressure: "178/98",
        heartRate: 88,
        temperature: 37.0,
        respiratoryRate: 18,
        oxygenSaturation: 96,
      },
      examinationFindings: [
        "Right lower facial droop, forehead sparing",
        "Dysarthria",
        "Right upper extremity: drifts down within 10 seconds",
        "Right lower extremity: slight drift",
        "Right-sided neglect",
        "NIHSS score: 12",
      ],
      labResults: [
        "Glucose: 142 mg/dL",
        "INR: 1.0",
        "Platelet count: 218,000",
        "Creatinine: 0.9 mg/dL",
      ],
      imagingResults: [
        "CT head (non-contrast): no hemorrhage, no early ischemic changes",
        "CT angiography: occlusion of left M1 segment of middle cerebral artery",
      ],
    },
    correctDiagnosis: "Acute Ischemic Stroke (Left MCA Territory)",
    differentialDiagnoses: [
      "Hemorrhagic stroke",
      "Todd's paralysis (post-seizure)",
      "Hypoglycemia",
      "Complex migraine",
      "Brain tumor with acute presentation",
    ],
    keyFindings: [
      "Acute onset focal neurological deficits",
      "Right-sided weakness with forehead-sparing facial droop (upper motor neuron pattern)",
      "Known atrial fibrillation without anticoagulation (embolic source)",
      "CT negative for hemorrhage",
      "CTA showing left M1 occlusion",
      "Within thrombolysis and thrombectomy window",
    ],
    explanation:
      "The sudden onset of right-sided upper motor neuron facial weakness, dysarthria, and right hemiparesis in a patient with unprotected atrial fibrillation is highly consistent with a cardioembolic ischemic stroke. The CT excludes hemorrhage, and CTA confirms left MCA occlusion. With NIHSS 12, presentation at 90 minutes, and large vessel occlusion, this patient is a candidate for both IV thrombolysis and mechanical thrombectomy.",
    icdCode: "I63.1",
  },

  // ──────────────── ORTHOPEDICS ────────────────
  {
    id: "ORTHO-001",
    department: "Orthopedics",
    difficulty: "easy",
    title: "Knee Pain After Sports Injury",
    presentation: {
      chiefComplaint: "Right knee pain and swelling after twisting injury during soccer",
      symptoms: [
        "Immediate onset of knee pain during pivoting",
        "Heard a 'pop' at time of injury",
        "Rapid swelling within 2 hours",
        "Unable to fully extend the knee",
        "Feeling of knee 'giving way'",
      ],
      history:
        "22-year-old male athlete. No prior knee injuries. Injury occurred during a soccer game 6 hours ago.",
      vitals: {
        bloodPressure: "128/78",
        heartRate: 84,
        temperature: 36.8,
        respiratoryRate: 16,
        oxygenSaturation: 99,
      },
      examinationFindings: [
        "Moderate effusion right knee",
        "Positive Lachman test",
        "Positive anterior drawer test",
        "Negative posterior drawer",
        "Tender along medial joint line",
        "Negative varus/valgus stress at 0° and 30°",
      ],
      imagingResults: [
        "X-ray: no fracture, joint effusion",
        "MRI: complete tear of anterior cruciate ligament, partial medial meniscus tear",
      ],
    },
    correctDiagnosis: "Anterior Cruciate Ligament (ACL) Tear",
    differentialDiagnoses: [
      "Meniscal tear (isolated)",
      "Medial collateral ligament sprain",
      "Posterior cruciate ligament tear",
      "Patellar dislocation",
      "Tibial plateau fracture",
    ],
    keyFindings: [
      "Mechanism: twisting/pivoting injury",
      "Audible 'pop' at injury",
      "Rapid effusion (hemarthrosis)",
      "Positive Lachman and anterior drawer tests",
      "MRI confirmation of ACL tear",
    ],
    explanation:
      "The classic triad of a 'pop' during a pivoting mechanism, rapid effusion (hemarthrosis), and positive Lachman test is highly indicative of an ACL tear. The Lachman test is the most sensitive clinical test for ACL injury. The associated medial meniscus tear is a common concomitant injury (the 'unhappy triad' historically also includes MCL).",
    icdCode: "S83.51",
  },
  {
    id: "ORTHO-002",
    department: "Orthopedics",
    difficulty: "medium",
    title: "Progressive Hip Pain in Elderly Patient",
    presentation: {
      chiefComplaint: "Right hip pain for 6 months, worsening with activity",
      symptoms: [
        "Deep groin pain on the right side",
        "Pain worse with walking and weight-bearing",
        "Morning stiffness lasting 20-30 minutes",
        "Difficulty putting on shoes and socks",
        "Limping gait",
      ],
      history:
        "68-year-old female, BMI 32, history of knee osteoarthritis. Retired nurse. Using acetaminophen with minimal relief.",
      vitals: {
        bloodPressure: "136/82",
        heartRate: 76,
        temperature: 36.7,
        respiratoryRate: 16,
        oxygenSaturation: 98,
      },
      examinationFindings: [
        "Antalgic gait",
        "Reduced internal rotation right hip (10° vs 35° left)",
        "Pain with FADIR test (flexion, adduction, internal rotation)",
        "Positive Trendelenburg sign on right",
        "Leg length discrepancy: right leg 1cm shorter",
      ],
      labResults: [
        "ESR: 12 mm/hr (normal)",
        "CRP: 3 mg/L (normal)",
        "Rheumatoid factor: negative",
        "Uric acid: normal",
      ],
      imagingResults: [
        "X-ray pelvis: right hip joint space narrowing (superolateral), subchondral sclerosis, osteophyte formation, subchondral cysts",
      ],
    },
    correctDiagnosis: "Hip Osteoarthritis (Severe)",
    differentialDiagnoses: [
      "Avascular necrosis of femoral head",
      "Rheumatoid arthritis",
      "Hip labral tear",
      "Trochanteric bursitis",
      "Referred pain from lumbar spine",
    ],
    keyFindings: [
      "Progressive weight-bearing pain in groin",
      "Reduced internal rotation (earliest and most specific sign)",
      "Classic X-ray: joint space narrowing, sclerosis, osteophytes, cysts",
      "Normal inflammatory markers (excluding RA/infection)",
      "Short morning stiffness (< 30 min, favoring OA over RA)",
    ],
    explanation:
      "The progressive groin pain in a weight-bearing pattern, restricted internal rotation, and classic radiographic findings (Kellgren-Lawrence grade 3-4) of joint space narrowing, subchondral sclerosis, osteophytes, and cysts are diagnostic of hip osteoarthritis. The normal inflammatory markers, negative RF, and short morning stiffness help distinguish this from inflammatory arthropathies.",
    icdCode: "M16.1",
  },

  // ──────────────── GENERAL MEDICINE ────────────────
  {
    id: "GM-001",
    department: "General Medicine",
    difficulty: "easy",
    title: "Fatigue and Weight Gain",
    presentation: {
      chiefComplaint:
        "Fatigue, weight gain, and cold intolerance for the past 4 months",
      symptoms: [
        "Persistent fatigue despite adequate sleep",
        "Unintentional weight gain of 8 kg",
        "Cold intolerance",
        "Constipation",
        "Dry skin and brittle hair",
        "Difficulty concentrating",
      ],
      history:
        "35-year-old female, no significant past medical history. Family history of thyroid disease (mother). No medications. Regular menstrual cycles becoming heavier.",
      vitals: {
        bloodPressure: "108/72",
        heartRate: 58,
        temperature: 36.2,
        respiratoryRate: 14,
        oxygenSaturation: 99,
      },
      examinationFindings: [
        "Bradycardia",
        "Dry coarse skin",
        "Non-pitting edema of hands and face (myxedema)",
        "Delayed relaxation of ankle reflexes",
        "Diffusely enlarged thyroid (non-tender)",
      ],
      labResults: [
        "TSH: 42 mIU/L (elevated, normal 0.4-4.0)",
        "Free T4: 0.4 ng/dL (low, normal 0.8-1.8)",
        "Anti-TPO antibodies: strongly positive",
        "CBC: mild normocytic anemia",
        "Cholesterol: 248 mg/dL",
      ],
    },
    correctDiagnosis: "Hashimoto's Thyroiditis (Primary Hypothyroidism)",
    differentialDiagnoses: [
      "Depression",
      "Iron deficiency anemia",
      "Type 2 diabetes mellitus",
      "Chronic fatigue syndrome",
      "Adrenal insufficiency",
    ],
    keyFindings: [
      "Classic hypothyroid symptoms: fatigue, weight gain, cold intolerance, constipation",
      "Markedly elevated TSH with low free T4",
      "Positive anti-TPO antibodies (autoimmune etiology)",
      "Physical signs: myxedema, delayed reflexes, goiter",
      "Family history of thyroid disease",
    ],
    explanation:
      "The constellation of fatigue, weight gain, cold intolerance, constipation, and dry skin with confirmatory labs (high TSH, low free T4) establishes primary hypothyroidism. The strongly positive anti-TPO antibodies identify Hashimoto's thyroiditis as the etiology, the most common cause of hypothyroidism in iodine-sufficient regions. The family history supports an autoimmune predisposition.",
    icdCode: "E06.3",
  },
  {
    id: "GM-002",
    department: "General Medicine",
    difficulty: "medium",
    title: "Polyuria and Polydipsia in a Young Adult",
    presentation: {
      chiefComplaint:
        "Excessive thirst and frequent urination for 3 weeks, unintentional weight loss",
      symptoms: [
        "Polyuria: urinating 10-12 times daily",
        "Polydipsia: drinking 4-5 liters of water daily",
        "Unintentional weight loss of 6 kg in 3 weeks",
        "Blurred vision",
        "Fatigue",
        "Nausea for the past 2 days",
      ],
      history:
        "19-year-old male college student. No prior medical history. Family history: father has type 1 diabetes. No medications.",
      vitals: {
        bloodPressure: "112/68",
        heartRate: 108,
        temperature: 37.1,
        respiratoryRate: 26,
        oxygenSaturation: 99,
      },
      examinationFindings: [
        "Dehydrated: dry mucous membranes, decreased skin turgor",
        "Deep rapid breathing (Kussmaul respiration)",
        "Fruity odor on breath",
        "Tachycardic",
        "Mild diffuse abdominal tenderness",
      ],
      labResults: [
        "Blood glucose: 428 mg/dL",
        "HbA1c: 12.8%",
        "pH: 7.18 (metabolic acidosis)",
        "Serum bicarbonate: 10 mEq/L",
        "Anion gap: 28",
        "Serum ketones: strongly positive",
        "C-peptide: 0.2 ng/mL (very low)",
        "Anti-GAD antibodies: positive",
      ],
    },
    correctDiagnosis: "Type 1 Diabetes Mellitus with Diabetic Ketoacidosis",
    differentialDiagnoses: [
      "Type 2 diabetes mellitus",
      "Diabetes insipidus",
      "Hyperthyroidism",
      "Cushing's syndrome",
      "Alcoholic ketoacidosis",
    ],
    keyFindings: [
      "Classic triad: polyuria, polydipsia, weight loss",
      "Hyperglycemia with high anion gap metabolic acidosis",
      "Kussmaul respiration and fruity breath (ketoacidosis)",
      "Very low C-peptide (absent insulin production)",
      "Positive anti-GAD antibodies (autoimmune destruction of beta cells)",
    ],
    explanation:
      "The presentation of polyuria, polydipsia, and weight loss in a young patient with severe hyperglycemia, high anion gap metabolic acidosis, and ketonemia constitutes diabetic ketoacidosis (DKA). The very low C-peptide and positive anti-GAD antibodies confirm autoimmune destruction of pancreatic beta cells, diagnostic of type 1 diabetes. The Kussmaul breathing is a compensatory response to metabolic acidosis.",
    icdCode: "E10.10",
  },
  {
    id: "GM-003",
    department: "General Medicine",
    difficulty: "hard",
    title: "Recurrent Fevers and Night Sweats",
    presentation: {
      chiefComplaint:
        "Intermittent fevers, night sweats, and unintentional weight loss for 2 months",
      symptoms: [
        "Evening fevers reaching 38.5-39°C",
        "Drenching night sweats requiring sheet changes",
        "Unintentional weight loss of 10 kg",
        "Generalized pruritus, worse after hot showers",
        "Fatigue",
        "Painless neck swelling noticed 6 weeks ago",
      ],
      history:
        "27-year-old male, previously healthy. No recent travel. Non-smoker. Social alcohol use. No medications.",
      vitals: {
        bloodPressure: "118/74",
        heartRate: 86,
        temperature: 38.6,
        respiratoryRate: 18,
        oxygenSaturation: 97,
      },
      examinationFindings: [
        "Painless, rubbery, non-tender cervical and supraclavicular lymphadenopathy (2-4 cm)",
        "Splenomegaly palpable 3 cm below costal margin",
        "No hepatomegaly",
        "No skin rashes",
        "No jaundice",
      ],
      labResults: [
        "ESR: 78 mm/hr",
        "LDH: 420 U/L (elevated)",
        "Albumin: 3.0 g/dL (low)",
        "CBC: mild leukocytosis, eosinophilia, lymphopenia",
        "Liver function: mildly elevated ALP",
        "HIV: negative",
        "Blood cultures: negative",
      ],
      imagingResults: [
        "CT chest/abdomen/pelvis: bilateral cervical, supraclavicular, mediastinal, and para-aortic lymphadenopathy; splenomegaly",
        "Lymph node biopsy: Reed-Sternberg cells in mixed cellularity background",
      ],
    },
    correctDiagnosis: "Hodgkin Lymphoma (Mixed Cellularity Subtype)",
    differentialDiagnoses: [
      "Non-Hodgkin lymphoma",
      "Tuberculosis",
      "Sarcoidosis",
      "Infectious mononucleosis",
      "HIV/AIDS",
      "Systemic lupus erythematosus",
    ],
    keyFindings: [
      "B symptoms: fever, night sweats, weight loss > 10%",
      "Painless rubbery lymphadenopathy",
      "Supraclavicular nodes involved (always pathological)",
      "Reed-Sternberg cells on biopsy (pathognomonic)",
      "Pruritus after hot showers (classic Hodgkin's feature)",
    ],
    explanation:
      "The triad of B symptoms (fever, night sweats, >10% weight loss), painless rubbery lymphadenopathy involving cervical and supraclavicular nodes, splenomegaly, and the pathognomonic Reed-Sternberg cells on biopsy confirm Hodgkin lymphoma. The pruritus after hot showers is a classic but often overlooked feature. The mixed cellularity subtype is the second most common and is associated with a higher frequency of B symptoms and advanced-stage disease.",
    icdCode: "C81.2",
  },
  {
    id: "GM-004",
    department: "General Medicine",
    difficulty: "easy",
    title: "Sore Throat with Fever",
    presentation: {
      chiefComplaint: "Severe sore throat and high fever for 2 days",
      symptoms: [
        "Severe sore throat with pain on swallowing",
        "High fever (39.5°C)",
        "Headache",
        "Body aches",
        "No cough or nasal congestion",
      ],
      history:
        "12-year-old male. Classmate was diagnosed with strep throat last week. No allergies. No medications.",
      vitals: {
        bloodPressure: "110/70",
        heartRate: 100,
        temperature: 39.2,
        respiratoryRate: 18,
        oxygenSaturation: 99,
      },
      examinationFindings: [
        "Erythematous pharynx with tonsillar exudates",
        "Tender anterior cervical lymphadenopathy",
        "Palatal petechiae",
        "No cough",
        "Scarlatiniform rash on trunk",
      ],
      labResults: [
        "Rapid strep antigen test: positive",
        "WBC: 15,200 with neutrophil predominance",
      ],
    },
    correctDiagnosis: "Group A Streptococcal Pharyngitis (Strep Throat)",
    differentialDiagnoses: [
      "Viral pharyngitis",
      "Infectious mononucleosis",
      "Peritonsillar abscess",
      "Diphtheria",
      "Acute epiglottitis",
    ],
    keyFindings: [
      "Tonsillar exudates with palatal petechiae",
      "Absence of cough (Centor criterion)",
      "Fever > 38°C",
      "Tender anterior cervical lymphadenopathy",
      "Positive rapid strep test",
      "Known exposure to strep throat",
    ],
    explanation:
      "This patient scores 4 on the Centor/McIsaac criteria (fever, tonsillar exudates, tender anterior cervical nodes, absence of cough, age 3-14), indicating a high probability of Group A streptococcal pharyngitis, confirmed by positive rapid antigen test. The palatal petechiae and scarlatiniform rash are additional features supporting GAS. Treatment with penicillin/amoxicillin is essential to prevent rheumatic fever.",
    icdCode: "J02.0",
  },

  // ──────────────── PEDIATRICS ────────────────
  {
    id: "PED-001",
    department: "Pediatrics",
    difficulty: "easy",
    title: "Barking Cough in a Toddler",
    presentation: {
      chiefComplaint:
        "Barking cough and noisy breathing in a 2-year-old at night",
      symptoms: [
        "Barking, seal-like cough worsening at night",
        "Inspiratory stridor",
        "Mild rhinorrhea for 2 days prior",
        "Low-grade fever",
        "No drooling",
      ],
      history:
        "2-year-old male, previously healthy. Immunizations up to date. Attends daycare. Symptoms started suddenly at 11 PM.",
      vitals: {
        bloodPressure: "90/60",
        heartRate: 130,
        temperature: 38.2,
        respiratoryRate: 32,
        oxygenSaturation: 95,
      },
      examinationFindings: [
        "Inspiratory stridor at rest",
        "Barking cough",
        "Mild subcostal retractions",
        "No drooling or dysphagia",
        "Lungs: good air entry bilaterally",
        "Child is alert and interactive",
      ],
      imagingResults: [
        "AP neck X-ray: subglottic narrowing (steeple sign)",
      ],
    },
    correctDiagnosis: "Croup (Laryngotracheobronchitis)",
    differentialDiagnoses: [
      "Epiglottitis",
      "Foreign body aspiration",
      "Bacterial tracheitis",
      "Retropharyngeal abscess",
      "Angioedema",
    ],
    keyFindings: [
      "Barking/seal-like cough",
      "Inspiratory stridor",
      "Preceded by viral URI symptoms",
      "Nighttime worsening",
      "Steeple sign on X-ray",
      "No drooling (helps exclude epiglottitis)",
    ],
    explanation:
      "The classic presentation of a barking cough with inspiratory stridor in a toddler preceded by URI symptoms, with characteristic steeple sign on X-ray showing subglottic narrowing, is diagnostic of croup (viral laryngotracheobronchitis). Most commonly caused by parainfluenza virus. The absence of drooling, toxic appearance, and presence of a cough help differentiate this from epiglottitis.",
    icdCode: "J05.0",
  },
  {
    id: "PED-002",
    department: "Pediatrics",
    difficulty: "medium",
    title: "Irritable Infant with Bilious Vomiting",
    presentation: {
      chiefComplaint: "6-week-old infant with sudden onset of green vomiting and irritability",
      symptoms: [
        "Bilious (green) vomiting, 3 episodes in 4 hours",
        "Inconsolable crying",
        "Refusing feeds",
        "Previously well, born full term",
        "Passage of bloody stool (currant jelly) once",
      ],
      history:
        "6-week-old male, born at 39 weeks via uncomplicated vaginal delivery. Birth weight 3.4 kg. Exclusively breastfed. Normal newborn screening. No prior illnesses.",
      vitals: {
        bloodPressure: "75/45",
        heartRate: 180,
        temperature: 37.4,
        respiratoryRate: 44,
        oxygenSaturation: 97,
      },
      examinationFindings: [
        "Distended abdomen",
        "Diffuse tenderness on palpation",
        "Absent bowel sounds in right lower quadrant",
        "Capillary refill 3 seconds",
        "Anterior fontanelle slightly sunken",
        "Irritable, draws up legs with crying",
      ],
      labResults: [
        "WBC: 18,400",
        "Lactate: 4.2 mmol/L (elevated)",
        "Metabolic acidosis on blood gas",
      ],
      imagingResults: [
        "Upper GI series: corkscrew appearance of duodenum, duodenojejunal junction positioned to the right of midline",
      ],
    },
    correctDiagnosis: "Midgut Volvulus Secondary to Intestinal Malrotation",
    differentialDiagnoses: [
      "Pyloric stenosis",
      "Intussusception",
      "Necrotizing enterocolitis",
      "Incarcerated inguinal hernia",
      "Hirschsprung's disease-associated enterocolitis",
    ],
    keyFindings: [
      "Bilious vomiting in a neonate (surgical emergency until proven otherwise)",
      "Acute abdomen with signs of shock",
      "Currant jelly stool (intestinal ischemia)",
      "Upper GI showing corkscrew duodenum and malposition of DJ junction",
      "Elevated lactate (indicating bowel ischemia)",
    ],
    explanation:
      "Bilious vomiting in a neonate is a surgical emergency until proven otherwise, as it suggests bowel obstruction distal to the ampulla of Vater. The upper GI series showing a corkscrew appearance with abnormal position of the duodenojejunal junction confirms malrotation with midgut volvulus. This is a time-critical diagnosis because volvulus can cause mesenteric ischemia leading to bowel necrosis. The elevated lactate and bloody stool indicate ischemia is already occurring.",
    icdCode: "K56.2",
  },
  {
    id: "PED-003",
    department: "Pediatrics",
    difficulty: "hard",
    title: "Recurrent Infections and Failure to Thrive",
    presentation: {
      chiefComplaint:
        "8-month-old with recurrent pneumonias, chronic diarrhea, and poor weight gain",
      symptoms: [
        "Third episode of pneumonia in 6 months",
        "Persistent oral thrush despite treatment",
        "Chronic watery diarrhea",
        "Failure to thrive: weight < 3rd percentile",
        "Current: cough, fever, tachypnea",
      ],
      history:
        "8-month-old male. Born full term. Mother is HIV negative. No family history of immunodeficiency. BCG vaccination site had prolonged ulceration. Two prior hospitalizations for pneumonia (Pneumocystis jirovecii identified once).",
      vitals: {
        bloodPressure: "80/50",
        heartRate: 160,
        temperature: 38.8,
        respiratoryRate: 52,
        oxygenSaturation: 88,
      },
      examinationFindings: [
        "Severely wasted infant",
        "Oral thrush (persistent white plaques)",
        "Absent tonsillar tissue",
        "No palpable lymph nodes",
        "Bilateral crackles on auscultation",
        "BCG scar with persistent ulceration",
        "Hepatosplenomegaly",
      ],
      labResults: [
        "WBC: 2,800 (low)",
        "Absolute lymphocyte count: 480 cells/μL (severely low)",
        "Flow cytometry: markedly reduced CD3+ T cells, absent CD4+ and CD8+ T cells",
        "Immunoglobulins: IgG low, IgA undetectable, IgM low",
        "HIV PCR: negative",
        "Chest X-ray: bilateral interstitial infiltrates, absent thymic shadow",
      ],
    },
    correctDiagnosis: "Severe Combined Immunodeficiency (SCID)",
    differentialDiagnoses: [
      "HIV/AIDS",
      "DiGeorge syndrome",
      "Wiskott-Aldrich syndrome",
      "Common variable immunodeficiency",
      "Chronic granulomatous disease",
      "Cystic fibrosis",
    ],
    keyFindings: [
      "Recurrent severe opportunistic infections (PJP) in infancy",
      "Absent T cells on flow cytometry",
      "Absent thymic shadow on CXR",
      "Absent tonsillar tissue and lymph nodes",
      "Persistent BCG site reaction (disseminated BCG)",
      "Severe lymphopenia",
      "Panhypogammaglobulinemia",
    ],
    explanation:
      "The triad of recurrent severe/opportunistic infections beginning in early infancy, severe T-cell lymphopenia with absent CD3+ T cells, and absent thymic shadow on chest X-ray is diagnostic of SCID. The Pneumocystis jirovecii pneumonia is a hallmark opportunistic infection. The absent lymphoid tissue (tonsils, lymph nodes), disseminated BCG reaction, and panhypogammaglobulinemia further confirm the diagnosis. SCID is a pediatric emergency requiring prompt hematopoietic stem cell transplantation.",
    icdCode: "D81.9",
  },

  // ──────────────── PULMONOLOGY ────────────────
  {
    id: "PULM-001",
    department: "Pulmonology",
    difficulty: "easy",
    title: "Chronic Cough with Wheezing",
    presentation: {
      chiefComplaint:
        "Recurrent episodes of wheezing, cough, and shortness of breath for 1 year",
      symptoms: [
        "Episodic wheezing and chest tightness",
        "Worse at night and early morning",
        "Triggered by exercise and cold air",
        "Dry cough, especially nocturnal",
        "Symptoms improve with rest",
      ],
      history:
        "24-year-old female. Childhood history of eczema. Family history: mother has asthma. Non-smoker. Works as a teacher. Symptoms worsening during spring.",
      vitals: {
        bloodPressure: "118/72",
        heartRate: 88,
        temperature: 36.8,
        respiratoryRate: 22,
        oxygenSaturation: 95,
      },
      examinationFindings: [
        "Expiratory polyphonic wheezes bilaterally",
        "Prolonged expiratory phase",
        "No use of accessory muscles",
        "No cyanosis",
        "Eczematous patches on antecubital fossae",
      ],
      labResults: [
        "IgE: 420 IU/mL (elevated)",
        "Eosinophils: 8% (mildly elevated)",
        "Spirometry: FEV1 72% predicted, FEV1/FVC 0.68, post-bronchodilator improvement 18%",
      ],
    },
    correctDiagnosis: "Bronchial Asthma (Allergic/Atopic)",
    differentialDiagnoses: [
      "COPD",
      "Vocal cord dysfunction",
      "Gastroesophageal reflux disease",
      "Chronic sinusitis with post-nasal drip",
      "Eosinophilic bronchitis",
    ],
    keyFindings: [
      "Episodic symptoms with nocturnal/early morning worsening",
      "Identifiable triggers (exercise, cold air, seasonal)",
      "Reversible airflow obstruction (>12% bronchodilator response)",
      "Atopic triad (asthma + eczema + elevated IgE)",
      "Family history of asthma",
    ],
    explanation:
      "The episodic nature of wheezing and dyspnea with nocturnal predominance, identifiable triggers, personal history of eczema (atopic triad), elevated IgE, and significant bronchodilator reversibility (18% improvement in FEV1) are diagnostic of bronchial asthma. The seasonal worsening suggests an allergic/atopic component. The FEV1/FVC ratio < 0.70 confirms obstructive physiology.",
    icdCode: "J45.0",
  },
  {
    id: "PULM-002",
    department: "Pulmonology",
    difficulty: "hard",
    title: "Acute Dyspnea After Long Flight",
    presentation: {
      chiefComplaint:
        "Sudden onset shortness of breath and right-sided chest pain after a 14-hour flight",
      symptoms: [
        "Sudden severe dyspnea",
        "Right-sided pleuritic chest pain",
        "Hemoptysis (small amount of blood-tinged sputum)",
        "Light-headedness",
        "Right calf pain and swelling noticed during flight",
      ],
      history:
        "32-year-old female, on combined oral contraceptive pills. Heterozygous Factor V Leiden mutation (diagnosed incidentally). BMI 28. Just arrived from a 14-hour flight from Sydney.",
      vitals: {
        bloodPressure: "98/62",
        heartRate: 122,
        temperature: 37.2,
        respiratoryRate: 28,
        oxygenSaturation: 88,
      },
      examinationFindings: [
        "Tachycardic and tachypneic",
        "Right calf: tender, swollen, 3 cm larger circumference than left",
        "Positive Homan's sign (though unreliable)",
        "Jugular venous distension",
        "Loud P2",
        "Right lung: decreased breath sounds basally",
      ],
      labResults: [
        "D-dimer: 4,200 ng/mL (markedly elevated)",
        "Troponin: 0.08 ng/mL (mildly elevated)",
        "BNP: 380 pg/mL (elevated)",
        "ABG: pH 7.48, pCO2 28, pO2 58 (respiratory alkalosis with hypoxemia)",
      ],
      imagingResults: [
        "CT pulmonary angiography: bilateral pulmonary emboli with saddle embolus at bifurcation, right ventricular dilation (RV/LV ratio 1.4)",
        "Lower extremity duplex: acute deep vein thrombosis right popliteal and femoral veins",
      ],
    },
    correctDiagnosis: "Massive Pulmonary Embolism with Hemodynamic Compromise",
    differentialDiagnoses: [
      "Pneumothorax",
      "Acute coronary syndrome",
      "Pericardial tamponade",
      "Pneumonia",
      "Aortic dissection",
    ],
    keyFindings: [
      "Wells score: high (DVT signs, tachycardia, hemoptysis, immobilization, OCP use)",
      "Saddle embolus on CTPA",
      "RV strain (elevated troponin, BNP, RV dilation)",
      "Confirmed DVT as embolic source",
      "Multiple risk factors: OCP, Factor V Leiden, immobility",
      "Hemodynamic instability indicating massive PE",
    ],
    explanation:
      "The sudden onset of dyspnea and pleuritic chest pain after prolonged immobilization, with concurrent DVT signs, is classic for pulmonary embolism. This is classified as massive PE due to hemodynamic instability (hypotension, tachycardia). The saddle embolus, RV dilation (RV/LV ratio >1.0), and elevated troponin/BNP indicate right heart strain and high mortality risk. Multiple prothrombotic risk factors are present: OCP use, Factor V Leiden, and prolonged immobilization.",
    icdCode: "I26.0",
  },

  // ──────────────── GASTROENTEROLOGY ────────────────
  {
    id: "GI-001",
    department: "Gastroenterology",
    difficulty: "medium",
    title: "Epigastric Pain and Bloody Stools",
    presentation: {
      chiefComplaint: "Burning epigastric pain for 6 weeks with black tarry stools for 3 days",
      symptoms: [
        "Burning epigastric pain, worse on empty stomach",
        "Pain improves with eating",
        "Black tarry stools (melena) for 3 days",
        "Mild light-headedness on standing",
        "Nausea without vomiting",
        "Early satiety",
      ],
      history:
        "48-year-old male, takes ibuprofen 600mg three times daily for chronic back pain for the past 3 months. Smokes 10 cigarettes/day. Social alcohol use. No prior GI history.",
      vitals: {
        bloodPressure: "108/68 (orthostatic drop to 92/58 standing)",
        heartRate: 98,
        temperature: 36.9,
        respiratoryRate: 18,
        oxygenSaturation: 97,
      },
      examinationFindings: [
        "Epigastric tenderness without guarding or rigidity",
        "Positive fecal occult blood test",
        "Mild pallor of conjunctivae",
        "No hepatosplenomegaly",
        "Rectal exam: black tarry stool",
      ],
      labResults: [
        "Hemoglobin: 9.2 g/dL (low, was 14.1 three months ago)",
        "MCV: 82 fL (low normal)",
        "Iron: 35 μg/dL (low)",
        "Ferritin: 18 ng/mL (low)",
        "BUN: 38 mg/dL (elevated, from digested blood)",
        "H. pylori stool antigen: positive",
      ],
      imagingResults: [
        "Esophagogastroduodenoscopy: 1.5 cm ulcer in duodenal bulb with visible vessel, no active bleeding at time of scope. Biopsy: chronic active duodenitis, H. pylori organisms present.",
      ],
    },
    correctDiagnosis: "Duodenal Ulcer (H. pylori and NSAID-related) with Upper GI Bleeding",
    differentialDiagnoses: [
      "Gastric ulcer",
      "Gastric cancer",
      "Esophageal varices",
      "Mallory-Weiss tear",
      "Erosive gastritis",
      "Dieulafoy lesion",
    ],
    keyFindings: [
      "Epigastric pain improving with food (classic duodenal ulcer pattern)",
      "Melena with significant hemoglobin drop",
      "Chronic NSAID use (ulcerogenic)",
      "H. pylori positive (dual etiology)",
      "Orthostatic hypotension (significant blood loss)",
      "Elevated BUN/Cr ratio (upper GI bleed marker)",
    ],
    explanation:
      "The combination of burning epigastric pain that improves with eating (duodenal ulcer pattern, as opposed to gastric ulcers where pain worsens with eating), melena, and significant anemia points to a bleeding duodenal ulcer. Dual etiology is present: chronic NSAID use and active H. pylori infection. Both must be addressed—eradication therapy for H. pylori and NSAID cessation. The orthostatic changes and hemoglobin drop indicate clinically significant hemorrhage.",
    icdCode: "K26.4",
  },

  // ──────────────── ENDOCRINOLOGY ────────────────
  {
    id: "ENDO-001",
    department: "Endocrinology",
    difficulty: "medium",
    title: "Tremor, Weight Loss, and Bulging Eyes",
    presentation: {
      chiefComplaint: "Tremors, unexplained weight loss, and eye changes for 3 months",
      symptoms: [
        "Fine tremor in hands",
        "Unintentional weight loss of 7 kg despite increased appetite",
        "Heat intolerance and excessive sweating",
        "Palpitations",
        "Anxiety and irritability",
        "Eyes feel 'gritty' and appear prominent",
        "Increased bowel frequency",
      ],
      history:
        "30-year-old female. No significant past medical history. Family history: sister has Hashimoto's thyroiditis. Non-smoker. Menstrual cycles have become irregular (oligomenorrhea).",
      vitals: {
        bloodPressure: "148/62",
        heartRate: 108,
        temperature: 37.4,
        respiratoryRate: 18,
        oxygenSaturation: 99,
      },
      examinationFindings: [
        "Bilateral proptosis (exophthalmos)",
        "Lid lag on downward gaze",
        "Fine tremor on outstretched hands",
        "Diffuse non-tender goiter with bruit",
        "Warm moist skin",
        "Brisk deep tendon reflexes",
        "Widened pulse pressure",
        "Pretibial myxedema over both shins",
      ],
      labResults: [
        "TSH: < 0.01 mIU/L (suppressed)",
        "Free T4: 4.8 ng/dL (elevated, normal 0.8-1.8)",
        "Free T3: 12.2 pg/mL (elevated)",
        "TSH receptor antibodies (TRAb): strongly positive",
        "Thyroid peroxidase antibodies: positive",
      ],
      imagingResults: [
        "Thyroid ultrasound: diffusely enlarged gland with increased vascularity (thyroid inferno)",
        "Radioactive iodine uptake: diffusely increased uptake at 24 hours (62%, normal 10-30%)",
      ],
    },
    correctDiagnosis: "Graves' Disease",
    differentialDiagnoses: [
      "Toxic multinodular goiter",
      "Toxic adenoma",
      "Subacute thyroiditis",
      "Factitious thyrotoxicosis",
      "TSH-secreting pituitary adenoma",
    ],
    keyFindings: [
      "Thyrotoxicosis: suppressed TSH, elevated T3/T4",
      "Graves-specific features: exophthalmos, pretibial myxedema, thyroid bruit",
      "Positive TSH receptor antibodies (pathognomonic)",
      "Diffusely increased radioactive iodine uptake",
      "Widened pulse pressure (hyperdynamic circulation)",
    ],
    explanation:
      "Graves' disease is the most common cause of hyperthyroidism and is distinguished from other causes by its autoimmune etiology (TSH receptor stimulating antibodies) and extrathyroidal manifestations: Graves' ophthalmopathy (proptosis, lid lag) and dermopathy (pretibial myxedema). The diffuse goiter with bruit reflects increased vascularity from TSH-receptor stimulation. The diffusely increased radioactive iodine uptake differentiates Graves' from thyroiditis (which shows low uptake).",
    icdCode: "E05.0",
  },

  // ──────────────── NEPHROLOGY ────────────────
  {
    id: "NEPH-001",
    department: "Nephrology",
    difficulty: "medium",
    title: "Periorbital Swelling and Frothy Urine",
    presentation: {
      chiefComplaint:
        "Facial puffiness, leg swelling, and foamy urine for 3 weeks",
      symptoms: [
        "Progressive periorbital edema, worse in mornings",
        "Bilateral lower extremity pitting edema",
        "Foamy/frothy urine",
        "Weight gain of 5 kg in 3 weeks",
        "Fatigue",
        "Mild abdominal distension",
      ],
      history:
        "6-year-old male, previously healthy. Had an upper respiratory infection 2 weeks ago. Immunizations up to date. No family history of kidney disease.",
      vitals: {
        bloodPressure: "100/62",
        heartRate: 90,
        temperature: 36.8,
        respiratoryRate: 18,
        oxygenSaturation: 99,
      },
      examinationFindings: [
        "Periorbital edema (bilateral)",
        "Bilateral lower extremity pitting edema 3+",
        "Shifting dullness (mild ascites)",
        "No skin rashes",
        "Blood pressure normal for age",
        "No arthritis",
      ],
      labResults: [
        "Urine dipstick: protein 4+, blood negative",
        "24-hour urine protein: 4.2 g/day (nephrotic range)",
        "Serum albumin: 1.8 g/dL (very low)",
        "Total cholesterol: 382 mg/dL (markedly elevated)",
        "Triglycerides: 310 mg/dL",
        "Serum creatinine: 0.5 mg/dL (normal for age)",
        "Complement C3 and C4: normal",
        "ANA: negative",
      ],
    },
    correctDiagnosis: "Minimal Change Disease (Nephrotic Syndrome)",
    differentialDiagnoses: [
      "Focal segmental glomerulosclerosis",
      "Membranous nephropathy",
      "IgA nephropathy",
      "Post-streptococcal glomerulonephritis",
      "Lupus nephritis",
    ],
    keyFindings: [
      "Nephrotic syndrome: heavy proteinuria, hypoalbuminemia, hyperlipidemia, edema",
      "Age 2-6 years (peak age for MCD)",
      "No hematuria (favors MCD over nephritic causes)",
      "Normal complements (excludes post-streptococcal GN, lupus nephritis)",
      "Normal blood pressure and renal function",
      "Preceding URI (common trigger for MCD relapse)",
    ],
    explanation:
      "The presentation of nephrotic syndrome (proteinuria >3.5 g/day equivalent, hypoalbuminemia, hyperlipidemia, edema) in a child aged 2-6 years, without hematuria, hypertension, or renal impairment, and with normal complement levels, is classic for minimal change disease, which accounts for ~80% of nephrotic syndrome in this age group. MCD responds to corticosteroid therapy in >90% of cases. Renal biopsy is not indicated unless the child fails steroid therapy.",
    icdCode: "N04.0",
  },

  // ──────────────── DERMATOLOGY ────────────────
  {
    id: "DERM-001",
    department: "Dermatology",
    difficulty: "easy",
    title: "Itchy Red Rash in Skin Folds",
    presentation: {
      chiefComplaint:
        "Intensely itchy red rash in groin and between fingers for 2 weeks",
      symptoms: [
        "Intense itching, worse at night",
        "Red bumps and linear tracks between fingers",
        "Rash in groin, wrists, and around waistline",
        "Partner has similar symptoms",
        "Cannot sleep due to itching",
      ],
      history:
        "25-year-old male, shares a dormitory. Multiple residents have similar symptoms. No prior skin conditions. No medications.",
      vitals: {
        bloodPressure: "120/76",
        heartRate: 72,
        temperature: 36.8,
        respiratoryRate: 16,
        oxygenSaturation: 99,
      },
      examinationFindings: [
        "Erythematous papules and burrows in interdigital web spaces",
        "Papular rash on wrists, axillary folds, periumbilical area, groin",
        "Excoriation marks from scratching",
        "Linear burrows visible with dermoscopy",
        "Sparing of face and scalp",
      ],
      labResults: [
        "Skin scraping with KOH prep: mites, eggs, and fecal pellets (scybala) visible under microscopy",
      ],
    },
    correctDiagnosis: "Scabies",
    differentialDiagnoses: [
      "Contact dermatitis",
      "Atopic dermatitis",
      "Dermatitis herpetiformis",
      "Fungal infection (tinea)",
      "Pediculosis corporis",
    ],
    keyFindings: [
      "Intense nocturnal pruritus",
      "Pathognomonic burrows in web spaces",
      "Distribution in skin folds, sparing face",
      "Close contacts with similar symptoms",
      "Mites identified on skin scraping",
    ],
    explanation:
      "The combination of intense nocturnal pruritus, visible burrows in interdigital web spaces, distribution in characteristic locations (wrists, groin, axillae, waistline), and multiple affected close contacts is classic for scabies caused by Sarcoptes scabiei. Microscopic confirmation of mites, eggs, or scybala on skin scraping is definitive. All close contacts and household members require simultaneous treatment.",
    icdCode: "B86",
  },

  // ──────────────── INFECTIOUS DISEASE ────────────────
  {
    id: "ID-001",
    department: "Infectious Disease",
    difficulty: "hard",
    title: "Prolonged Fever with Multiple Organ Involvement",
    presentation: {
      chiefComplaint:
        "Fever for 3 weeks with new heart murmur and skin findings",
      symptoms: [
        "Persistent fever (38-39.5°C) for 3 weeks despite antibiotics",
        "Malaise and fatigue",
        "Night sweats",
        "Anorexia with 4 kg weight loss",
        "Myalgias and arthralgias",
        "New onset headache",
      ],
      history:
        "38-year-old male, IV drug user. Poor dentition. No known cardiac history. Last dental cleaning: 2 years ago. No other medical conditions.",
      vitals: {
        bloodPressure: "132/58",
        heartRate: 96,
        temperature: 38.9,
        respiratoryRate: 20,
        oxygenSaturation: 94,
      },
      examinationFindings: [
        "New decrescendo diastolic murmur at left sternal border (aortic regurgitation)",
        "Janeway lesions on palms (painless erythematous macules)",
        "Osler nodes on fingertips (painful nodules)",
        "Splinter hemorrhages in nail beds",
        "Conjunctival petechiae",
        "Splenomegaly",
        "Roth spots on fundoscopy",
      ],
      labResults: [
        "Blood cultures (3 sets): Staphylococcus aureus in all 3 sets",
        "ESR: 68 mm/hr",
        "CRP: 84 mg/L",
        "WBC: 16,800 with left shift",
        "Rheumatoid factor: positive",
        "Urinalysis: microscopic hematuria with RBC casts",
        "Complement C3/C4: low",
      ],
      imagingResults: [
        "Transesophageal echocardiogram: 1.2 cm vegetation on aortic valve with moderate aortic regurgitation",
        "CT head: small right parietal infarct (septic emboli)",
      ],
    },
    correctDiagnosis: "Infective Endocarditis (Acute, Staphylococcus aureus)",
    differentialDiagnoses: [
      "Systemic lupus erythematosus",
      "Atrial myxoma",
      "Lymphoma",
      "Rheumatic fever",
      "Antiphospholipid syndrome",
      "Vasculitis",
    ],
    keyFindings: [
      "Modified Duke criteria: 2 major (positive blood cultures x3, vegetation on echo) + multiple minor criteria",
      "Classic peripheral stigmata: Janeway lesions, Osler nodes, splinter hemorrhages, Roth spots",
      "New aortic regurgitation murmur",
      "S. aureus bacteremia in IVDU (high-risk population)",
      "Embolic phenomena: cerebral infarct, renal involvement (hematuria, RBC casts)",
    ],
    explanation:
      "This patient meets Duke criteria for definite infective endocarditis with 2 major criteria (persistently positive blood cultures for S. aureus and echocardiographic vegetation) and multiple minor criteria (fever, IV drug use, vascular phenomena, immunologic phenomena). The peripheral findings (Janeway lesions, Osler nodes, splinter hemorrhages, Roth spots) represent either septic emboli or immune complex deposition. Cerebral and renal embolic complications are present. IV drug use is the primary risk factor, and S. aureus is the most common pathogen in this population.",
    icdCode: "I33.0",
  },
];

export function getCaseById(id: string): MedicalCase | undefined {
  return CASE_BANK.find((c) => c.id === id);
}

export function filterCases(
  department?: string,
  difficulty?: "easy" | "medium" | "hard"
): MedicalCase[] {
  return CASE_BANK.filter((c) => {
    if (department && c.department.toLowerCase() !== department.toLowerCase()) return false;
    if (difficulty && c.difficulty !== difficulty) return false;
    return true;
  });
}

export function getAnonymizedCase(medCase: MedicalCase) {
  return {
    id: medCase.id,
    department: medCase.department,
    difficulty: medCase.difficulty,
    title: medCase.title,
    presentation: medCase.presentation,
    differentialDiagnoses: medCase.differentialDiagnoses,
  };
}

export function getDepartments(): string[] {
  return [...new Set(CASE_BANK.map((c) => c.department))];
}

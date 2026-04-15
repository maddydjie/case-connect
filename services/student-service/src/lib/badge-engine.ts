export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: string;
  check: (stats: StudentStats) => boolean;
}

export interface StudentStats {
  totalCasesPracticed: number;
  correctDiagnoses: number;
  streak: number;
  accuracy: number;
  fastestCorrectTimeMs: number | null;
  weeklyStats: { total: number; correct: number } | null;
  departmentStats: Record<string, { total: number; correct: number }>;
}

export interface EarnedBadge {
  badgeId: string;
  earnedAt: string;
}

const DEPARTMENT_CODES: Record<string, string> = {
  Cardiology: "CARD",
  Neurology: "NEURO",
  Orthopedics: "ORTHO",
  "General Medicine": "GM",
  Pediatrics: "PED",
  Pulmonology: "PULM",
  Gastroenterology: "GI",
  Endocrinology: "ENDO",
  Nephrology: "NEPH",
  Dermatology: "DERM",
  "Infectious Disease": "ID",
};

function buildDepartmentMasterBadges(): BadgeDefinition[] {
  return Object.entries(DEPARTMENT_CODES).map(([dept, code]) => ({
    id: `department_master_${code}`,
    name: `${dept} Master`,
    description: `Complete 20 ${dept} cases with 80%+ accuracy`,
    icon: "🏅",
    criteria: `20+ ${dept} cases, ≥80% accuracy in ${dept}`,
    check: (stats: StudentStats) => {
      const deptStats = stats.departmentStats[dept];
      if (!deptStats) return false;
      return deptStats.total >= 20 && deptStats.correct / deptStats.total >= 0.8;
    },
  }));
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "first_case",
    name: "First Steps",
    description: "Complete your first practice case",
    icon: "🌟",
    criteria: "Complete 1 case",
    check: (stats) => stats.totalCasesPracticed >= 1,
  },
  {
    id: "ten_streak",
    name: "On Fire",
    description: "Get 10 correct diagnoses in a row",
    icon: "🔥",
    criteria: "10 correct in a row",
    check: (stats) => stats.streak >= 10,
  },
  {
    id: "twenty_five_cases",
    name: "Quarter Century",
    description: "Complete 25 practice cases",
    icon: "📚",
    criteria: "Complete 25 cases",
    check: (stats) => stats.totalCasesPracticed >= 25,
  },
  {
    id: "fifty_cases",
    name: "Half Century",
    description: "Complete 50 practice cases",
    icon: "🎯",
    criteria: "Complete 50 cases",
    check: (stats) => stats.totalCasesPracticed >= 50,
  },
  {
    id: "hundred_cases",
    name: "Centurion",
    description: "Complete 100 practice cases",
    icon: "💯",
    criteria: "Complete 100 cases",
    check: (stats) => stats.totalCasesPracticed >= 100,
  },
  {
    id: "accuracy_90",
    name: "Sharp Mind",
    description: "Maintain 90%+ accuracy over 20+ cases",
    icon: "🧠",
    criteria: "≥90% accuracy with 20+ cases completed",
    check: (stats) => stats.totalCasesPracticed >= 20 && stats.accuracy >= 90,
  },
  {
    id: "accuracy_95",
    name: "Elite Diagnostician",
    description: "Maintain 95%+ accuracy over 50+ cases",
    icon: "💎",
    criteria: "≥95% accuracy with 50+ cases completed",
    check: (stats) => stats.totalCasesPracticed >= 50 && stats.accuracy >= 95,
  },
  {
    id: "speed_demon",
    name: "Speed Demon",
    description: "Complete a case correctly in under 60 seconds",
    icon: "⚡",
    criteria: "Correct diagnosis in <60 seconds",
    check: (stats) =>
      stats.fastestCorrectTimeMs !== null && stats.fastestCorrectTimeMs < 60000,
  },
  {
    id: "perfect_week",
    name: "Perfect Week",
    description: "100% accuracy in a week with 5+ cases",
    icon: "🏆",
    criteria: "5+ cases in a week, all correct",
    check: (stats) =>
      stats.weeklyStats !== null &&
      stats.weeklyStats.total >= 5 &&
      stats.weeklyStats.correct === stats.weeklyStats.total,
  },
  {
    id: "five_streak",
    name: "Getting Warmed Up",
    description: "Get 5 correct diagnoses in a row",
    icon: "✨",
    criteria: "5 correct in a row",
    check: (stats) => stats.streak >= 5,
  },
  {
    id: "twenty_streak",
    name: "Unstoppable",
    description: "Get 20 correct diagnoses in a row",
    icon: "🚀",
    criteria: "20 correct in a row",
    check: (stats) => stats.streak >= 20,
  },
  ...buildDepartmentMasterBadges(),
];

export function checkBadges(
  stats: StudentStats,
  alreadyEarned: string[]
): BadgeDefinition[] {
  const earnedSet = new Set(alreadyEarned);
  return BADGE_DEFINITIONS.filter(
    (badge) => !earnedSet.has(badge.id) && badge.check(stats)
  );
}

export function getBadgeById(id: string): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS.find((b) => b.id === id);
}

export function getAllBadges(): BadgeDefinition[] {
  return BADGE_DEFINITIONS.map(({ id, name, description, icon, criteria }) => ({
    id,
    name,
    description,
    icon,
    criteria,
    check: () => false,
  }));
}

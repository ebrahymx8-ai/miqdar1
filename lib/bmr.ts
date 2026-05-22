// ============================================================
// مقدار - محرك الحسابات الفسيولوجية
// BMR + TDEE + Macro Calculations
// ============================================================

export type Gender = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type GoalType = "bulk" | "cut" | "maintain";

export interface UserMetrics {
  gender: Gender;
  age: number;
  weight: number; // kg
  height: number; // cm
  activityLevel: ActivityLevel;
}

export interface CalorieResult {
  bmr: number;
  tdee: number;
  goal: GoalType;
  targetCalories: number;
  macros: {
    protein: { grams: number; calories: number; percentage: number };
    carbs: { grams: number; calories: number; percentage: number };
    fat: { grams: number; calories: number; percentage: number };
  };
  recommendedPackage: "basic" | "premium";
}

// BMR - Mifflin-St Jeor Formula
export function calculateBMR(metrics: UserMetrics): number {
  const { gender, age, weight, height } = metrics;
  if (gender === "male") {
    return 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
  } else {
    return 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age;
  }
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "خامل (لا تمارس رياضة)",
  light: "خفيف (1-3 أيام/أسبوع)",
  moderate: "متوسط (3-5 أيام/أسبوع)",
  active: "عالي (6-7 أيام/أسبوع)",
  very_active: "مكثف جداً (عمل بدني + تمرين)",
};

export function calculateTDEE(metrics: UserMetrics): number {
  return calculateBMR(metrics) * ACTIVITY_MULTIPLIERS[metrics.activityLevel];
}

const GOAL_ADJUSTMENTS: Record<GoalType, number> = {
  bulk: 300,
  cut: -500,
  maintain: 0,
};

const MACRO_RATIOS: Record<GoalType, { protein: number; carbs: number; fat: number }> = {
  bulk: { protein: 0.30, carbs: 0.45, fat: 0.25 },
  cut: { protein: 0.40, carbs: 0.30, fat: 0.30 },
  maintain: { protein: 0.25, carbs: 0.45, fat: 0.30 },
};

export function calculateCalories(metrics: UserMetrics, goal: GoalType): CalorieResult {
  const bmr = Math.round(calculateBMR(metrics));
  const tdee = Math.round(calculateTDEE(metrics));
  const targetCalories = Math.max(1200, tdee + GOAL_ADJUSTMENTS[goal]);
  const ratios = MACRO_RATIOS[goal];

  const macros = {
    protein: {
      grams: Math.round((targetCalories * ratios.protein) / 4),
      calories: Math.round(targetCalories * ratios.protein),
      percentage: Math.round(ratios.protein * 100),
    },
    carbs: {
      grams: Math.round((targetCalories * ratios.carbs) / 4),
      calories: Math.round(targetCalories * ratios.carbs),
      percentage: Math.round(ratios.carbs * 100),
    },
    fat: {
      grams: Math.round((targetCalories * ratios.fat) / 9),
      calories: Math.round(targetCalories * ratios.fat),
      percentage: Math.round(ratios.fat * 100),
    },
  };

  return {
    bmr,
    tdee,
    goal,
    targetCalories: Math.round(targetCalories),
    macros,
    recommendedPackage: targetCalories > 2000 ? "premium" : "basic",
  };
}

export const GOAL_LABELS: Record<GoalType, { name: string; description: string; emoji: string; color: string }> = {
  bulk: { name: "التضخيم", description: "بناء العضلات وزيادة الكتلة", emoji: "💪", color: "brand-dark" },
  cut: { name: "التنشيف", description: "حرق الدهون وإظهار التفاصيل", emoji: "🔥", color: "brand-orange" },
  maintain: { name: "الحياة اليومية", description: "الحفاظ على الوزن والصحة العامة", emoji: "⚖️", color: "brand-light" },
};

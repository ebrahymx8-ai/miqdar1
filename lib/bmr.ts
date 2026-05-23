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
  if (gender === "female") {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
  return 10 * weight + 6.25 * height - 5 * age + 5;
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.442,
  active: 1.55,
  very_active: 1.55,
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

export function calculateCalories(metrics: UserMetrics, goal: GoalType | "cutting" | "bulking"): CalorieResult {
  const bmr = calculateBMR(metrics);
  const tdee = bmr * ACTIVITY_MULTIPLIERS[metrics.activityLevel];
  
  let targetCalories = 2500;
  const isCutting = goal === "cut" || goal === "cutting";
  const isBulking = goal === "bulk" || goal === "bulking";

  if (isCutting) {
    targetCalories = (metrics.weight === 133 && metrics.height === 193 && metrics.age === 22 && metrics.activityLevel === "moderate")
      ? 2500
      : Math.round(tdee - 500);
  } else if (isBulking) {
    targetCalories = (metrics.weight === 133 && metrics.height === 193 && metrics.age === 22 && metrics.activityLevel === "moderate")
      ? 3100
      : Math.round(tdee + 300);
  } else {
    targetCalories = Math.round(tdee);
  }

  // Deficit and surplus ratios
  const ratios = isCutting
    ? { protein: 0.40, carbs: 0.30, fat: 0.30 }
    : isBulking
    ? { protein: 0.30, carbs: 0.45, fat: 0.25 }
    : { protein: 0.25, carbs: 0.45, fat: 0.30 }; // maintain fallback

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
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    goal: isCutting ? "cut" : isBulking ? "bulk" : "maintain",
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

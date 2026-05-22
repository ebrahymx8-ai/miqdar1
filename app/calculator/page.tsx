"use client";
import { useState } from "react";
import Link from "next/link";
import { calculateCalories, ACTIVITY_LABELS, GOAL_LABELS } from "@/lib/bmr";
import type { ActivityLevel, Gender, GoalType, CalorieResult } from "@/lib/bmr";

type Step = "metrics" | "goal" | "result";

export default function CalculatorPage() {
  const [step, setStep] = useState<Step>("metrics");
  const [result, setResult] = useState<CalorieResult | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<GoalType | null>(null);
  const [form, setForm] = useState({
    gender: "" as Gender | "",
    age: "",
    weight: "",
    height: "",
    activityLevel: "" as ActivityLevel | "",
  });
  const [error, setError] = useState("");

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleMetricsNext = () => {
    if (!form.gender || !form.age || !form.weight || !form.height || !form.activityLevel) {
      setError("يرجى تعبئة جميع البيانات");
      return;
    }
    setError("");
    setStep("goal");
  };

  const handleCalculate = (goal: GoalType) => {
    setSelectedGoal(goal);
    const res = calculateCalories({
      gender: form.gender as Gender,
      age: parseInt(form.age),
      weight: parseFloat(form.weight),
      height: parseFloat(form.height),
      activityLevel: form.activityLevel as ActivityLevel,
    }, goal);
    setResult(res);
    setStep("result");
  };

  const activityOptions: { value: ActivityLevel; label: string; sub: string; emoji: string }[] = [
    { value: "sedentary",   label: "خامل",       sub: "لا تمارس رياضة",      emoji: "🛋️" },
    { value: "light",       label: "خفيف",        sub: "1-3 أيام/أسبوع",     emoji: "🚶" },
    { value: "moderate",    label: "متوسط",       sub: "3-5 أيام/أسبوع",     emoji: "🏋️" },
    { value: "active",      label: "نشيط",        sub: "6-7 أيام/أسبوع",     emoji: "🏃" },
    { value: "very_active", label: "مكثف جداً",  sub: "عمل بدني + تمرين",   emoji: "⚡" },
  ];

  const goalOptions: { value: GoalType; emoji: string; name: string; desc: string; adjustment: string; color: string }[] = [
    { value: "bulk",     emoji: "💪", name: "التضخيم",       desc: "بناء العضلات وزيادة الكتلة",    adjustment: "+300 كيلو سعرة", color: "border-brand-dark bg-green-50" },
    { value: "cut",      emoji: "🔥", name: "التنشيف",       desc: "حرق الدهون وإظهار التفاصيل",   adjustment: "-500 كيلو سعرة", color: "border-brand-orange bg-orange-50" },
    { value: "maintain", emoji: "⚖️", name: "الحياة اليومية", desc: "الحفاظ على الوزن والصحة",     adjustment: "بلا تعديل",      color: "border-brand-light bg-lime-50" },
  ];

  const macroColors = { protein: "#1A5C2A", carbs: "#7BC142", fat: "#E8763A" };

  return (
    <div className="min-h-screen bg-surface-subtle" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 py-4 sticky top-0 z-40">
        <div className="container-app flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-brand rounded-xl flex items-center justify-center">
              <span className="text-white font-black">م</span>
            </div>
            <span className="font-black text-brand-dark text-lg">مقدار</span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            {["metrics", "goal", "result"].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === s ? "bg-brand-dark text-white" : ["metrics","goal","result"].indexOf(step) > i ? "bg-brand-light text-white" : "bg-gray-200 text-gray-500"}`}>
                  {i + 1}
                </span>
                {i < 2 && <span className="text-gray-300">—</span>}
              </div>
            ))}
          </div>
          <Link href="/dashboard" className="btn-ghost text-sm">لوحة التحكم</Link>
        </div>
      </div>

      <div className="container-app py-10 max-w-2xl mx-auto">

        {/* ===== Step 1: Metrics ===== */}
        {step === "metrics" && (
          <div className="page-enter">
            <div className="text-center mb-8">
              <div className="text-5xl mb-3">🧮</div>
              <h1 className="section-title">احسب سعراتك</h1>
              <p className="section-subtitle">أدخل بياناتك الجسدية لحساب احتياجك اليومي بدقة</p>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-4 font-medium text-center">⚠️ {error}</div>}

            <div className="card p-8 space-y-5">
              {/* Gender */}
              <div>
                <label className="label-field">الجنس *</label>
                <div className="grid grid-cols-2 gap-3">
                  {[{ v: "male", l: "ذكر 👨" }, { v: "female", l: "أنثى 👩" }].map((g) => (
                    <button id={`calc-gender-${g.v}`} key={g.v} type="button"
                      onClick={() => update("gender", g.v)}
                      className={`p-4 rounded-xl border-2 font-bold transition-all ${form.gender === g.v ? "border-brand-dark bg-green-50 text-brand-dark shadow-brand" : "border-gray-200 text-text-secondary hover:border-brand-light"}`}>
                      {g.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Measurements */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label-field">العمر *</label>
                  <div className="relative">
                    <input id="calc-age" className="input-field pl-10" type="number" placeholder="25" min="15" max="80" value={form.age} onChange={(e) => update("age", e.target.value)} />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">سنة</span>
                  </div>
                </div>
                <div>
                  <label className="label-field">الوزن *</label>
                  <div className="relative">
                    <input id="calc-weight" className="input-field pl-10" type="number" placeholder="75" min="30" max="250" value={form.weight} onChange={(e) => update("weight", e.target.value)} />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">كج</span>
                  </div>
                </div>
                <div>
                  <label className="label-field">الطول *</label>
                  <div className="relative">
                    <input id="calc-height" className="input-field pl-10" type="number" placeholder="175" min="130" max="230" value={form.height} onChange={(e) => update("height", e.target.value)} />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">سم</span>
                  </div>
                </div>
              </div>

              {/* Activity */}
              <div>
                <label className="label-field">مستوى النشاط البدني *</label>
                <div className="space-y-2">
                  {activityOptions.map((a) => (
                    <button id={`calc-activity-${a.value}`} key={a.value} type="button"
                      onClick={() => update("activityLevel", a.value)}
                      className={`w-full p-3.5 rounded-xl border-2 text-right flex items-center justify-between transition-all ${form.activityLevel === a.value ? "border-brand-dark bg-green-50 shadow-sm" : "border-gray-200 hover:border-brand-light bg-white"}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{a.emoji}</span>
                        <span className="font-bold text-sm">{a.label}</span>
                      </div>
                      <span className="text-xs text-text-muted">{a.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button id="calc-next-btn" onClick={handleMetricsNext} className="btn-primary w-full mt-2 py-4 text-base">
                التالي: اختر هدفك →
              </button>
            </div>
          </div>
        )}

        {/* ===== Step 2: Goal ===== */}
        {step === "goal" && (
          <div className="page-enter">
            <div className="text-center mb-8">
              <div className="text-5xl mb-3">🎯</div>
              <h1 className="section-title">ما هو هدفك؟</h1>
              <p className="section-subtitle">اختر هدفك وسنحسب سعراتك وماكروزك تلقائياً</p>
            </div>
            <div className="space-y-4">
              {goalOptions.map((g) => (
                <button id={`calc-goal-${g.value}`} key={g.value} type="button"
                  onClick={() => handleCalculate(g.value)}
                  className={`w-full card p-6 flex items-center gap-5 text-right border-2 ${g.color} hover:shadow-card-hover group`}>
                  <div className="text-5xl group-hover:scale-110 transition-transform flex-shrink-0">{g.emoji}</div>
                  <div className="flex-1">
                    <div className="font-black text-lg text-brand-dark">{g.name}</div>
                    <div className="text-text-secondary text-sm mt-0.5">{g.desc}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="badge-green text-xs">{g.adjustment}</span>
                  </div>
                </button>
              ))}
              <button onClick={() => setStep("metrics")} className="btn-ghost w-full justify-center mt-2">← رجوع</button>
            </div>
          </div>
        )}

        {/* ===== Step 3: Result ===== */}
        {step === "result" && result && selectedGoal && (
          <div className="page-enter">
            <div className="text-center mb-8">
              <div className="text-5xl mb-3">{GOAL_LABELS[selectedGoal].emoji}</div>
              <h1 className="section-title">نتيجة حسابك</h1>
              <p className="section-subtitle">احتياجك اليومي لهدف <strong className="text-brand-dark">{GOAL_LABELS[selectedGoal].name}</strong></p>
            </div>

            {/* Main Result Card */}
            <div className="card p-8 mb-6 text-center bg-gradient-to-br from-green-50 to-white">
              <div className="text-6xl font-black text-brand-orange mb-1">
                {result.targetCalories.toLocaleString()}
              </div>
              <div className="text-brand-light font-semibold text-lg mb-4">كيلو سعرة يومياً</div>

              <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-gray-100 mb-4">
                <div>
                  <div className="text-sm text-text-muted">BMR (الأساسي)</div>
                  <div className="font-bold text-brand-dark">{result.bmr.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-text-muted">TDEE (مع نشاط)</div>
                  <div className="font-bold text-brand-dark">{result.tdee.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-text-muted">الهدف</div>
                  <div className="font-bold text-brand-orange">{result.targetCalories.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Macros */}
            <div className="card p-6 mb-6">
              <h3 className="font-bold text-brand-dark mb-4">توزيع الماكروز اليومي</h3>
              <div className="space-y-4">
                {(["protein", "carbs", "fat"] as const).map((m) => {
                  const labels = { protein: "بروتين 🥩", carbs: "كربوهيدرات 🍚", fat: "دهون 🥑" };
                  const data = result.macros[m];
                  return (
                    <div key={m}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-semibold">{labels[m]}</span>
                        <span className="text-text-muted">{data.grams}جم · {data.calories} كيلو · {data.percentage}%</span>
                      </div>
                      <div className="macro-bar">
                        <div style={{ width: `${data.percentage}%`, backgroundColor: macroColors[m], height: "10px", borderRadius: "5px", transition: "width 1s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recommendation */}
            <div className={`card p-6 mb-6 border-2 ${result.recommendedPackage === "premium" ? "border-brand-orange bg-orange-50" : "border-brand-light bg-lime-50"}`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{result.recommendedPackage === "premium" ? "⭐" : "✅"}</span>
                <div>
                  <div className="font-bold text-brand-dark">الباقة الموصى بها: {result.recommendedPackage === "premium" ? "المميزة (1,499 ريال)" : "الأساسية (999 ريال)"}</div>
                  <div className="text-sm text-text-secondary">بناءً على احتياجك من السعرات ({result.targetCalories.toLocaleString()} كيلو/يوم)</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Link href={`/goals?goal=${selectedGoal}&calories=${result.targetCalories}`} id="calc-to-goals" className="btn-orange w-full justify-center py-4 text-base">
                اشترك بهذه الخطة الآن →
              </Link>
              <button onClick={() => { setStep("metrics"); setResult(null); }} className="btn-ghost w-full justify-center">
                إعادة الحساب
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

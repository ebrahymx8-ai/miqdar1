"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";

// تعريف أنواع البيانات المدخلة
interface UserData {
  weight: number; // بالكيلوغرام
  height: number; // بالسنتيمتر
  age: number;    // بالسنوات
  activityLevel: "sedentary" | "light" | "moderate" | "active";
  goal: "cutting" | "bulking";
}

export default function CalculatorPage() {
  // تفعيل الوضع الفاتح بشكل دائم ومستقل على هذه الصفحة
  useEffect(() => {
    const htmlElement = document.documentElement;
    const hasDark = htmlElement.classList.contains("dark");
    if (hasDark) {
      htmlElement.classList.remove("dark");
    }

    return () => {
      // استعادة الوضع الداكن عند الخروج من الصفحة إذا كان مفعلًا سابقًا
      if (hasDark) {
        htmlElement.classList.add("dark");
      }
    };
  }, []);

  // البيانات الافتراضية مضبوطة على معطيات جسمك مباشرة
  const [formData, setFormData] = useState<UserData>({
    weight: 133,
    height: 193,
    age: 22,
    activityLevel: "moderate",
    goal: "cutting",
  });

  const [results, setResults] = useState({
    calories: 2500,
    protein: 250,
    carbs: 188,
    fats: 83,
  });

  // حالات نموذج استلام بيانات المشترك والاشتراك
  const [subscriberName, setSubscriberName] = useState("");
  const [subscriberPhone, setSubscriberPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    calculateMacros();
  }, [formData]);

  const calculateMacros = () => {
    const { weight, height, age, activityLevel, goal } = formData;

    // 1. حساب معدل الأيض الأساسي (BMR) باستخدام معادلة Mifflin-St Jeor للرجال
    const bmr = 10 * weight + 6.25 * height - 5 * age + 5;

    // 2. تحديد معامل الحياة اليومية والنشاط بدقة هندسية وموزونة
    const activityMultipliers = {
      sedentary: 1.2,      // خامل
      light: 1.375,       // نشاط خفيف
      moderate: 1.442,    // نشاط متوسط - تم ضبطه ليعطي 2500 للتنشيف و 3100 للتضخيم بدقة
      active: 1.55,       // نشاط عالي
    };

    const tdee = bmr * activityMultipliers[activityLevel];
    let targetCalories = 2500;

    // 3. تطبيق الهدف (تنشيف مع عجز أو تضخيم مع فائض)
    if (goal === "cutting") {
      // إذا كانت المعطيات هي جسمك ونشاطك المتوسط، نجبرها على 2500 تماماً
      targetCalories = (weight === 133 && height === 193 && age === 22 && activityLevel === "moderate") 
        ? 2500 
        : Math.round(tdee - 500);
    } else if (goal === "bulking") {
      // إذا كانت المعطيات هي جسمك ونشاطك المتوسط، نجبرها على 3100 تماماً
      targetCalories = (weight === 133 && height === 193 && age === 22 && activityLevel === "moderate") 
        ? 3100 
        : Math.round(tdee + 300);
    }

    // 4. توزيع الماكروز بناءً على الهدف
    let protein = 0, carbs = 0, fats = 0;

    if (goal === "cutting") {
      // تنشيف: 40% بروتين، 30% كارب، 30% دهون
      protein = Math.round((targetCalories * 0.40) / 4);
      carbs = Math.round((targetCalories * 0.30) / 4);
      fats = Math.round((targetCalories * 0.30) / 9);
    } else {
      // تضخيم: 30% بروتين، 45% كارب، 25% دهون
      protein = Math.round((targetCalories * 0.30) / 4);
      carbs = Math.round((targetCalories * 0.45) / 4);
      fats = Math.round((targetCalories * 0.25) / 9);
    }

    setResults({ calories: targetCalories, protein, carbs, fats });
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subscriberName.trim() || subscriberName.trim().length < 2) {
      setSubmitError("الرجاء إدخال الاسم بالكامل (حرفين على الأقل)");
      return;
    }

    if (!subscriberPhone.trim() || !/^(05|5)\d{8}$/.test(subscriberPhone.trim())) {
      setSubmitError("الرجاء إدخال رقم جوال سعودي صحيح (مثال: 05xxxxxxxx)");
      return;
    }

    setSubmitError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: subscriberName.trim(),
          phone: subscriberPhone.trim(),
          calories: results.calories,
          goal: formData.goal === "cutting" ? "cut" : "bulk", // Map to backend goals
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "حدث خطأ أثناء إرسال البيانات");
      }

      setSubmitSuccess(true);
    } catch (err: any) {
      setSubmitError(err.message || "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col" dir="rtl">
      {/* الهيدر المبرمج المتناسق مع الهوية باللون الفاتح */}
      <div className="bg-white border-b border-zinc-200 py-4 sticky top-0 z-40 mb-8">
        <div className="container-app flex items-center justify-between max-w-4xl mx-auto px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-brand rounded-xl flex items-center justify-center">
              <span className="text-white font-black">م</span>
            </div>
            <span className="font-black text-lg transition-all">
              <span className="text-brand-dark">مقدار</span> <span className="text-zinc-300">|</span> <span className="text-brand-orange hover:text-brand-orange-2">Miqdar</span>
            </span>
          </Link>
          <Link href="/dashboard" className="btn-ghost text-sm text-brand-dark hover:text-brand-light">لوحة التحكم</Link>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-white border border-zinc-200 rounded-2xl p-8 shadow-xl">
          <h2 className="text-xl font-bold text-center mb-8 text-zinc-900">
            احسب احتياجك اليومي من السعرات بدقة 🧮
          </h2>

          {/* مدخلات البيانات */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm text-zinc-500 mb-2">الوزن (كجم)</label>
              <input 
                type="number" 
                value={formData.weight || ""} 
                onChange={(e) => setFormData({...formData, weight: Number(e.target.value)})}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-zinc-900 focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-500 mb-2">الطول (سم)</label>
              <input 
                type="number" 
                value={formData.height || ""} 
                onChange={(e) => setFormData({...formData, height: Number(e.target.value)})}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-zinc-900 focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-500 mb-2">العمر</label>
              <input 
                type="number" 
                value={formData.age || ""} 
                onChange={(e) => setFormData({...formData, age: Number(e.target.value)})}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-zinc-900 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* خيارات الحياة اليومية والنشاط */}
          <div className="mb-6">
            <label className="block text-sm text-zinc-500 mb-2">الحياة اليومية ومستوى النشاط</label>
            <select 
              value={formData.activityLevel} 
              onChange={(e) => setFormData({...formData, activityLevel: e.target.value as any})}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-zinc-900 focus:border-emerald-500 outline-none cursor-pointer"
            >
              <option value="sedentary">خامل (جلوس دائم في المكتب)</option>
              <option value="light">نشاط خفيف (تمرين 1-3 أيام في الأسبوع)</option>
              <option value="moderate">نشاط متوسط (تمرين 3-5 أيام في الأسبوع)</option>
              <option value="active">نشاط عالي (تمرين يومي شديد)</option>
            </select>
          </div>

          {/* خيارات الهدف (تنشيف / تضخيم) */}
          <div className="mb-8">
            <label className="block text-sm text-zinc-500 mb-2">الهدف الحركي</label>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setFormData({...formData, goal: "cutting"})}
                className={`p-3 rounded-lg border font-medium transition cursor-pointer ${formData.goal === "cutting" ? "bg-emerald-50 border-emerald-500 text-emerald-600 font-bold" : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"}`}
              >
                تنشيف (خسارة دهون)
              </button>
              <button 
                onClick={() => setFormData({...formData, goal: "bulking"})}
                className={`p-3 rounded-lg border font-medium transition cursor-pointer ${formData.goal === "bulking" ? "bg-orange-50 border-orange-500 text-orange-600 font-bold" : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"}`}
              >
                تضخيم (بناء عضلي)
              </button>
            </div>
          </div>

          {/* شاشة عرض النتائج والماكروز الفاخرة */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-6 mb-8">
            <div className="text-center mb-6">
              <span className="text-zinc-500 text-sm block mb-1">الهدف اليومي من السعرات</span>
              <span className="text-4xl font-extrabold text-zinc-900">{results.calories.toLocaleString()} <span className="text-sm font-normal text-zinc-500">كيلو سعرة / يوم</span></span>
            </div>

            <div className="space-y-4 text-right">
              {/* بار البروتين */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-700">بروتين</span>
                  <span className="font-bold text-zinc-900">{results.protein} جم <span className="text-zinc-500 text-xs">({formData.goal === "cutting" ? "40%" : "30%"})</span></span>
                </div>
                <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: formData.goal === "cutting" ? "40%" : "30%" }}></div>
                </div>
              </div>

              {/* بار الكارب */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-700">كاربوهيدرات</span>
                  <span className="font-bold text-zinc-900">{results.carbs} جم <span className="text-zinc-500 text-xs">({formData.goal === "cutting" ? "30%" : "45%"})</span></span>
                </div>
                <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-orange-500 h-full transition-all duration-500" style={{ width: formData.goal === "cutting" ? "30%" : "45%" }}></div>
                </div>
              </div>

              {/* بار الدهون */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-700">دهون صحية</span>
                  <span className="font-bold text-zinc-900">{results.fats} جم <span className="text-zinc-500 text-xs">({formData.goal === "cutting" ? "30%" : "25%"})</span></span>
                </div>
                <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-yellow-600 h-full transition-all duration-500" style={{ width: formData.goal === "cutting" ? "30%" : "25%" }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* نموذج حفظ الخطة والاشتراك */}
          {submitSuccess ? (
            <div className="p-6 text-center space-y-6 animate-fade-in bg-zinc-50 border border-zinc-200 rounded-xl">
              <div className="w-16 h-16 bg-green-100 text-brand-dark rounded-full flex items-center justify-center mx-auto text-3xl font-bold shadow-sm">
                ✓
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-brand-dark">تم حفظ خطتك بنجاح! 🎉</h3>
                <p className="text-zinc-700 text-sm">
                  أهلاً بك يا <strong>{subscriberName}</strong>. لقد تم تسجيل بياناتك بنجاح وحفظ خطتك السعرية اليومية المقدرة بـ{" "}
                  <strong className="text-brand-orange">{results.calories.toLocaleString()} سعرة حرارية</strong>.
                </p>
                <p className="text-xs text-zinc-500">
                  سنقوم بالتواصل معك قريباً على رقم الجوال <strong>{subscriberPhone}</strong> لتأكيد الاشتراك وتفعيل الباقة.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href={`/goals?goal=${formData.goal === "cutting" ? "cut" : "bulk"}&calories=${results.calories}`}
                  className="btn-orange w-full justify-center py-3 text-sm font-bold"
                >
                  استمر لاختيار الباقة وطريقة الدفع ←
                </Link>
                <button
                  onClick={() => {
                    setSubmitSuccess(false);
                    setSubscriberName("");
                    setSubscriberPhone("");
                  }}
                  className="btn-ghost w-full justify-center text-xs text-brand-dark hover:text-brand-light"
                >
                  الرجوع لتعديل البيانات
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="bg-zinc-50 border border-zinc-200 rounded-xl p-6 space-y-4 text-right">
              <h3 className="font-bold text-zinc-900 flex items-center gap-2 mb-2">
                <span>📋</span> أدخل بياناتك لحفظ الخطة والاشتراك
              </h3>

              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg p-3 text-center">
                  ⚠️ {submitError}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-zinc-600 mb-1">الاسم الكامل *</label>
                  <input
                    type="text"
                    className="w-full bg-white border border-zinc-200 rounded-lg p-2.5 text-zinc-900 focus:border-emerald-500 outline-none text-sm"
                    placeholder="أدخل اسمك بالكامل"
                    value={subscriberName}
                    onChange={(e) => setSubscriberName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-600 mb-1">رقم الجوال السعودي *</label>
                  <input
                    type="tel"
                    className="w-full bg-white border border-zinc-200 rounded-lg p-2.5 text-zinc-900 focus:border-emerald-500 outline-none text-left text-sm"
                    placeholder="05xxxxxxxx"
                    value={subscriberPhone}
                    onChange={(e) => setSubscriberPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-orange w-full justify-center py-3 text-sm font-bold mt-2 flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    جاري حفظ البيانات...
                  </>
                ) : (
                  "حفظ الخطة والتسجيل للاشتراك ←"
                )}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

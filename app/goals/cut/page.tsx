"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

function CutContent() {
  const searchParams = useSearchParams();
  const initialCalories = parseInt(searchParams.get("calories") || "1600");

  const [calories, setCalories] = useState(initialCalories);

  // Ratios for Cutting (from lib/bmr.ts): Protein 40%, Carbs 30%, Fat 30%
  const proteinPercent = 40;
  const carbsPercent = 30;
  const fatPercent = 30;

  const proteinGrams = Math.round((calories * (proteinPercent / 100)) / 4);
  const carbsGrams = Math.round((calories * (carbsPercent / 100)) / 4);
  const fatGrams = Math.round((calories * (fatPercent / 100)) / 9);

  const proteinCals = Math.round(calories * (proteinPercent / 100));
  const carbsCals = Math.round(calories * (carbsPercent / 100));
  const fatCals = Math.round(calories * (fatPercent / 100));

  return (
    <div className="min-h-screen bg-surface-subtle py-8" dir="rtl">
      <div className="container-app max-w-3xl mx-auto px-4">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href={searchParams.get("calories") ? `/goals?calories=${searchParams.get("calories")}` : "/goals"}
            className="flex items-center gap-2 text-brand-dark hover:text-brand-orange font-bold transition-colors group"
          >
            <span className="text-xl group-hover:-translate-x-1 transition-transform duration-200">→</span>
            <span>العودة لاختيار الأهداف</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-brand rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">م</span>
            </div>
            <span className="font-black text-brand-dark">مقدار</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="card p-8 mb-6 border-2 border-brand-orange bg-gradient-to-br from-orange-50/50 to-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -mr-16 -mt-16 opacity-50 pointer-events-none" />
          <div className="text-6xl mb-4 animate-bounce-soft">🔥</div>
          <div className="badge-orange mx-auto mb-3 bg-orange-100 text-brand-orange border border-orange-200">حرق الدهون الصافي</div>
          <h1 className="text-3xl font-black text-brand-dark mb-3">خطة التنشيف وحرق الدهون (Cut)</h1>
          <p className="text-text-secondary max-w-xl mx-auto leading-relaxed">
            الخطة العلمية للتخلص من الدهون الزائدة وإبراز تفاصيل عضلاتك بوضوح. تركز هذه الخطة على عجز سعرات حرارية ذكي مع الحفاظ على نسبة بروتين عالية لحماية الكتلة العضلية من الهدم.
          </p>
        </div>

        {/* Interactive Calculator Section */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-black text-brand-dark mb-4 flex items-center gap-2">
            <span>📊</span>
            <span>توزيع السعرات والماكروز المستهدف</span>
          </h2>
          <p className="text-sm text-text-muted mb-6 leading-relaxed">
            قم بتحريك المؤشر لتعديل السعرات الحرارية ومعاينة الاحتياج الدقيق من البروتينات والكربوهيدرات والدهون لهذا الهدف:
          </p>

          {/* Calorie Display & Slider */}
          <div className="bg-orange-50/40 border border-orange-100/50 rounded-2xl p-6 text-center mb-8">
            <div className="text-5xl font-black text-brand-orange mb-1 tracking-tight">
              {calories.toLocaleString()}
            </div>
            <div className="text-brand-orange font-bold text-sm mb-4">كيلو سعرة يومياً</div>
            
            <input
              type="range"
              min="1200"
              max="3000"
              step="50"
              value={calories}
              onChange={(e) => setCalories(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-orange"
            />
            <div className="flex justify-between text-xs text-text-muted mt-2">
              <span>1200 سعرة</span>
              <span>3000 سعرة</span>
            </div>
          </div>

          {/* Macros Visual Breakdown */}
          <div className="space-y-5">
            {/* Protein */}
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-center text-sm mb-2">
                <div className="flex items-center gap-2 font-bold text-brand-dark">
                  <span className="text-lg">🥩</span>
                  <span>بروتين (Protein)</span>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-emerald-800 text-base">{proteinGrams} جم</span>
                  <span className="text-xs text-text-muted mr-1.5">({proteinCals} سعرة · {proteinPercent}%)</span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-emerald-800 h-full rounded-full transition-all duration-300"
                  style={{ width: `${proteinPercent}%` }}
                />
              </div>
            </div>

            {/* Carbs */}
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-center text-sm mb-2">
                <div className="flex items-center gap-2 font-bold text-brand-dark">
                  <span className="text-lg">🍚</span>
                  <span>كربوهيدرات (Carbs)</span>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-brand-light text-base">{carbsGrams} جم</span>
                  <span className="text-xs text-text-muted mr-1.5">({carbsCals} سعرة · {carbsPercent}%)</span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-brand-light h-full rounded-full transition-all duration-300"
                  style={{ width: `${carbsPercent}%` }}
                />
              </div>
            </div>

            {/* Fat */}
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-center text-sm mb-2">
                <div className="flex items-center gap-2 font-bold text-brand-dark">
                  <span className="text-lg">🥑</span>
                  <span>دهون صحية (Fat)</span>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-brand-orange text-base">{fatGrams} جم</span>
                  <span className="text-xs text-text-muted mr-1.5">({fatCals} سعرة · {fatPercent}%)</span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-brand-orange h-full rounded-full transition-all duration-300"
                  style={{ width: `${fatPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Goal Science and Details */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="card p-6">
            <h3 className="font-black text-brand-dark text-lg mb-3 flex items-center gap-2">
              <span>🧬</span>
              <span>المنهجية العلمية</span>
            </h3>
            <ul className="space-y-3.5 text-sm text-text-secondary">
              <li className="flex gap-2">
                <span className="text-brand-orange font-bold">✓</span>
                <span>توليد عجز سعرات حرارية آمن يضمن استمرار حرق الدهون دون تعب شديد.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-brand-orange font-bold">✓</span>
                <span>نسبة بروتين مرتفعة جداً (40%) للشعور بالشبع التام وحفظ حجم العضلات.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-brand-orange font-bold">✓</span>
                <span>تخفيض كربوهيدرات معتدل لتحفيز الجسم على استخدام الدهون المخزنة كوقود.</span>
              </li>
            </ul>
          </div>

          <div className="card p-6">
            <h3 className="font-black text-brand-dark text-lg mb-3 flex items-center gap-2">
              <span>🌾</span>
              <span>الأطعمة الموصى بها</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {["صدور الدجاج التركي", "بياض البيض", "سمك السلمون", "التونة بالماء", "الخضار الورقية", "البروكلي والقرنبيط", "الكينوا والبرغل", "التوت والفراولة"].map((f) => (
                <span key={f} className="text-xs font-semibold bg-gray-150 text-brand-dark px-3 py-1.5 rounded-lg border border-gray-200">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Typical Day Meal Plan Preview */}
        <div className="mb-8">
          <h3 className="font-black text-brand-dark text-lg mb-6 flex items-center gap-2">
            <span>🍽️</span>
            <span>نموذج ليوم كامل من وجبات التنشيف</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Meal 1 */}
            <div className="flex flex-col bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <div className="relative h-44 w-full overflow-hidden bg-gray-100">
                <Image
                  src="https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80"
                  alt="فيليه سلمون مشوي بالفرن"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 hover:scale-110"
                  priority
                />
                <div className="absolute top-3 right-3 bg-brand-orange text-white text-xs font-black px-3 py-1 rounded-full shadow-md">
                  وجبة 1
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-brand-dark text-base mb-1.5">فيليه سلمون بالفرن</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    فيليه سلمون مشوي غني بأوميغا-3 مع كينوا برية وهليون مطهو على البخار (تنشيف صافي).
                  </p>
                </div>
              </div>
            </div>

            {/* Meal 2 */}
            <div className="flex flex-col bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <div className="relative h-44 w-full overflow-hidden bg-gray-100">
                <Image
                  src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80"
                  alt="صدور دجاج متبلة ومحمرة"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 hover:scale-110"
                />
                <div className="absolute top-3 right-3 bg-brand-orange text-white text-xs font-black px-3 py-1 rounded-full shadow-md">
                  وجبة 2
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-brand-dark text-base mb-1.5">دجاج متبل ومحمر</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    صدور دجاج طرية ومشوية بتتبيلة الليمون والأعشاب، تقدم مع سلطة خضراء منعشة.
                  </p>
                </div>
              </div>
            </div>

            {/* Snack */}
            <div className="flex flex-col bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <div className="relative h-44 w-full overflow-hidden bg-gray-100">
                <Image
                  src="https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80"
                  alt="زبادي يوناني مع الفراولة واللوز"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 hover:scale-110"
                />
                <div className="absolute top-3 right-3 bg-brand-orange text-white text-xs font-black px-3 py-1 rounded-full shadow-md">
                  سناك
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-brand-dark text-base mb-1.5">زبادي يوناني بالتوت واللوز</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    زبادي يوناني قليل الدسم غني بالبروتين مع حبات التوت البري واللوز النيء للشبع.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button CTA */}
        <div className="text-center bg-white border border-gray-150 rounded-3xl p-8 shadow-sm">
          <h3 className="font-black text-brand-dark text-xl mb-2">هل أنت جاهز لتنشيف دهون جسمك؟</h3>
          <p className="text-text-muted text-sm mb-6">سنقوم بحفظ هذه السعرات والماكروز تلقائياً في حسابك وتطبيقها على قائمة طعامك اليومية.</p>
          <Link
            href={`/goals?goal=cut&calories=${calories}`}
            className="btn-orange text-white py-4 px-10 rounded-2xl font-black text-base inline-flex items-center gap-2 shadow-lg transition-transform hover:scale-105 active:scale-95 duration-200"
          >
            <span>اختر هذا الهدف واشترك الآن 🚀</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CutGoalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-subtle flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-brand rounded-2xl mx-auto mb-4 flex items-center justify-center animate-pulse-soft">
            <span className="text-white font-black text-3xl">م</span>
          </div>
          <div className="text-brand-dark font-bold">جاري التحميل...</div>
        </div>
      </div>
    }>
      <CutContent />
    </Suspense>
  );
}

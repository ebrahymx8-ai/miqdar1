"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { PRICING, calculatePrice } from "@/lib/pricing";

type GoalType = "bulk" | "cut" | "maintain";
type MenuType = "basic" | "premium";
type Duration = 26 | 30;
type PaymentMethod = "bank_transfer" | "cash" | "moyasar";

const GOAL_LABELS: Record<GoalType, string> = {
  bulk: "التضخيم 💪",
  cut: "التنشيف 🔥",
  maintain: "الحياة اليومية ⚖️",
};

const IBAN = "SA12 3456 7890 1234 5678 9012";

export default function GoalsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialGoal = (searchParams.get("goal") as GoalType) || null;
  const calories = searchParams.get("calories");

  const [selectedGoal, setSelectedGoal] = useState<GoalType | null>(initialGoal);
  const [selectedMenu, setSelectedMenu] = useState<MenuType | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<Duration | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [discountCode, setDiscountCode] = useState("");
  const [discountResult, setDiscountResult] = useState<{ valid: boolean; percentage: number; message: string } | null>(null);
  const [checkingCode, setCheckingCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"goal" | "menu" | "duration" | "payment" | "summary">(
    initialGoal ? "menu" : "goal"
  );

  const pricing =
    selectedMenu && selectedDuration
      ? calculatePrice(
          selectedMenu,
          selectedDuration,
          discountResult?.valid ? discountResult.percentage : 0
        )
      : null;

  const checkDiscount = async () => {
    if (!discountCode.trim()) return;
    setCheckingCode(true);
    try {
      const res = await fetch("/api/discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: discountCode }),
      });
      const data = await res.json();
      setDiscountResult(data);
    } catch {
      setDiscountResult({ valid: false, percentage: 0, message: "خطأ في التحقق" });
    }
    setCheckingCode(false);
  };

  const handleSubmit = async () => {
    if (!selectedGoal || !selectedMenu || !selectedDuration || !paymentMethod) return;
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: selectedGoal,
          menuType: selectedMenu,
          durationDays: selectedDuration,
          paymentMethod,
          discountCode: discountResult?.valid ? discountCode : undefined,
          discountAmount: pricing?.discount || 0,
          targetCalories: parseInt(calories || "2000"),
        }),
      });
      const data = await res.json();
      if (res.status === 401) { router.push("/login"); return; }
      if (data.success) router.push("/dashboard?new=1");
      else alert(data.error || "حدث خطأ، يرجى المحاولة مرة أخرى");
    } catch {
      alert("خطأ في الاتصال بالخادم");
    }
    setLoading(false);
  };

  const navHeader = (
    <div className="bg-white border-b border-gray-100 py-4 sticky top-0 z-40">
      <div className="container-app flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-brand rounded-xl flex items-center justify-center">
            <span className="text-white font-black">م</span>
          </div>
          <span className="font-black text-brand-dark text-lg">مقدار</span>
        </Link>
        {calories && (
          <div className="badge-green">🎯 {parseInt(calories).toLocaleString()} كيلو/يوم</div>
        )}
        <Link href="/login" className="btn-ghost text-sm">دخول</Link>
      </div>
    </div>
  );

  /* ── Step indicators ── */
  const steps = ["goal", "menu", "duration", "payment", "summary"];
  const currentIdx = steps.indexOf(step);

  const stepsBar = (
    <div className="flex items-center justify-center gap-1 py-6">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs font-black
            ${i < currentIdx ? "bg-brand-light text-white" : i === currentIdx ? "bg-brand-dark text-white shadow-brand" : "bg-gray-200 text-gray-400"}`}>
            {i < currentIdx ? "✓" : i + 1}
          </div>
          {i < steps.length - 1 && (
            <div className={`w-3 md:w-6 h-0.5 ${i < currentIdx ? "bg-brand-light" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-subtle" dir="rtl">
      {navHeader}

      <div className="container-app py-8 max-w-3xl mx-auto">
        {stepsBar}

        {/* ══ STEP: GOAL ══ */}
        {step === "goal" && (
          <div className="page-enter">
            <div className="text-center mb-8">
              <h1 className="section-title">اختر هدفك</h1>
              <p className="section-subtitle">سنعدّل السعرات والماكروز تلقائياً حسب هدفك</p>
            </div>
            <div className="grid grid-cols-3 gap-2.5 md:gap-6">
              {(
                [
                  { 
                    v: "bulk" as GoalType, 
                    emoji: "💪", 
                    name: "التضخيم", 
                    badge: "الأكثر طلباً", 
                    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-100",
                    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80" 
                  },
                  { 
                    v: "cut" as GoalType, 
                    emoji: "🔥", 
                    name: "التنشيف", 
                    badge: "حرق سريع", 
                    badgeColor: "bg-orange-50 text-brand-orange border-orange-100",
                    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80" 
                  },
                  { 
                    v: "maintain" as GoalType, 
                    emoji: "⚖️", 
                    name: "المحافظة", 
                    badge: "نمط حياة", 
                    badgeColor: "bg-blue-50 text-blue-700 border-blue-100",
                    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80" 
                  },
                ] as const
              ).map((g) => (
                <Link
                  id={`goal-${g.v}`}
                  key={g.v}
                  href={calories ? `/goals/${g.v}?calories=${calories}` : `/goals/${g.v}`}
                  className="card flex flex-col items-center justify-between border-2 border-gray-100 bg-white hover:border-brand-orange hover:shadow-card-hover transition-all duration-300 text-center relative overflow-hidden h-full group cursor-pointer hover:scale-[1.03] active:scale-95"
                >
                  <div className="relative w-full h-16 md:h-32 flex-shrink-0">
                    <Image
                      src={g.image}
                      alt={g.name}
                      fill
                      className="object-cover rounded-t-xl group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 33vw, 33vw"
                    />
                    {/* Emoji Overlay */}
                    <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 bg-white/90 backdrop-blur-sm w-7 h-7 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs md:text-base shadow-sm">
                      {g.emoji}
                    </div>
                  </div>
                  <div className="p-2 md:p-4 flex flex-col items-center justify-center flex-grow w-full">
                    {/* Badge */}
                    <div className="mb-1.5 md:mb-2">
                      <span className={`text-[8px] md:text-xs font-bold px-1 md:px-2 py-0.5 rounded-full border ${g.badgeColor}`}>
                        {g.badge}
                      </span>
                    </div>
                    {/* Name */}
                    <div className="font-black text-xs md:text-lg text-brand-dark">
                      {g.name}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}


        {/* ══ STEP: MENU ══ */}
        {step === "menu" && (
          <div className="page-enter">
            <div className="text-center mb-8">
              <h1 className="section-title">اختر نوع المنيو</h1>
              <p className="section-subtitle">وجبتان وسناك يومياً في كلا الخيارين</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {(["basic", "premium"] as MenuType[]).map((m) => {
                const info = {
                  basic: {
                    icon: "🥗", name: "الأساسية", badge: "",
                    price26: PRICING.basic.price26, price30: PRICING.basic.price30,
                    features: ["وجبتان صحيتان", "سناك يومي", "سعرات محسوبة علمياً", "توصيل يومي"],
                    highlight: false,
                    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80" 
                  },
                  premium: {
                    icon: "⭐", name: "المميزة", badge: "الأكثر اختياراً",
                    price26: PRICING.premium.price26, price30: PRICING.premium.price30,
                    features: ["وجبتان فاخرتان", "سناك مميز", "مكونات عالية الجودة", "توصيل يومي أولوية"],
                    highlight: true,
                    image: "https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&w=800&q=80" 
                  },
                }[m];
                return (
                  <button
                    id={`menu-${m}`}
                    key={m}
                    onClick={() => { setSelectedMenu(m); setStep("duration"); }}
                    className={`card text-center border-2 transition-all hover:shadow-card-hover overflow-hidden flex flex-col justify-between group ${
                      info.highlight 
                        ? "border-brand-orange scale-[1.02]" 
                        : "border-gray-200 hover:border-brand-dark"
                    }`}
                  >
                    <div className="relative w-full h-40 md:h-48 flex-shrink-0">
                      <Image
                        src={info.image}
                        alt={info.name}
                        fill
                        className="object-cover rounded-t-xl group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                    <div className="p-6 md:p-8 flex-grow flex flex-col justify-between w-full">
                      <div>
                        {info.badge && <div className="badge-orange mx-auto mb-3 w-fit">{info.badge}</div>}
                        <div className="font-black text-xl text-brand-dark mb-2 flex items-center justify-center gap-2">
                          <span>{info.icon}</span>
                          <span>{info.name}</span>
                        </div>
                        <div className="text-3xl font-black text-brand-dark mb-1">
                          {info.price26.toLocaleString()} <span className="text-sm font-normal text-text-muted">ريال</span>
                        </div>
                        <div className="text-xs text-text-muted mb-5">لمدة 26 يوماً + 99 ر توصيل</div>
                        <div className="space-y-2 mb-5 text-right">
                          {info.features.map((f) => (
                            <div key={f} className="flex items-center gap-2 text-sm">
                              <span className="text-brand-light font-bold flex-shrink-0">✓</span>
                              <span>{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className={`w-full rounded-xl py-3 font-bold text-sm ${info.highlight ? "bg-gradient-brand text-white" : "border-2 border-brand-dark text-brand-dark"}`}>
                        اختر هذه الباقة
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <button onClick={() => setStep("goal")} className="btn-ghost w-full justify-center">← رجوع</button>
          </div>
        )}

        {/* ══ STEP: DURATION ══ */}
        {step === "duration" && selectedMenu && (
          <div className="page-enter">
            <div className="text-center mb-8">
              <h1 className="section-title">مدة الاشتراك</h1>
              <p className="section-subtitle">اختر المدة المناسبة — كلما زادت المدة زادت أيام التجميد</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {([26, 30] as Duration[]).map((d) => {
                const price = d === 26 ? PRICING[selectedMenu].price26 : PRICING[selectedMenu].price30;
                const freeze = d === 26 ? 3 : 5;
                const isPopular = d === 30;
                return (
                  <button
                    id={`duration-${d}`}
                    key={d}
                    onClick={() => { setSelectedDuration(d); setStep("payment"); }}
                    className={`card p-8 text-center border-2 transition-all hover:shadow-card-hover ${isPopular ? "border-brand-orange" : "border-gray-200 hover:border-brand-dark"}`}
                  >
                    {isPopular && <div className="badge-orange mx-auto mb-3 w-fit">+ 200 ريال فقط</div>}
                    <div className="text-5xl font-black text-brand-dark">{d}</div>
                    <div className="text-text-muted text-lg mb-4">يوماً</div>
                    <div className="text-3xl font-black text-brand-dark mb-1">
                      {price.toLocaleString()} <span className="text-base font-normal">ريال</span>
                    </div>
                    <div className="text-xs text-text-muted mb-5">+ 99 ريال توصيل</div>
                    <div className="bg-blue-50 rounded-xl p-3 flex items-center justify-center gap-2 text-sm text-blue-700">
                      <span>❄️</span>
                      <span>أيام تجميد متاحة: <strong>{freeze} أيام</strong></span>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="card p-4 bg-blue-50 border border-blue-200 text-sm text-blue-800 mb-4">
              <strong>❄️ سياسة التجميد الذكي:</strong> يمكنك تجميد اشتراكك في أي وقت تحتاجه (سفر، مرض، عمل). 
              الأيام المجمّدة لا تُحتسب من مدة اشتراكك.
            </div>
            <button onClick={() => setStep("menu")} className="btn-ghost w-full justify-center">← رجوع</button>
          </div>
        )}

        {/* ══ STEP: PAYMENT ══ */}
        {step === "payment" && selectedMenu && selectedDuration && (
          <div className="page-enter">
            <div className="text-center mb-8">
              <h1 className="section-title">طريقة الدفع</h1>
            </div>

            {/* Payment Methods */}
            <div className="grid gap-4 mb-6">
              {[
                { v: "moyasar"       as PaymentMethod, icon: "💳", label: "بطاقة إلكترونية (موياسار)", sub: "ماستر / فيزا / مدى — آمن 100%" },
                { v: "bank_transfer" as PaymentMethod, icon: "🏦", label: "تحويل بنكي",                sub: "حوّل على الآيبان وأرفق الإيصال" },
                { v: "cash"          as PaymentMethod, icon: "💵", label: "نقداً عند الاستلام",         sub: "ادفع للمندوب أول يوم توصيل" },
              ].map((pm) => (
                <button
                  id={`payment-${pm.v}`}
                  key={pm.v}
                  onClick={() => setPaymentMethod(pm.v)}
                  className={`card p-5 flex items-center gap-4 border-2 text-right transition-all ${paymentMethod === pm.v ? "border-brand-dark bg-green-50" : "border-gray-200 hover:border-brand-light"}`}
                >
                  <span className="text-4xl flex-shrink-0">{pm.icon}</span>
                  <div className="flex-1">
                    <div className="font-bold text-brand-dark">{pm.label}</div>
                    <div className="text-sm text-text-muted">{pm.sub}</div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${paymentMethod === pm.v ? "border-brand-dark bg-brand-dark" : "border-gray-300"}`}>
                    {paymentMethod === pm.v && <span className="text-white text-xs">✓</span>}
                  </div>
                </button>
              ))}
            </div>

            {/* Bank Transfer Details */}
            {paymentMethod === "bank_transfer" && (
              <div className="card p-5 bg-blue-50 border border-blue-200 mb-4">
                <div className="font-bold text-blue-800 mb-3">📋 بيانات التحويل البنكي</div>
                <div className="bg-white rounded-xl p-3 mb-2 text-center">
                  <div className="text-xs text-text-muted mb-1">رقم الآيبان</div>
                  <div className="font-mono font-bold text-brand-dark text-lg">{IBAN}</div>
                </div>
                <div className="text-sm text-blue-700 mb-3">اسم المستفيد: <strong>مقدار للوجبات الصحية</strong></div>
                <div>
                  <label className="label-field text-blue-800">رفع صورة إيصال التحويل *</label>
                  <input id="receipt-upload" type="file" accept="image/*,application/pdf" className="input-field text-sm" />
                  <p className="text-xs text-blue-600 mt-1">سيتم تفعيل اشتراكك بعد مراجعة الإيصال خلال ساعة واحدة</p>
                </div>
              </div>
            )}

            {/* Moyasar Notice */}
            {paymentMethod === "moyasar" && (
              <div className="card p-4 bg-green-50 border border-brand-light/30 text-sm text-brand-dark mb-4">
                ✅ سيتم توجيهك لبوابة موياسار الآمنة لإتمام عملية الدفع. يُفعَّل اشتراكك فوراً بعد الدفع.
              </div>
            )}

            {/* Discount Code */}
            <div className="card p-5 mb-5">
              <label className="label-field">كود الخصم (اختياري) 🎁</label>
              <div className="flex gap-2">
                <input
                  id="discount-input"
                  className="input-field flex-1"
                  placeholder="مثال: MIQDAR5"
                  value={discountCode}
                  onChange={(e) => { setDiscountCode(e.target.value.toUpperCase()); setDiscountResult(null); }}
                />
                <button
                  id="discount-check-btn"
                  onClick={checkDiscount}
                  disabled={checkingCode || !discountCode.trim()}
                  className="btn-outline px-5 flex-shrink-0"
                >
                  {checkingCode ? "..." : "تحقق"}
                </button>
              </div>
              {discountResult && (
                <div className={`mt-2 text-sm font-semibold ${discountResult.valid ? "text-brand-dark" : "text-red-600"}`}>
                  {discountResult.valid ? "✅" : "❌"} {discountResult.message}
                </div>
              )}
            </div>

            <button
              id="payment-next-btn"
              onClick={() => setStep("summary")}
              disabled={!paymentMethod}
              className="btn-primary w-full py-4 text-base"
            >
              مراجعة الملخص ←
            </button>
            <button onClick={() => setStep("duration")} className="btn-ghost w-full justify-center mt-2">← رجوع</button>
          </div>
        )}

        {/* ══ STEP: SUMMARY ══ */}
        {step === "summary" && selectedGoal && selectedMenu && selectedDuration && paymentMethod && pricing && (
          <div className="page-enter">
            <div className="text-center mb-8">
              <div className="text-5xl mb-2">📋</div>
              <h1 className="section-title">ملخص طلبك</h1>
              <p className="section-subtitle">راجع التفاصيل قبل تأكيد الاشتراك</p>
            </div>

            <div className="card p-6 mb-5">
              <h3 className="font-bold text-brand-dark text-lg mb-4 pb-3 border-b border-gray-100">تفاصيل الباقة</h3>
              <div className="space-y-3">
                {[
                  { label: "الهدف",            value: GOAL_LABELS[selectedGoal] },
                  { label: "نوع المنيو",        value: selectedMenu === "basic" ? "الأساسية 🥗" : "المميزة ⭐" },
                  { label: "مدة الاشتراك",     value: `${selectedDuration} يوماً` },
                  { label: "أيام التجميد",     value: `${selectedDuration === 26 ? 3 : 5} أيام` },
                  { label: "طريقة الدفع",      value: paymentMethod === "moyasar" ? "💳 بطاقة إلكترونية" : paymentMethod === "bank_transfer" ? "🏦 تحويل بنكي" : "💵 كاش عند الاستلام" },
                ].map((r) => (
                  <div key={r.label} className="flex justify-between py-2 border-b border-gray-50 text-sm">
                    <span className="text-text-muted">{r.label}</span>
                    <span className="font-semibold text-brand-dark">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="card p-6 mb-6">
              <h3 className="font-bold text-brand-dark text-lg mb-4 pb-3 border-b border-gray-100">تفصيل الفاتورة</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">سعر الباقة ({selectedDuration} يوم)</span>
                  <span className="font-semibold">{pricing.basePrice.toLocaleString()} ريال</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">رسوم التوصيل</span>
                  <span className="font-semibold">{pricing.deliveryFee} ريال</span>
                </div>
                {pricing.discount > 0 && (
                  <div className="flex justify-between text-brand-dark">
                    <span>خصم {discountResult?.percentage}% ({discountCode})</span>
                    <span className="font-semibold">- {pricing.discount} ريال</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-black text-brand-orange pt-3 border-t border-gray-200 mt-2">
                  <span>الإجمالي</span>
                  <span>{pricing.total.toLocaleString()} ريال</span>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="text-xs text-text-muted text-center mb-5">
              بالضغط على &quot;تأكيد الاشتراك&quot; أنت توافق على{" "}
              <span className="text-brand-dark font-semibold cursor-pointer hover:underline">شروط الاستخدام</span>
              {" "}وسياسة التجميد المذكورة أعلاه.
            </div>

            <button
              id="confirm-order-btn"
              onClick={handleSubmit}
              disabled={loading}
              className="btn-orange w-full py-4 text-base"
            >
              {loading ? (
                <><span className="spinner" /><span>جاري تأكيد الاشتراك...</span></>
              ) : (
                "✅ تأكيد الاشتراك والدفع"
              )}
            </button>
            <button onClick={() => setStep("payment")} className="btn-ghost w-full justify-center mt-3">← رجوع للدفع</button>
          </div>
        )}
      </div>
    </div>
  );
}

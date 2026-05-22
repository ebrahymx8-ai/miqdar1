"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface Subscription {
  id: string;
  goal: "bulk" | "cut" | "maintain";
  menuType: "basic" | "premium";
  durationDays: 26 | 30;
  startDate: string;
  endDate: string;
  status: "pending" | "active" | "frozen" | "expired" | "cancelled";
  frozenDays: number;
  maxFreezeDays: number;
  targetCalories: number;
  totalPrice: number;
  paymentMethod: string;
  paymentStatus: string;
  discountAmount: number;
}

const GOAL_LABELS = { bulk: "التضخيم 💪", cut: "التنشيف 🔥", maintain: "الحياة اليومية ⚖️" };
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active:    { label: "نشط ✅",          color: "bg-green-100 text-green-800" },
  pending:   { label: "قيد المراجعة ⏳", color: "bg-yellow-100 text-yellow-800" },
  frozen:    { label: "مجمّد ❄️",        color: "bg-blue-100 text-blue-800" },
  expired:   { label: "منتهي",           color: "bg-gray-100 text-gray-600" },
  cancelled: { label: "ملغي",            color: "bg-red-100 text-red-600" },
};

const WEEKLY_MEALS = [
  { day: "السبت",     breakfast: "شوفان بالتوت والمكسرات",      lunch: "صدر دجاج مشوي مع الأرز البني",  snack: "يوغرت يوناني" },
  { day: "الأحد",    breakfast: "بيض مسلوق مع خبز القمح",      lunch: "سمك مشوي مع الخضار المشكلة",    snack: "موزة + بروتين" },
  { day: "الاثنين",  breakfast: "بانكيك بروتين بالموز",         lunch: "لحم مع كينوا والسلطة الخضراء",  snack: "مكسرات نيئة" },
  { day: "الثلاثاء", breakfast: "سموذي بروتين بالفراولة",       lunch: "دجاج تيريياكي مع الأرز البسمتي",snack: "تفاحة + زبدة اللوز" },
  { day: "الأربعاء", breakfast: "أومليت الخضار",                lunch: "شاورما دجاج بالخبز البر",       snack: "جبن قريش" },
  { day: "الخميس",   breakfast: "فول مدمس مع البيض المقلي",    lunch: "سلمون مع البطاطا الحلوة",       snack: "لبن خادر" },
  { day: "الجمعة",   breakfast: "شوفان بروتين بالتمر",          lunch: "صدر ديك رومي مع مكرونة القمح",  snack: "فاكهة موسمية طازجة" },
];

export default function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNew = searchParams.get("new") === "1";

  const [data, setData] = useState<{ session: { name: string; phone: string; email: string }; subscriptions: Subscription[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [freezeLoading, setFreezeLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "meals" | "history">("overview");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  useEffect(() => {
    fetchData();
    if (isNew) setTimeout(() => showToast("🎉 تم تأكيد اشتراكك بنجاح! أهلاً بك في مقدار"), 500);
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (res.status === 401) { router.push("/login"); return; }
      setData(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFreeze = async (subId: string, action: "freeze" | "unfreeze") => {
    setFreezeLoading(true);
    try {
      const res = await fetch(`/api/subscriptions/${subId}/freeze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = await res.json();
      showToast(result.message);
      if (result.success) fetchData();
    } catch {
      showToast("❌ خطأ في الاتصال");
    } finally {
      setFreezeLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/login", { method: "DELETE" });
    router.push("/");
  };

  if (loading) return (
    <div className="min-h-screen bg-surface-subtle flex items-center justify-center" dir="rtl">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-brand rounded-2xl mx-auto mb-4 flex items-center justify-center animate-pulse-soft">
          <span className="text-white font-black text-3xl">م</span>
        </div>
        <div className="text-brand-dark font-bold">جاري التحميل...</div>
      </div>
    </div>
  );

  const activeSub = data?.subscriptions.find(
    (s) => s.status === "active" || s.status === "frozen" || s.status === "pending"
  );
  const daysLeft = activeSub ? Math.max(0, Math.ceil((new Date(activeSub.endDate).getTime() - Date.now()) / 86400000)) : 0;
  const totalDays = activeSub?.durationDays || 1;
  const daysUsed = Math.max(0, totalDays - daysLeft);
  const progress = Math.min(100, Math.round((daysUsed / totalDays) * 100));

  const getMacros = (sub: Subscription) => {
    const r = sub.goal === "bulk" ? { p: 0.30, c: 0.45, f: 0.25 } : sub.goal === "cut" ? { p: 0.40, c: 0.30, f: 0.30 } : { p: 0.25, c: 0.45, f: 0.30 };
    return {
      protein: Math.round(sub.targetCalories * r.p / 4),
      carbs:   Math.round(sub.targetCalories * r.c / 4),
      fat:     Math.round(sub.targetCalories * r.f / 9),
    };
  };

  return (
    <div className="min-h-screen bg-surface-subtle" dir="rtl">
      {toast && (
        <div className="toast" style={{ maxWidth: "90vw", textAlign: "center" }}>{toast}</div>
      )}

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="container-app flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-brand rounded-xl flex items-center justify-center shadow-brand">
              <span className="text-white font-black">م</span>
            </div>
            <div className="hidden md:block">
              <div className="font-black text-brand-dark leading-none">مقدار</div>
              <div className="text-xs text-brand-light">للوجبات الصحية</div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-white font-bold text-sm">
                {data?.session.name?.charAt(0)}
              </div>
              <span className="text-sm font-semibold text-brand-dark">{data?.session.name?.split(" ")[0]}</span>
            </div>
            <button
              id="logout-btn"
              onClick={handleLogout}
              className="btn-ghost text-sm"
              style={{ color: "#E53E3E" }}
            >
              خروج
            </button>
          </div>
        </div>
      </nav>

      <div className="container-app py-8 max-w-4xl mx-auto">

        {/* Greeting */}
        <div className="mb-6 page-enter">
          <h1 className="text-2xl font-black text-brand-dark">
            أهلاً، {data?.session.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-text-muted text-sm mt-1">
            {new Date().toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* No Subscription */}
        {!activeSub && (
          <div className="card p-12 text-center mb-8 page-enter">
            <div className="text-7xl mb-5">🥗</div>
            <h2 className="text-2xl font-black text-brand-dark mb-2">لا يوجد اشتراك نشط</h2>
            <p className="text-text-muted mb-8 max-w-sm mx-auto">ابدأ رحلتك الصحية اليوم — احسب سعراتك وانضم لأكثر من 500 مشترك</p>
            <Link href="/calculator" id="dashboard-start-btn" className="btn-primary px-10 py-4 text-base">
              🧮 احسب سعراتي وابدأ →
            </Link>
          </div>
        )}

        {/* Active Subscription */}
        {activeSub && (
          <>
            {/* Main Status Card */}
            <div className="card p-6 mb-5 page-enter" style={{ borderTop: "4px solid #1A5C2A" }}>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_LABELS[activeSub.status]?.color}`}>
                      {STATUS_LABELS[activeSub.status]?.label}
                    </span>
                    <span className="badge-green">{GOAL_LABELS[activeSub.goal]}</span>
                    <span className="badge-orange">{activeSub.menuType === "basic" ? "أساسية" : "مميزة"}</span>
                  </div>
                  <h2 className="text-xl font-black text-brand-dark">
                    اشتراك {activeSub.durationDays} يوم
                  </h2>
                  <p className="text-sm text-text-muted mt-1">
                    {new Date(activeSub.startDate).toLocaleDateString("ar-SA")} — {new Date(activeSub.endDate).toLocaleDateString("ar-SA")}
                  </p>
                </div>

                {/* Countdown */}
                <div className="flex-shrink-0">
                  <div className="bg-gradient-hero rounded-2xl p-5 text-center text-white min-w-[120px]">
                    <div className="text-4xl font-black">{daysLeft}</div>
                    <div className="text-sm opacity-80 mt-0.5">يوم متبقي</div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-5">
                <div className="flex justify-between text-xs text-text-muted mb-1.5">
                  <span>تقدم الاشتراك — {progress}%</span>
                  <span>{daysUsed} من {totalDays} يوم</span>
                </div>
                <div className="progress-bar h-3 rounded-xl">
                  <div className="progress-fill h-full rounded-xl" style={{ width: `${progress}%` }} />
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                {[
                  { label: "الهدف اليومي",       value: `${activeSub.targetCalories.toLocaleString()} ك.س` },
                  { label: "بداية الاشتراك",     value: new Date(activeSub.startDate).toLocaleDateString("ar-SA") },
                  { label: "نهاية الاشتراك",     value: new Date(activeSub.endDate).toLocaleDateString("ar-SA") },
                  { label: "تجميد متبقي",        value: `${activeSub.maxFreezeDays - activeSub.frozenDays} أيام` },
                ].map((item) => (
                  <div key={item.label} className="bg-surface-subtle rounded-xl p-3 text-center">
                    <div className="text-xs text-text-muted mb-0.5">{item.label}</div>
                    <div className="font-bold text-brand-dark text-sm">{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {activeSub.status === "active" && activeSub.frozenDays < activeSub.maxFreezeDays && (
                  <button
                    id="freeze-btn"
                    onClick={() => handleFreeze(activeSub.id, "freeze")}
                    disabled={freezeLoading}
                    className="btn-outline text-sm px-5 py-2"
                    style={{ borderColor: "#3B82F6", color: "#2563EB" }}
                  >
                    {freezeLoading ? "..." : "❄️ تجميد الاشتراك"}
                  </button>
                )}
                {activeSub.status === "frozen" && (
                  <button
                    id="unfreeze-btn"
                    onClick={() => handleFreeze(activeSub.id, "unfreeze")}
                    disabled={freezeLoading}
                    className="btn-primary text-sm px-5 py-2"
                  >
                    {freezeLoading ? "..." : "▶️ استئناف الاشتراك"}
                  </button>
                )}
                <a href="https://wa.me/966541688135" target="_blank" rel="noopener noreferrer" id="whatsapp-support"
                   className="btn-ghost text-sm px-4 py-2 border border-gray-200 rounded-xl">
                  💬 تواصل معنا
                </a>
              </div>
            </div>

            {/* Renewal Reminder */}
            {daysLeft <= 3 && daysLeft > 0 && (
              <div className="card p-5 mb-5 flex items-center gap-4" style={{ borderRight: "4px solid #E8763A", background: "#FFF7F3" }}>
                <div className="text-4xl animate-bounce-soft flex-shrink-0">⏰</div>
                <div className="flex-1">
                  <div className="font-bold text-brand-dark">اشتراكك ينتهي خلال {daysLeft} أيام فقط!</div>
                  <div className="text-sm text-text-muted">جدد الآن لتستمر في رحلتك دون انقطاع</div>
                </div>
                <Link href="/goals" id="renew-btn" className="btn-orange text-sm px-5 py-2.5 flex-shrink-0">
                  جدّد الآن
                </Link>
              </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 mb-6 flex gap-1">
              {[
                { key: "overview", label: "نظرة عامة",    icon: "📊" },
                { key: "meals",    label: "جدول الوجبات", icon: "🥗" },
                { key: "history",  label: "السجل",         icon: "📋" },
              ].map((t) => (
                <button
                  key={t.key}
                  id={`tab-${t.key}`}
                  onClick={() => setActiveTab(t.key as typeof activeTab)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    activeTab === t.key
                      ? "bg-brand-dark text-white shadow-brand"
                      : "text-text-muted hover:text-brand-dark"
                  }`}
                >
                  <span>{t.icon}</span>
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              ))}
            </div>

            {/* Tab: Overview */}
            {activeTab === "overview" && (
              <div className="grid md:grid-cols-2 gap-5 page-enter">
                {/* Macros Card */}
                <div className="card p-6">
                  <h3 className="font-bold text-brand-dark mb-4">🎯 ماكروزك اليومية</h3>
                  {(() => {
                    const macros = getMacros(activeSub);
                    return (
                      <div className="space-y-4">
                        <div className="text-center py-3 bg-surface-subtle rounded-xl">
                          <div className="text-4xl font-black text-brand-orange">{activeSub.targetCalories.toLocaleString()}</div>
                          <div className="text-brand-light text-sm font-semibold">كيلو سعرة / يوم</div>
                        </div>
                        {[
                          { label: "بروتين 🥩", val: macros.protein, color: "#1A5C2A", pct: activeSub.goal === "cut" ? 40 : activeSub.goal === "bulk" ? 30 : 25 },
                          { label: "كارب 🍚",   val: macros.carbs,   color: "#7BC142", pct: activeSub.goal === "cut" ? 30 : 45 },
                          { label: "دهون 🥑",   val: macros.fat,     color: "#E8763A", pct: activeSub.goal === "cut" ? 30 : activeSub.goal === "bulk" ? 25 : 30 },
                        ].map((m) => (
                          <div key={m.label}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-semibold">{m.label}</span>
                              <span className="text-text-muted">{m.val}جم · {m.pct}%</span>
                            </div>
                            <div className="macro-bar">
                              <div style={{ width: `${m.pct}%`, backgroundColor: m.color, height: "10px", borderRadius: "5px", transition: "width 1s ease" }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Freeze Status */}
                <div className="card p-6">
                  <h3 className="font-bold text-brand-dark mb-4">❄️ حالة التجميد</h3>
                  <div className="space-y-3 mb-4">
                    {[
                      { label: "إجمالي أيام التجميد",  value: `${activeSub.maxFreezeDays} أيام` },
                      { label: "أيام تم تجميدها",      value: `${activeSub.frozenDays} أيام`,    color: activeSub.frozenDays > 0 ? "#2563EB" : undefined },
                      { label: "أيام تجميد متبقية",    value: `${activeSub.maxFreezeDays - activeSub.frozenDays} أيام`, color: "#1A5C2A" },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between py-2 border-b border-gray-50 text-sm">
                        <span className="text-text-muted">{item.label}</span>
                        <span className="font-bold" style={{ color: item.color || "#1A1A1A" }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="progress-bar mb-3">
                    <div style={{ width: `${(activeSub.frozenDays / activeSub.maxFreezeDays) * 100}%`, background: "linear-gradient(to left, #60A5FA, #3B82F6)", height: "6px", borderRadius: "3px", transition: "width 0.5s ease" }} />
                  </div>
                  <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
                    💡 عند التجميد، تتوقف أيام اشتراكك مؤقتاً ويمتد تاريخ الانتهاء تلقائياً.
                  </div>
                </div>

                {/* Payment Details */}
                <div className="card p-6 md:col-span-2">
                  <h3 className="font-bold text-brand-dark mb-4">💳 تفاصيل الفاتورة</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { label: "قيمة الباقة",      value: `${(activeSub.totalPrice - 99 + activeSub.discountAmount).toLocaleString()} ريال` },
                      { label: "رسوم التوصيل",     value: "99 ريال" },
                      { label: "الخصم المطبق",     value: activeSub.discountAmount > 0 ? `- ${activeSub.discountAmount} ريال` : "لا يوجد" },
                      { label: "الإجمالي",         value: `${activeSub.totalPrice.toLocaleString()} ريال` },
                      { label: "طريقة الدفع",      value: activeSub.paymentMethod === "cash" ? "💵 كاش" : activeSub.paymentMethod === "bank_transfer" ? "🏦 تحويل بنكي" : "💳 موياسار" },
                      { label: "حالة الدفع",       value: activeSub.paymentStatus === "confirmed" ? "✅ مؤكد" : "⏳ قيد المراجعة" },
                    ].map((item) => (
                      <div key={item.label} className="bg-surface-subtle rounded-xl p-3">
                        <div className="text-xs text-text-muted mb-1">{item.label}</div>
                        <div className="font-bold text-sm">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Meals */}
            {activeTab === "meals" && (
              <div className="page-enter">
                <div className="card p-4 bg-green-50 border border-brand-light/30 text-sm text-brand-dark mb-4">
                  🔄 جدول الوجبات يتجدد أسبوعياً لضمان التنوع والتشويق في رحلتك الصحية
                </div>
                <div className="space-y-3">
                  {WEEKLY_MEALS.map((meal, i) => {
                    const dayIdx = new Date().getDay(); // 0=Sunday
                    const isToday = (i === 0 && dayIdx === 6) || (i === 1 && dayIdx === 0) || i === dayIdx - 1;
                    return (
                      <div key={meal.day} className={`card p-5 transition-all ${isToday ? "border-2 border-brand-dark" : ""}`}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 ${isToday ? "bg-brand-dark text-white shadow-brand" : "bg-surface-subtle text-brand-dark"}`}>
                            {i + 1}
                          </div>
                          <span className="font-black text-brand-dark">{meal.day}</span>
                          {isToday && <span className="badge-green text-xs">اليوم</span>}
                        </div>
                        <div className="grid md:grid-cols-3 gap-3">
                          {[
                            { icon: "🌅", label: "إفطار",  val: meal.breakfast },
                            { icon: "🍽️", label: "غداء",   val: meal.lunch },
                            { icon: "🥤", label: "سناك",   val: meal.snack },
                          ].map((m) => (
                            <div key={m.label} className="bg-surface-subtle rounded-xl p-3">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-base">{m.icon}</span>
                                <span className="text-xs text-text-muted font-bold">{m.label}</span>
                              </div>
                              <div className="text-sm font-medium text-brand-dark">{m.val}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab: History */}
            {activeTab === "history" && (
              <div className="space-y-4 page-enter">
                {data?.subscriptions.length === 0 && (
                  <div className="text-center text-text-muted py-12">لا يوجد سجل اشتراكات</div>
                )}
                {data?.subscriptions.map((sub) => (
                  <div key={sub.id} className="card p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-brand-dark">
                          {GOAL_LABELS[sub.goal]} — {sub.menuType === "basic" ? "أساسية 🥗" : "مميزة ⭐"} ({sub.durationDays} يوم)
                        </div>
                        <div className="text-sm text-text-muted mt-0.5">
                          {new Date(sub.startDate).toLocaleDateString("ar-SA")} — {new Date(sub.endDate).toLocaleDateString("ar-SA")}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_LABELS[sub.status]?.color}`}>
                          {STATUS_LABELS[sub.status]?.label}
                        </span>
                        <span className="font-black text-brand-dark">{sub.totalPrice.toLocaleString()} ريال</span>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="text-center pt-4">
                  <Link href="/goals" className="btn-primary px-8">+ اشتراك جديد</Link>
                </div>
              </div>
            )}
          </>
        )}

        {/* Support Footer */}
        <div className="mt-10 card p-5 flex flex-col md:flex-row items-center justify-between gap-4" style={{ background: "linear-gradient(135deg, #F0FAF3 0%, #F9FBF7 100%)" }}>
          <div>
            <div className="font-bold text-brand-dark">تحتاج مساعدة؟</div>
            <div className="text-sm text-text-muted">فريق الدعم جاهز لمساعدتك</div>
          </div>
          <div className="flex gap-3">
            <a id="support-whatsapp" href="https://wa.me/966541688135" target="_blank" rel="noopener noreferrer" className="btn-primary text-sm px-5 py-2.5">
              💬 واتساب
            </a>
            <a id="support-phone" href="tel:0541688135" className="btn-outline text-sm px-5 py-2.5">
              📞 اتصال
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: personal info, 2: body metrics
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", phone: "", email: "", password: "", confirmPassword: "",
    gender: "" as "male" | "female" | "",
    age: "", weight: "", height: "",
    activityLevel: "" as string,
  });

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleStep1 = () => {
    if (!form.name || !form.phone || !form.email || !form.password) {
      setError("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ""))) {
      setError("رقم الجوال غير صحيح (10 أرقام)");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.gender || !form.age || !form.weight || !form.height || !form.activityLevel) {
      setError("يرجى إكمال بياناتك الجسدية");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "حدث خطأ"); setLoading(false); return; }
      router.push("/calculator");
    } catch {
      setError("خطأ في الاتصال، حاول مرة أخرى");
      setLoading(false);
    }
  };

  const activityOptions = [
    { value: "sedentary",   label: "خامل 🛋️",           sub: "لا تمارس رياضة" },
    { value: "light",       label: "خفيف 🚶",            sub: "1-3 أيام/أسبوع" },
    { value: "moderate",    label: "متوسط 🏋️",           sub: "3-5 أيام/أسبوع" },
    { value: "active",      label: "نشيط 🏃",            sub: "6-7 أيام/أسبوع" },
    { value: "very_active", label: "مكثف جداً ⚡",       sub: "عمل بدني + تمرين" },
  ];

  return (
    <div className="min-h-screen bg-surface-subtle dark:bg-zinc-950 flex flex-col" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 py-4">
        <div className="container-app flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-brand rounded-xl flex items-center justify-center">
              <span className="text-white font-black">م</span>
            </div>
            <span className="font-black text-brand-dark dark:text-zinc-50 text-lg">مقدار</span>
          </Link>
          <Link href="/login" className="btn-ghost text-sm">لديك حساب؟ سجل دخول</Link>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 py-10">
        <div className="w-full max-w-md">
          {/* Step Indicator */}
          <div className="step-indicator mb-8">
            <div className={`step-dot ${step >= 1 ? "active" : "inactive"}`}>1</div>
            <div className={`step-line ${step >= 2 ? "done" : ""}`} />
            <div className={`step-dot ${step >= 2 ? "active" : "inactive"}`}>2</div>
            <div className="step-line" />
            <div className="step-dot inactive">3</div>
          </div>

          <div className="card p-8">
            <h1 className="text-2xl font-black text-brand-dark dark:text-zinc-50 mb-1">
              {step === 1 ? "إنشاء حسابك" : "بياناتك الجسدية"}
            </h1>
            <p className="text-text-muted dark:text-zinc-400 text-sm mb-6">
              {step === 1 ? "الخطوة 1 من 2: المعلومات الشخصية" : "الخطوة 2 من 2: لحساب سعراتك بدقة"}
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-4 font-medium">
                ⚠️ {error}
              </div>
            )}

            {step === 1 ? (
              <div className="space-y-4">
                <div>
                  <label className="label-field">الاسم الكامل *</label>
                  <input id="reg-name" className="input-field" placeholder="مثال: أحمد محمد الشمري" value={form.name} onChange={(e) => update("name", e.target.value)} />
                </div>
                <div>
                  <label className="label-field">رقم الجوال *</label>
                  <input id="reg-phone" className="input-field" placeholder="05XXXXXXXX" value={form.phone} onChange={(e) => update("phone", e.target.value)} maxLength={10} />
                </div>
                <div>
                  <label className="label-field">البريد الإلكتروني *</label>
                  <input id="reg-email" type="email" className="input-field" placeholder="example@email.com" value={form.email} onChange={(e) => update("email", e.target.value)} />
                </div>
                <div>
                  <label className="label-field">كلمة المرور *</label>
                  <input id="reg-password" type="password" className="input-field" placeholder="8 أحرف على الأقل" value={form.password} onChange={(e) => update("password", e.target.value)} />
                </div>
                <div>
                  <label className="label-field">تأكيد كلمة المرور *</label>
                  <input id="reg-confirm" type="password" className="input-field" placeholder="أعد إدخال كلمة المرور" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} />
                </div>
                <button id="reg-step1-btn" onClick={handleStep1} className="btn-primary w-full mt-2">
                  التالي ← 
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Gender */}
                <div>
                  <label className="label-field">الجنس *</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[{ v: "male", l: "ذكر 👨" }, { v: "female", l: "أنثى 👩" }].map((g) => (
                      <button id={`reg-gender-${g.v}`} key={g.v} type="button"
                        onClick={() => update("gender", g.v)}
                        className={`p-3 rounded-xl border-2 font-bold text-sm transition-all cursor-pointer ${form.gender === g.v ? "border-brand-dark bg-green-50 text-brand-dark dark:bg-green-950/20 dark:text-brand-light dark:border-brand-light" : "border-gray-200 text-text-secondary hover:border-brand-light dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-brand-light"}`}>
                        {g.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="label-field">العمر *</label>
                    <input id="reg-age" className="input-field" type="number" placeholder="25" min="15" max="80" value={form.age} onChange={(e) => update("age", e.target.value)} />
                  </div>
                  <div>
                    <label className="label-field">الوزن (كج) *</label>
                    <input id="reg-weight" className="input-field" type="number" placeholder="75" min="30" max="250" value={form.weight} onChange={(e) => update("weight", e.target.value)} />
                  </div>
                  <div>
                    <label className="label-field">الطول (سم) *</label>
                    <input id="reg-height" className="input-field" type="number" placeholder="175" min="130" max="230" value={form.height} onChange={(e) => update("height", e.target.value)} />
                  </div>
                </div>

                {/* Activity Level */}
                <div>
                  <label className="label-field">مستوى النشاط البدني *</label>
                  <div className="space-y-2">
                    {activityOptions.map((a) => (
                      <button id={`reg-activity-${a.value}`} key={a.value} type="button"
                        onClick={() => update("activityLevel", a.value)}
                        className={`w-full p-3 rounded-xl border-2 text-right flex items-center justify-between transition-all cursor-pointer ${form.activityLevel === a.value ? "border-brand-dark bg-green-50 dark:bg-green-950/20 dark:border-brand-light" : "border-gray-200 hover:border-brand-light dark:border-zinc-800 dark:hover:border-brand-light"}`}>
                        <span className="font-semibold text-sm text-brand-dark dark:text-brand-light">{a.label}</span>
                        <span className="text-xs text-text-muted dark:text-zinc-400">{a.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={() => setStep(1)} className="btn-outline flex-1">← رجوع</button>
                  <button id="reg-submit-btn" type="submit" className="btn-primary flex-[2]" disabled={loading}>
                    {loading ? <span className="spinner" /> : "إنشاء الحساب وحساب سعراتي →"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

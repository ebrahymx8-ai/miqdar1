"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ phone: "", password: "" });
  const [isStaffLogin, setIsStaffLogin] = useState(false);
  const [staffPin, setStaffPin] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (isStaffLogin) {
      if (!staffPin || staffPin.length !== 4) {
        setError("أدخل رمز دخول الموظف المكون من 4 أرقام");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/business/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pinCode: staffPin }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "رمز الدخول غير صحيح");
          setLoading(false);
          return;
        }
        
        // Save business login session in localStorage to prevent page reload flashes
        localStorage.setItem("miqdar_business_authenticated", "true");
        localStorage.setItem("miqdar_business_role", data.user.role);
        
        router.push("/business");
      } catch {
        setError("خطأ في الاتصال بالخادم");
        setLoading(false);
      }
      return;
    }

    if (!form.phone || !form.password) { setError("أدخل رقم الجوال وكلمة المرور"); setLoading(false); return; }
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "بيانات الدخول غير صحيحة"); setLoading(false); return; }
      router.push("/dashboard");
    } catch {
      setError("خطأ في الاتصال");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-subtle dark:bg-zinc-950 flex flex-col" dir="rtl">
      <div className="bg-white border-b border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 py-4">
        <div className="container-app flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-brand rounded-xl flex items-center justify-center">
              <span className="text-white font-black">م</span>
            </div>
            <span className="font-black text-brand-dark dark:text-zinc-50 text-lg">مقدار</span>
          </Link>
          <Link href="/register" className="btn-ghost text-sm">ليس لديك حساب؟ سجل الآن</Link>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-brand rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-brand">
              <span className="text-white font-black text-3xl">م</span>
            </div>
            <h1 className="text-2xl font-black text-brand-dark dark:text-zinc-50">مرحباً بعودتك!</h1>
            <p className="text-text-muted dark:text-zinc-400 text-sm mt-1">سجل دخولك للوصول إلى لوحة تحكمك</p>
          </div>

          <div className="card p-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-4 font-medium">
                ⚠️ {error}
              </div>
            )}

            <div className="flex gap-2 p-1 bg-zinc-50 dark:bg-zinc-800 rounded-xl mb-6 border border-zinc-200/40 dark:border-zinc-700/40">
              <button
                type="button"
                onClick={() => { setIsStaffLogin(false); setError(""); }}
                className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${!isStaffLogin ? "bg-[#0B532B] text-white shadow-sm" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200"}`}
              >
                دخول المشتركين 👤
              </button>
              <button
                type="button"
                onClick={() => { setIsStaffLogin(true); setError(""); }}
                className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${isStaffLogin ? "bg-[#0B532B] text-white shadow-sm" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200"}`}
              >
                دخول الطباخ / الموظفين 🔑
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isStaffLogin ? (
                <>
                  <div>
                    <label className="label-field">رقم الجوال</label>
                    <input
                      id="login-phone"
                      className="input-field"
                      placeholder="05XXXXXXXX"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      maxLength={10}
                      autoComplete="tel"
                    />
                  </div>
                  <div>
                    <label className="label-field">كلمة المرور</label>
                    <input
                      id="login-password"
                      type="password"
                      className="input-field"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      autoComplete="current-password"
                    />
                    <div className="text-left mt-2">
                      <Link href="/forgot-password" className="text-[#54A354] dark:text-[#7BC142] hover:text-[#54A354]/80 transition-colors text-sm font-medium">
                        نسيت كلمة المرور؟
                      </Link>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <label className="label-field text-center block font-bold">رمز الدخول الخاص (PIN / Passcode)</label>
                  <input
                    id="staff-pin"
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={staffPin}
                    onChange={(e) => setStaffPin(e.target.value.replace(/\D/g, ""))}
                    className="w-full text-center tracking-[1em] text-2xl font-black p-3.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#0B532B] dark:focus:ring-[#76C139] text-[#0B532B] dark:text-[#76C139]"
                    autoComplete="off"
                  />
                  <p className="text-[10px] text-center text-text-muted dark:text-zinc-500">
                    أدخل رمز الدخول المكون من 4 أرقام المخصص لك كطباخ أو موظف
                  </p>
                </div>
              )}

              <button id="login-submit" type="submit" className="btn-primary w-full mt-2" disabled={loading}>
                {loading ? <><span className="spinner" /> <span>جاري الدخول...</span></> : (isStaffLogin ? "تسجيل دخول الموظف →" : "تسجيل الدخول →")}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-zinc-800 text-center">
              <p className="text-sm text-text-muted dark:text-zinc-400">
                ليس لديك حساب؟{" "}
                <Link href="/register" className="text-brand-dark dark:text-brand-light font-bold hover:underline">
                  أنشئ حسابك مجاناً
                </Link>
              </p>
            </div>
          </div>

          {/* Demo hint */}
          <div className="mt-4 text-center">
            <p className="text-xs text-text-muted dark:text-zinc-400">
              🔐 بياناتك آمنة ومشفرة بالكامل
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ phone: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.phone || !form.password) { setError("أدخل رقم الجوال وكلمة المرور"); return; }
    setLoading(true);
    setError("");
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
    <div className="min-h-screen bg-surface-subtle flex flex-col" dir="rtl">
      <div className="bg-white border-b border-gray-100 py-4">
        <div className="container-app flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-brand rounded-xl flex items-center justify-center">
              <span className="text-white font-black">م</span>
            </div>
            <span className="font-black text-brand-dark text-lg">مقدار</span>
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
            <h1 className="text-2xl font-black text-brand-dark">مرحباً بعودتك!</h1>
            <p className="text-text-muted text-sm mt-1">سجل دخولك للوصول إلى لوحة تحكمك</p>
          </div>

          <div className="card p-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-4 font-medium">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
              </div>

              <button id="login-submit" type="submit" className="btn-primary w-full mt-2" disabled={loading}>
                {loading ? <><span className="spinner" /> <span>جاري الدخول...</span></> : "تسجيل الدخول →"}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-text-muted">
                ليس لديك حساب؟{" "}
                <Link href="/register" className="text-brand-dark font-bold hover:underline">
                  أنشئ حسابك مجاناً
                </Link>
              </p>
            </div>
          </div>

          {/* Demo hint */}
          <div className="mt-4 text-center">
            <p className="text-xs text-text-muted">
              🔐 بياناتك آمنة ومشفرة بالكامل
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

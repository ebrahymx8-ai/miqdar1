"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") || "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ password: "", confirmPassword: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.password || !form.confirmPassword) {
      setError("يرجى تعبئة جميع الحقول");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("كلمات المرور غير متطابقة");
      return;
    }
    if (form.password.length < 6) {
      setError("يجب أن تتكون كلمة المرور من 6 خانات على الأقل");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          password: form.password,
          confirmPassword: form.confirmPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "حدث خطأ أثناء إعادة تعيين كلمة المرور");
        setLoading(false);
        return;
      }

      setSuccess("تم تغيير كلمة المرور بنجاح! جاري تحويلك لصفحة تسجيل الدخول...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch {
      setError("خطأ في الاتصال بالخادم");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-transparent">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-brand rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-brand">
          <span className="text-white font-black text-3xl">م</span>
        </div>
        <h1 className="text-2xl font-black text-brand-dark dark:text-zinc-50 text-center">تعيين كلمة المرور الجديدة</h1>
        <p className="text-text-muted dark:text-zinc-400 text-sm mt-1">أدخل كلمة المرور الجديدة لتتمكن من تسجيل الدخول لحسابك</p>
      </div>

      <div className="card p-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-4 font-medium">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl p-3 mb-4 font-medium">
            ✅ {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-field">كلمة المرور الجديدة</label>
            <input
              id="reset-password"
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="label-field">تأكيد كلمة المرور</label>
            <input
              id="reset-confirm-password"
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              autoComplete="new-password"
            />
          </div>

          <button id="reset-submit" type="submit" className="btn-primary w-full mt-4" disabled={loading}>
            {loading ? <><span className="spinner" /> <span>جاري الحفظ...</span></> : "حفظ كلمة المرور →"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-zinc-800 text-center">
          <Link href="/login" className="text-brand-dark dark:text-brand-light font-bold hover:underline text-sm">
            إلغاء والعودة لتسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPage() {
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
          <Link href="/login" className="btn-ghost text-sm">العودة لتسجيل الدخول</Link>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <Suspense fallback={<div className="text-center"><span className="spinner border-brand-dark" /></div>}>
          <ResetContent />
        </Suspense>
      </div>
    </div>
  );
}

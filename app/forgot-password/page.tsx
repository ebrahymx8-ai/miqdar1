"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      setError("أدخل رقم الجوال أولاً");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "فشل في إرسال التعليمات، يرجى التحقق من الرقم");
        setLoading(false);
        return;
      }
      
      setSuccess("تم إرسال رمز استعادة كلمة المرور إلى جوالك بنجاح. جاري التحويل...");
      setTimeout(() => {
        router.push(`/forgot-password/verify?phone=${encodeURIComponent(phone)}`);
      }, 1500);
    } catch {
      setError("خطأ في الاتصال بالخادم");
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
          <Link href="/login" className="btn-ghost text-sm">العودة لتسجيل الدخول</Link>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-brand rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-brand">
              <span className="text-white font-black text-3xl">م</span>
            </div>
            <h1 className="text-2xl font-black text-brand-dark dark:text-zinc-50">استعادة كلمة المرور</h1>
            <p className="text-text-muted dark:text-zinc-400 text-sm mt-1">أدخل رقم جوالك المسجل وسنرسل لك رمزاً لإعادة تعيين كلمة المرور</p>
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
                <label className="label-field">رقم الجوال</label>
                <input
                  id="forgot-phone"
                  className="input-field"
                  placeholder="05XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={10}
                  autoComplete="tel"
                />
              </div>

              <button id="forgot-submit" type="submit" className="btn-primary w-full mt-2" disabled={loading}>
                {loading ? <><span className="spinner" /> <span>جاري الإرسال...</span></> : "إرسال رمز التحقق ←"}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-zinc-800 text-center">
              <p className="text-sm text-text-muted dark:text-zinc-400">
                تذكرت كلمة المرور؟{" "}
                <Link href="/login" className="text-brand-dark dark:text-brand-light font-bold hover:underline">
                  تسجيل الدخول
                </Link>
              </p>
            </div>
          </div>

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

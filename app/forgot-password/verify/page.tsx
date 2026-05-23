"use client";
import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") || "";
  
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [timer, setTimer] = useState(59);
  const [canResend, setCanResend] = useState(false);
  
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Count down timer
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  // Handle typing inside an input
  const handleChange = (value: string, index: number) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1); // Only keep the last character
    setCode(newCode);
    setError("");

    // Auto-focus next input if a value is typed
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  // Handle backspace or navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!code[index] && index > 0) {
        // Focus previous input on backspace if current is empty
        inputsRef.current[index - 1]?.focus();
      }
    }
  };

  // Handle paste support
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim();
    if (pasteData.length === 6 && /^\d+$/.test(pasteData)) {
      const newCode = pasteData.split("");
      setCode(newCode);
      inputsRef.current[5]?.focus();
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (res.ok) {
        setSuccess("تم إعادة إرسال رمز التحقق بنجاح");
        setTimer(59);
        setCanResend(false);
      } else {
        const data = await res.json();
        setError(data.error || "فشل إعادة الإرسال");
      }
    } catch {
      setError("خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length < 6) {
      setError("يرجى إدخال الرمز المكون من 6 أرقام كاملاً");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: fullCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "رمز التحقق غير صحيح");
        setLoading(false);
        return;
      }

      setSuccess("تم التحقق من الرمز بنجاح. جاري التحويل لتعيين كلمة مرور جديدة...");
      setTimeout(() => {
        router.push(`/forgot-password/reset?phone=${encodeURIComponent(phone)}&code=${encodeURIComponent(fullCode)}`);
      }, 1500);
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
        <h1 className="text-2xl font-black text-brand-dark dark:text-zinc-50 text-center">أدخل رمز التحقق</h1>
        <p className="text-text-muted dark:text-zinc-400 text-sm mt-1">
          تم إرسال رمز التحقق إلى الجوال: <span className="font-bold tracking-wider text-brand-dark dark:text-brand-light" style={{ direction: "ltr", display: "inline-block" }}>{phone || "غير معروف"}</span>
        </p>
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="label-field text-center mb-4 block">رمز التحقق (6 أرقام)</label>
            <div className="flex gap-2 justify-center" style={{ direction: 'ltr' }}>
              {code.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputsRef.current[idx] = el;
                  }}
                  id={`otp-${idx}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  className="w-11 h-14 text-center text-xl font-bold border border-gray-200 rounded-xl focus:border-brand-dark focus:ring-2 focus:ring-brand-dark/10 outline-none transition-all dark:bg-zinc-900 dark:border-zinc-800 dark:text-brand-light dark:focus:border-brand-light dark:focus:ring-brand-light/10"
                  value={digit}
                  onChange={(e) => handleChange(e.target.value, idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  onPaste={idx === 0 ? handlePaste : undefined}
                  autoComplete="one-time-code"
                />
              ))}
            </div>
          </div>

          <button id="verify-submit" type="submit" className="btn-primary w-full mt-2" disabled={loading}>
            {loading ? <><span className="spinner" /> <span>جاري التحقق...</span></> : "التحقق والاستمرار ←"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-zinc-800 text-center">
          {canResend ? (
            <button
              onClick={handleResend}
              className="text-brand-dark dark:text-brand-light font-bold hover:underline bg-transparent border-none cursor-pointer text-sm"
              disabled={loading}
            >
              إعادة إرسال رمز التحقق
            </button>
          ) : (
            <p className="text-sm text-text-muted dark:text-zinc-400">
              إعادة إرسال الرمز خلال <span className="font-bold text-brand-dark dark:text-brand-light">{timer}</span> ثانية
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
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
          <VerifyContent />
        </Suspense>
      </div>
    </div>
  );
}

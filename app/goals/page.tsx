import { Suspense } from "react";
import GoalsContent from "./GoalsContent";

export default function GoalsPage() {
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
      <GoalsContent />
    </Suspense>
  );
}

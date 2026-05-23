"use client";
import { useState } from "react";
import Link from "next/link";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", contact: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.contact || !form.message) {
      showToast("⚠️ يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showToast("🎉 تم إرسال رسالتك بنجاح! سيتواصل معك فريق مقدار قريباً.");
      setForm({ name: "", contact: "", subject: "", message: "" });
    }, 1200);
  };

  const contactMethods = [
    {
      title: "تواصل سريع عبر واتساب",
      desc: "راسلنا مباشرة وسيقوم أحد ممثلي الخدمة بالرد عليك فوراً",
      val: "0541688135",
      link: "https://wa.me/966541688135",
      icon: (
        <svg className="w-6 h-6 fill-current text-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.463h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
      color: "from-emerald-600 to-green-500 shadow-emerald-500/20",
    },
    {
      title: "اتصال هاتفي مباشر",
      desc: "اتصل بنا هاتفياً للاستفسارات السريعة أو تعديلات الاشتراكات",
      val: "0541688135",
      link: "tel:0541688135",
      icon: (
        <svg className="w-6 h-6 fill-none stroke-current text-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
        </svg>
      ),
      color: "from-brand-dark to-brand-light shadow-brand/20",
    },
    {
      title: "حسابنا على إنستغرام",
      desc: "تابع وجباتنا اليومية، آراء عملائنا، والنصائح الغذائية المستمرة",
      val: "@miq_dar1",
      link: "https://instagram.com/miq_dar1",
      icon: (
        <svg className="w-6 h-6 fill-none stroke-current text-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
        </svg>
      ),
      color: "from-pink-600 to-purple-500 shadow-pink-500/20",
    },
    {
      title: "حسابنا على تيك توك",
      desc: "شاهد خلف الكواليس وتجهيز الوجبات الطازجة يومياً في مطابخنا",
      val: "@miq_dar1",
      link: "https://tiktok.com/@miq_dar1",
      icon: (
        <svg className="w-6 h-6 fill-current text-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-3.94-1.74-.22-.2-.42-.43-.61-.67-.02 3.48-.01 6.96-.02 10.43-.07 1.48-.52 2.97-1.44 4.1-1.37 1.74-3.69 2.76-5.91 2.82-2.2-.02-4.42-.99-5.75-2.73-1.43-1.8-1.78-4.36-1.02-6.52.68-1.99 2.4-3.63 4.49-4.14.34-.09.7-.14 1.05-.17V12c-.22.02-.45.04-.67.09-1.35.25-2.61 1.08-3.35 2.24-.9 1.36-1.04 3.17-.46 4.69.5 1.39 1.69 2.51 3.14 2.87 1.25.32 2.64.08 3.66-.72.93-.72 1.44-1.84 1.53-3.02.01-4.41.01-8.82.02-13.23l-.04-.04c-.15.08-.32.16-.49.23-1.37.52-2.88.35-4.1-.4-.68-.41-1.21-1.03-1.51-1.76V.02z"/>
        </svg>
      ),
      color: "from-gray-900 to-gray-700 shadow-gray-700/20",
    },
  ];

  return (
    <div className="min-h-screen bg-surface-subtle dark:bg-zinc-950 flex flex-col" dir="rtl">
      {toast && (
        <div className="toast" style={{ maxWidth: "90vw", textAlign: "center" }}>{toast}</div>
      )}

      {/* Navigation */}
      <div className="bg-white border-b border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 py-4 sticky top-0 z-40">
        <div className="container-app flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-brand rounded-xl flex items-center justify-center">
              <span className="text-white font-black">م</span>
            </div>
            <span className="font-black text-brand-dark dark:text-zinc-50 text-lg">مقدار</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="btn-ghost text-sm">الرئيسية</Link>
            <Link href="/dashboard" className="btn-outline text-sm px-4 py-2">لوحة التحكم</Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container-app py-12 md:py-20 relative">
        <div className="bg-dots absolute inset-0 pointer-events-none opacity-40" />

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-12 page-enter">
            <div className="badge-green mb-3">💬 يسعدنا سماع صوتك</div>
            <h1 className="section-title text-3xl md:text-4xl text-brand-dark dark:text-zinc-50">اتصل بنا</h1>
            <p className="section-subtitle max-w-lg mx-auto dark:text-zinc-400">
              فريق مقدار جاهز للرد على استفساراتك وتلبية احتياجاتك بأسرع وقت ممكن
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Contact Methods List */}
            <div className="space-y-4 page-enter" style={{ animationDelay: "0.1s" }}>
              {contactMethods.map((c) => (
                <a
                  key={c.title}
                  href={c.link}
                  target={c.link.startsWith("http") ? "_blank" : undefined}
                  rel={c.link.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="card p-5 flex gap-4 text-right border border-gray-100 dark:border-zinc-800 hover:shadow-card-hover group items-center transition-all bg-white dark:bg-zinc-900"
                >
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${c.color} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-md`}>
                    {c.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-brand-dark dark:text-zinc-50 text-base">{c.title}</h3>
                    <p className="text-xs text-text-muted dark:text-zinc-400 mt-0.5 leading-relaxed">{c.desc}</p>
                    <div className="font-mono text-brand-orange text-sm font-bold mt-1" dir="ltr">{c.val}</div>
                  </div>
                  <div className="text-brand-light font-bold text-lg opacity-40 group-hover:opacity-100 group-hover:translate-x-[-4px] transition-all">
                    ←
                  </div>
                </a>
              ))}
            </div>

            {/* Message Form */}
            <div className="card p-8 bg-white dark:bg-zinc-900 dark:border-zinc-800 page-enter" style={{ animationDelay: "0.2s" }}>
              <h2 className="text-lg font-black text-brand-dark dark:text-zinc-50 mb-4">أرسل لنا رسالة مباشرة ✉️</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label-field">الاسم الكامل *</label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    className="input-field"
                    placeholder="مثال: خالد العتيبي"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label-field">البريد الإلكتروني أو الجوال *</label>
                  <input
                    id="contact-info"
                    type="text"
                    required
                    className="input-field"
                    placeholder="example@mail.com أو 05XXXXXXXX"
                    value={form.contact}
                    onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label-field">الموضوع (اختياري)</label>
                  <input
                    id="contact-subject"
                    type="text"
                    className="input-field"
                    placeholder="عن ماذا تود الاستفسار؟"
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label-field">الرسالة *</label>
                  <textarea
                    id="contact-message"
                    required
                    rows={4}
                    className="input-field resize-none py-3"
                    placeholder="اكتب رسالتك أو استفسارك هنا بالتفصيل..."
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  />
                </div>
                <button
                  id="contact-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="btn-orange w-full py-4 text-base mt-2"
                >
                  {loading ? (
                    <><span className="spinner" /> <span>جاري الإرسال...</span></>
                  ) : (
                    "إرسال الرسالة ←"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Small Simple Footer */}
      <footer className="bg-brand-dark text-white/50 text-center py-6 text-sm border-t border-brand-light/10">
        <div className="container-app">
          <div>© {new Date().getFullYear()} مقدار للوجبات الصحية. جميع الحقوق محفوظة.</div>
        </div>
      </footer>
    </div>
  );
}

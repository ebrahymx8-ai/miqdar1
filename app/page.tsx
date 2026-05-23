"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

const renderStars = (rating: number, id: number, isMobile: boolean = false) => {
  const size = isMobile ? "w-4 h-4" : "w-5 h-5";
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;

  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      stars.push(
        <svg key={i} className={`${size} text-amber-400`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    } else if (i === fullStars + 1 && hasHalf) {
      stars.push(
        <svg key={i} className={`${size}`} viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`starGradient-${id}-${i}`}>
              <stop offset="50%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="#e5e7eb" />
            </linearGradient>
          </defs>
          <path fill={`url(#starGradient-${id}-${i})`} d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    } else {
      stars.push(
        <svg key={i} className={`${size} text-gray-200`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
  }
  return <div className="flex items-center gap-0.5">{stars}</div>;
};

const testimonials = [
  {
    id: 1,
    name: "أبو حمد",
    city: "مكة المكرمة",
    target: "تنشيف",
    rating: 5,
    text: "الدجاج نظيف ومو زفر أبدًا."
  },
  {
    id: 2,
    name: "سارة الحربي",
    city: "مكة المكرمة",
    target: "حياة يومية",
    rating: 4.5,
    text: "تجميد ممتاز ويفك أزمة."
  },
  {
    id: 3,
    name: "عبدالعزيز العتيبي",
    city: "مكة المكرمة",
    target: "تضخيم",
    rating: 4,
    text: "الماكروز مضبوطة بس ليت تنوعون الصوصات."
  },
  {
    id: 4,
    name: "أميرة الغامدي",
    city: "مكة المكرمة",
    target: "تنشيف",
    rating: 4.5,
    text: "بطل وسريع ويوصل مبرد."
  },
  {
    id: 5,
    name: "فيصل بن سلمان",
    city: "مكة المكرمة",
    target: "حياة يومية",
    rating: 4,
    text: "دايت بدون حرمان ولذيذ."
  },
  {
    id: 6,
    name: "رنا عبدالله",
    city: "مكة المكرمة",
    target: "تنشيف",
    rating: 5,
    text: "دجاج نظيف ويبيض الوجه."
  },
  {
    id: 7,
    name: "خالد الدوسري",
    city: "مكة المكرمة",
    target: "تضخيم",
    rating: 4.5,
    text: "تجميد ذكي وسهل الاستخدام."
  },
  {
    id: 8,
    name: "نورة السديري",
    city: "مكة المكرمة",
    target: "حياة يومية",
    rating: 4,
    text: "يفك أزمة لطلاب الجامعة."
  },
  {
    id: 9,
    name: "سلطان العتيبي",
    city: "مكة المكرمة",
    target: "تضخيم",
    rating: 4.5,
    text: "الماكروز مضبوطة والدجاج نظيف."
  },
  {
    id: 10,
    name: "هدى البقمي",
    city: "مكة المكرمة",
    target: "تنشيف",
    rating: 4,
    text: "يختصر وقت والنتائج خرافية."
  },
  {
    id: 11,
    name: "محمد الفهمي",
    city: "مكة المكرمة",
    target: "حياة يومية",
    rating: 4.5,
    text: "توصيل دقيق والوجبات مرتبة."
  },
  {
    id: 12,
    name: "أريج الشريف",
    city: "مكة المكرمة",
    target: "تنشيف",
    rating: 5,
    text: "أكل يجنن ويفك أزمة."
  },
  {
    id: 13,
    name: "فهد العنزي",
    city: "مكة المكرمة",
    target: "تضخيم",
    rating: 3,
    text: "الماكروز مضبوطة بس التوصيل تأخر شوي."
  },
  {
    id: 14,
    name: "منى القحطاني",
    city: "مكة المكرمة",
    target: "حياة يومية",
    rating: 4.5,
    text: "تغليف محكم ونظافة تامة."
  },
  {
    id: 15,
    name: "عبدالرحمن الشهري",
    city: "مكة المكرمة",
    target: "تنشيف",
    rating: 4,
    text: "دجاجهم مو زفر واللحم ممتاز."
  },
  {
    id: 16,
    name: "سماح الخالدي",
    city: "مكة المكرمة",
    target: "حياة يومية",
    rating: 4.5,
    text: "تجميد ممتاز وأكل فنان."
  },
  {
    id: 17,
    name: "سعد المطيري",
    city: "مكة المكرمة",
    target: "تضخيم",
    rating: 4,
    text: "يختصر وقت التحضير والطبخ."
  },
  {
    id: 18,
    name: "ريم السالم",
    city: "مكة المكرمة",
    target: "تنشيف",
    rating: 5,
    text: "دايت بدون حرمان والطعم لذيذ."
  },
  {
    id: 19,
    name: "بندر عسيري",
    city: "مكة المكرمة",
    target: "حياة يومية",
    rating: 3,
    text: "الأكل حلو بس ياليت الخيارات أكثر."
  },
  {
    id: 20,
    name: "لولوة الخاطر",
    city: "مكة المكرمة",
    target: "تنشيف",
    rating: 4.5,
    text: "الماكروز مضبوطة وتوصيلهم سريع."
  },
  {
    id: 21,
    name: "يزيد السهلي",
    city: "مكة المكرمة",
    target: "تضخيم",
    rating: 4,
    text: "وجبات مشبعة والبروتين ممتاز."
  },
  {
    id: 22,
    name: "شروق الحربي",
    city: "مكة المكرمة",
    target: "حياة يومية",
    rating: 4.5,
    text: "نظيف ولذيذ ويختصر وقت."
  },
  {
    id: 23,
    name: "مشعل العتيبي",
    city: "مكة المكرمة",
    target: "تنشيف",
    rating: 3,
    text: "الطعم عادي بس الماكروز مضبوطة."
  },
  {
    id: 24,
    name: "نجلاء السليم",
    city: "مكة المكرمة",
    target: "حياة يومية",
    rating: 4.5,
    text: "توصيل سريع وتجميد بطل."
  },
  {
    id: 25,
    name: "طارق الغامدي",
    city: "مكة المكرمة",
    target: "تضخيم",
    rating: 5,
    text: "بطل وسريع ويبيض الوجه."
  }
];;

export default function HomePage() {
  const [timeLeft, setTimeLeft] = useState({ hours: 3, minutes: 47, seconds: 22 });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState<any>(null);
  const [selectedTestimonialFilter, setSelectedTestimonialFilter] = useState("الكل");
  const [visibleTestimonialsCount, setVisibleTestimonialsCount] = useState(6);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("miqdar-theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const faqs = [
    {
      q: "كيف تصلني الوجبات؟",
      a: "تصلك الوجبات مجهزة ومجمدة تجميداً ذكياً يحافظ على كامل قيمتها الغذائية ونظافتها، وتُشحن عبر سياراتنا المبردة مباشرة إلى باب بيتك في مكة."
    },
    {
      q: "هل أقدر أوقف الاشتراك مؤقتاً؟",
      a: "نعم بكل تأكيد، يمكنك إيقاف أو تفعيل اشتراكك مرناً حسب ظروف سفرك أو انشغالك بالتنسيق مع الدعم الفني."
    },
    {
      q: "كيف يتم حساب الماكروز والسعرات؟",
      a: "نعتمد على معادلات علمية دقيقة (BMR + TDEE) مدمجة في حاسبتنا الذكية لتفصيل غرامات البروتين والكارب والدهون المناسبة تماماً لهدف جسمك."
    },
    {
      q: "هل الدجاج واللحوم طازجة؟",
      a: "نعم، نلتزم في مقدار باستخدام جودات عالية ومصادر محلية طازجة ونظيفة 100% وخالية من أي زفر."
    }
  ];

  const filteredTestimonials = selectedTestimonialFilter === "الكل"
    ? testimonials
    : testimonials.filter((t) => t.target === selectedTestimonialFilter);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) { hours = 3; minutes = 59; seconds = 59; }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");

  const goals = [
    { 
      icon: "💪", 
      name: "التضخيم", 
      path: "/goals/bulk", 
      desc: "بناء العضلات وزيادة الكتلة العضلية بفائض سعرات مدروس", 
      color: "from-green-50 to-green-100", 
      border: "border-brand-dark", 
      badge: "الأكثر طلباً",
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80" 
    },
    { 
      icon: "🔥", 
      name: "التنشيف", 
      path: "/goals/cut", 
      desc: "حرق الدهون وإظهار التفاصيل العضلية بعجز سعرات مناسب", 
      color: "from-orange-50 to-orange-100", 
      border: "border-brand-orange", 
      badge: "مميز",
      image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80" 
    },
    { 
      icon: "⚖️", 
      name: "الحياة اليومية", 
      path: "/goals/maintain", 
      desc: "الحفاظ على الوزن والتمتع بصحة متوازنة يومياً", 
      color: "from-lime-50 to-lime-100", 
      border: "border-brand-light", 
      badge: "",
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80" 
    },
  ];

  const features = [
    {
      icon: "🧮",
      title: "حسابات دقيقة 100%",
      shortDesc: "نحسب احتياجك الفسيولوجي بمعادلات علمية معتمدة.",
      desc: "نعتمد على معادلات Mifflin-St Jeor و BMR + TDEE الحسابية المعتمدة عالمياً لتحديد احتياج جسمك الفعلي من السعرات الحرارية بدقة تامة بناءً على طولك، وزنك، عمرك، ونشاطك اليومي لضمان تحقيق هدفك الصحي.",
      linkText: "🧮 احسب سعراتك الآن مجاناً",
      linkUrl: "/calculator"
    },
    {
      icon: "🥗",
      title: "وجبتان + سناك يومياً",
      shortDesc: "وجبات طازجة ومتنوعة مُحضَّرة يومياً بمكونات فاخرة.",
      desc: "نقدم لك وجبتين رئيسيتين (غداء وعشاء) غنية بالبروتين والكربوهيدرات النظيفة بالإضافة إلى سناك صحي يومي. يتم إعداد وجباتنا طازجة كل صباح باستخدام لحوم وخضروات طازجة 100% دون زيوت مكررة أو مواد حافظة.",
      linkText: "💳 استكشف الباقات والأسعار",
      linkUrl: "/calculator"
    },
    {
      icon: "❄️",
      title: "تجميد ذكي",
      shortDesc: "جمّد اشتراكك في أي وقت ولا تخسر يوماً واحداً.",
      desc: "سواء كنت مسافراً، متعباً، أو ترغب في الاستراحة، يتيح لك نظام التجميد الذكي إيقاف اشتراكك مؤقتاً بكبسة زر من لوحة التحكم الخاصة بك. الأيام المجمدة لا تضيع عليك ويتم تمديد تاريخ انتهاء اشتراكك تلقائياً.",
      linkText: "🔑 سجل الدخول للتحكم باشتراكك",
      linkUrl: "/login"
    },
    {
      icon: "📊",
      title: "لوحة تحكم شخصية",
      shortDesc: "تابع اشتراكك وسعراتك وجدول وجباتك من مكان واحد.",
      desc: "من خلال لوحة تحكم مقدار المخصصة لك، يمكنك تتبع عدد الأيام المتبقية في اشتراكك، وتفعيل التجميد أو استئناف الاشتراك، ومراجعة تفاصيل نسب الماكروز اليومية وسجل فواتيرك بكل يسر وسهولة.",
      linkText: "📊 انتقل إلى لوحة التحكم",
      linkUrl: "/dashboard"
    },
    {
      icon: "🚴",
      title: "توصيل يومي مرن",
      shortDesc: "توصيل لباب بيتك في الوقت المحدد لضمان الطزاجة.",
      desc: "يمتلك مقدار أسطول توصيل مخصص يضمن وصول وجباتك اليومية مبردة وطازجة لباب منزلك أو مقر عملك في الوقت المفضل لديك يومياً لتبقى الوجبات محتفظة بقيمتها الغذائية ومذاقها الرائع.",
      linkText: "🧮 احسب سعراتك وابدأ الآن",
      linkUrl: "/calculator"
    },
    {
      icon: "💬",
      title: "دعم فني فوري",
      shortDesc: "فريق دعم متكامل جاهز لمساعدتك عبر الواتساب.",
      desc: "فريق خدمة العملاء وأخصائيو التغذية لدينا متواجدون لمساعدتك والإجابة على استفساراتك حول الوجبات، تعديل نسب السعرات، أو تغيير أوقات التوصيل مباشرة عبر الواتساب والاتصال على مدار الساعة.",
      linkText: "💬 تواصل مع الدعم الآن",
      linkUrl: "https://wa.me/966541688135"
    },
  ];

  const steps = [
    { n: "01", title: "احسب سعراتك", desc: "أدخل بياناتك واحصل على خطتك الغذائية الشخصية" },
    { n: "02", title: "اختر هدفك وباقتك", desc: "تضخيم، تنشيف، أو محافظة - مع اختيار نوع المنيو" },
    { n: "03", title: "أكمل الاشتراك", desc: "ادفع بأمان وابدأ رحلتك الصحية في نفس اليوم" },
  ];

  return (
    <div className="min-h-screen bg-surface-subtle dark:bg-zinc-950 dark:text-zinc-50 transition-colors duration-300" dir="rtl">

      {/* ===== شريط الإلحاح ===== */}
      <div className="urgency-banner">
        <span>⚡ عرض محدود: اشترك اليوم واحصل على خصم إضافي 5% مع كود </span>
        <span className="font-mono bg-white/20 px-2 py-0.5 rounded mx-1 text-sm">MIQDAR5</span>
        <span> — ينتهي خلال: </span>
        <span className="font-mono font-bold text-brand-cream">
          {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
        </span>
      </div>

      {/* ===== Navigation ===== */}
      <nav className="glass sticky top-0 z-50 border-b border-brand-light/10 dark:bg-zinc-950/80 dark:border-zinc-800">
        <div className="container-app flex items-center justify-between h-16">
          {/* Logo Text */}
          <Link href="/" className="flex items-center gap-1.5 flex-shrink-0 group transition-all duration-300 hover:scale-[1.03]">
            <span className="font-black text-2xl text-brand-dark dark:text-brand-light">مقدار</span>
            <span className="font-light text-xl text-gray-300 dark:text-white/20">|</span>
            <span className="font-extrabold text-2xl text-brand-orange tracking-tight">Miqdar</span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-text-secondary dark:text-zinc-400">
            <Link href="#faq" className="hover:text-brand-dark dark:hover:text-brand-light transition-colors">الأسئلة الشائعة</Link>
            <Link href="#goals" className="hover:text-brand-dark dark:hover:text-brand-light transition-colors">الأهداف</Link>
            <Link href="#how" className="hover:text-brand-dark dark:hover:text-brand-light transition-colors">كيف نعمل؟</Link>
            <Link href="#features" className="hover:text-brand-dark dark:hover:text-brand-light transition-colors">مميزاتنا</Link>
            <Link href="/contact" className="hover:text-brand-dark dark:hover:text-brand-light transition-colors">اتصل بنا</Link>
          </div>

          {/* CTA Desktop */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-surface-muted hover:bg-brand-cream/40 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-brand-dark dark:text-brand-orange transition-all duration-300 cursor-pointer"
              aria-label="Toggle Theme"
            >
              {theme === "light" ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              )}
            </button>
            <Link href="/login" className="btn-ghost dark:text-white dark:hover:bg-white/5">دخول</Link>
            <Link href="/register" className="btn-primary text-sm px-4 py-2">ابدأ الآن →</Link>
          </div>

          {/* Mobile Actions (Toggle + Hamburger) */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Theme Toggle Button Mobile */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-surface-muted hover:bg-brand-cream/40 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-brand-dark dark:text-brand-orange transition-all duration-300 cursor-pointer"
              aria-label="Toggle Theme"
            >
              {theme === "light" ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              )}
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-brand-dark dark:text-white focus:outline-none"
              aria-label="Toggle Menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden glass border-t border-brand-light/10 dark:bg-zinc-950 dark:border-zinc-800 animate-fade-in absolute top-16 left-0 right-0 py-4 px-6 flex flex-col gap-4 shadow-lg z-50">
            <Link
              href="#faq"
              onClick={() => setIsMenuOpen(false)}
              className="text-text-secondary hover:text-brand-dark font-semibold py-2 border-b border-gray-100 dark:text-zinc-400 dark:hover:text-brand-light dark:border-zinc-800"
            >
              الأسئلة الشائعة
            </Link>
            <Link
              href="#goals"
              onClick={() => setIsMenuOpen(false)}
              className="text-text-secondary hover:text-brand-dark font-semibold py-2 border-b border-gray-50 dark:text-zinc-400 dark:hover:text-brand-light dark:border-zinc-800"
            >
              الأهداف
            </Link>
            <Link
              href="#how"
              onClick={() => setIsMenuOpen(false)}
              className="text-text-secondary hover:text-brand-dark font-semibold py-2 border-b border-gray-100 dark:text-zinc-400 dark:hover:text-brand-light dark:border-zinc-800"
            >
              كيف نعمل؟
            </Link>
            <Link
              href="#features"
              onClick={() => setIsMenuOpen(false)}
              className="text-text-secondary hover:text-brand-dark font-semibold py-2 border-b border-gray-100 dark:text-zinc-400 dark:hover:text-brand-light dark:border-zinc-800"
            >
              مميزاتنا
            </Link>
            <Link
              href="/contact"
              onClick={() => setIsMenuOpen(false)}
              className="text-text-secondary hover:text-brand-dark font-semibold py-2 border-b border-gray-100 dark:text-zinc-400 dark:hover:text-brand-light dark:border-zinc-800"
            >
              اتصل بنا
            </Link>
            <div className="flex flex-col gap-2 pt-2">
              <Link
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                className="btn-ghost justify-center py-2.5 dark:text-white dark:hover:bg-white/5"
              >
                دخول
              </Link>
              <Link
                href="/register"
                onClick={() => setIsMenuOpen(false)}
                className="btn-primary justify-center py-2.5"
              >
                ابدأ الآن →
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ===== Hero Section ===== */}
      <section className="relative overflow-hidden py-12 lg:py-20">
        <div className="absolute inset-0 bg-gradient-hero opacity-[0.03] pointer-events-none" />
        <div className="bg-dots absolute inset-0 pointer-events-none" />

        <div className="container-app relative z-10">
          <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto py-8">
            <div className="badge-green mb-6 w-fit">
              🌿 وجبات صحية محسوبة علمياً
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-brand-dark dark:text-zinc-50 leading-tight mb-8">
              وجباتك المحسوبة{" "}
              <span className="gradient-text">بدقة</span>
              <br />
              لتحقيق هدفك
            </h1>

            <div className="flex flex-col sm:flex-row gap-3 mb-8 justify-center w-full sm:w-auto">
              <Link href="/calculator" id="cta-calculator" className="btn-primary text-base px-8 py-4">
                🧮 احسب سعراتك مجاناً
              </Link>
              <Link href="/register" id="cta-subscribe" className="btn-orange text-base px-8 py-4">
                اشترك الآن
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 mt-4 justify-center">
              {[
                { val: "+500", label: "مشترك نشط" },
                { val: "100%", label: "دقة الحسابات" },
                { val: "4.9★", label: "تقييم العملاء" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl font-black text-brand-dark dark:text-brand-light">{s.val}</div>
                  <div className="text-sm text-text-muted dark:text-zinc-400">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* ===== Goals Section ===== */}
      <section id="goals" className="py-20 bg-white dark:bg-zinc-900 transition-colors duration-300">
        <div className="container-app">
          <div className="text-center mb-12">
            <div className="badge-green mx-auto mb-3 w-fit">اختر هدفك</div>
            <h2 className="section-title text-orange-600 dark:text-orange-500">ثلاثة أهداف، حسابات مختلفة</h2>
            <p className="section-subtitle dark:text-zinc-400 max-w-xl mx-auto">
              كل هدف له خطة سعرات ونسب ماكروز مخصصة محسوبة خصيصاً لجسمك
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 md:gap-6">
            {goals.map((g) => (
              <Link
                key={g.name}
                href={g.path}
                className={`card bg-gradient-to-br ${g.color} dark:from-slate-900/60 dark:to-slate-900/40 dark:border-zinc-800 dark:hover:border-brand-light/30 border ${g.border}/30 text-center flex flex-col items-center justify-between hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 group cursor-pointer no-underline overflow-hidden`}
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
                  <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm w-7 h-7 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs md:text-base shadow-sm">
                    {g.icon}
                  </div>
                </div>
                <div className="p-2 md:p-4 flex flex-col items-center justify-center flex-grow w-full">
                  <h3 className="text-xs md:text-lg font-black text-brand-dark dark:text-zinc-50 leading-tight">
                    {g.name}
                  </h3>
                  {g.badge && (
                    <div className="badge-orange text-[8px] md:text-xs px-1 md:px-2 py-0.5 mt-1 w-fit mx-auto select-none">
                      {g.badge}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/calculator" className="btn-primary px-10">
              اكتشف باقتك المناسبة →
            </Link>
          </div>
        </div>
      </section>

      {/* ===== How it works ===== */}
      <section id="how" className="py-20 bg-surface-subtle dark:bg-zinc-950 transition-colors duration-300">
        <div className="container-app">
          <div className="text-center mb-12">
            <div className="badge-green mx-auto mb-3 w-fit">سهل وسريع</div>
            <h2 className="section-title dark:text-zinc-50">ابدأ رحلتك في 3 خطوات</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 right-[16.5%] left-[16.5%] h-0.5 bg-gradient-to-l from-brand-light to-brand-dark opacity-20" />
            {steps.map((s, i) => (
              <div key={i} className="text-center relative page-enter" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="w-20 h-20 rounded-2xl bg-gradient-brand mx-auto mb-4 flex items-center justify-center shadow-brand">
                  <span className="text-white font-black text-2xl">{s.n}</span>
                </div>
                <h3 className="font-bold text-lg text-brand-dark dark:text-zinc-50 mb-2">{s.title}</h3>
                <p className="text-text-secondary dark:text-zinc-400 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Features ===== */}
      <section id="features" className="py-20 bg-white dark:bg-zinc-900 transition-colors duration-300">
        <div className="container-app">
          <div className="text-center mb-12">
            <div className="badge-green mx-auto mb-3 w-fit">لماذا نحن؟</div>
            <h2 className="section-title dark:text-zinc-50">كل ما تحتاجه في مكان واحد</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                onClick={() => setActiveFeature(f)}
                className="card p-4 md:p-6 flex flex-col justify-between cursor-pointer transition-all hover:-translate-y-1 hover:shadow-card-hover active:scale-[0.98] select-none text-right bg-white dark:bg-zinc-900 dark:border-zinc-800 border border-gray-100 group"
              >
                <div>
                  <div className="text-2xl md:text-3xl mb-2 md:mb-3 group-hover:scale-110 transition-transform w-fit">{f.icon}</div>
                  <h3 className="font-bold text-sm md:text-base text-brand-dark dark:text-zinc-50 mb-1 md:mb-2">{f.title}</h3>
                  <p className="text-text-secondary dark:text-zinc-400 text-xs leading-relaxed line-clamp-2 md:line-clamp-none">{f.shortDesc}</p>
                </div>
                <div className="text-[10px] md:text-xs font-bold text-brand-light mt-3 flex items-center gap-1 group-hover:text-brand-orange transition-colors">
                  <span>تفاصيل أكثر</span>
                  <span className="group-hover:translate-x-[-2px] transition-transform">←</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Pricing Preview ===== */}
      <section className="py-20 bg-gradient-hero text-white">
        <div className="container-app text-center">
          <div className="badge-green mb-4 mx-auto w-fit border border-white/20">باقتان لكل ميزانية</div>
          <h2 className="text-3xl md:text-4xl font-black mb-3">أسعار شفافة بلا رسوم خفية</h2>
          <p className="text-white/80 mb-10 max-w-lg mx-auto">اختر الباقة المناسبة لك، والتوصيل مشمول دائماً</p>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {[
              { 
                name: "الأساسية", 
                price: "999", 
                days: "26 يوماً", 
                meals: "وجبتان + سناك يومياً", 
                highlight: false,
                image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80" 
              },
              { 
                name: "المميزة", 
                price: "1,499", 
                days: "26 يوماً", 
                meals: "وجبتان + سناك (مكونات فاخرة)", 
                highlight: true,
                image: "https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&w=800&q=80" 
              },
            ].map((p) => (
              <div 
                key={p.name} 
                className={`rounded-2xl text-center overflow-hidden transition-all duration-300 group ${
                  p.highlight 
                    ? "bg-white text-brand-dark shadow-2xl scale-105 dark:bg-zinc-900 dark:text-white dark:border dark:border-brand-light/20" 
                    : "bg-brand-dark border border-white/10 text-white"
                }`}
              >
                <div className="relative w-full h-44 md:h-48 overflow-hidden">
                  <Image 
                    src={p.image} 
                    alt={p.name} 
                    fill 
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
                <div className="p-6 md:p-8">
                  <div className={`text-sm font-semibold mb-2 ${p.highlight ? "text-brand-orange" : "text-brand-light"}`}>
                    {p.highlight ? "⭐ الأكثر اختياراً" : "اقتصادية"}
                  </div>
                  <div className="font-black text-4xl mb-1">{p.price} <span className="text-lg font-semibold">ريال</span></div>
                  <div className={`text-sm mb-3 ${p.highlight ? "text-text-muted dark:text-zinc-400" : "text-white/70"}`}>لمدة {p.days} + 99 ر توصيل</div>
                  <div className={`text-sm font-medium mb-6 ${p.highlight ? "text-brand-dark dark:text-brand-light" : "text-white"}`}>{p.meals}</div>
                  <Link 
                    href="/calculator" 
                    className="btn-orange w-full justify-center"
                  >
                    ابدأ الآن
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ Section ===== */}
      <section id="faq" className="py-16 bg-white dark:bg-zinc-900 border-b border-gray-100/40 dark:border-zinc-800 transition-colors duration-300">
        <div className="container-app max-w-4xl">
          <div className="text-center mb-10">
            <div className="badge-orange mx-auto mb-3 w-fit">الأسئلة الشائعة</div>
            <h2 className="section-title dark:text-zinc-50">لديك استفسار؟ إجابات سريعة</h2>
            <p className="section-subtitle dark:text-zinc-400 max-w-xl mx-auto">
              كل ما تريد معرفته عن اشتراكات مقدار، جودة الطعام، والتوصيل المبرّد في مكة المكرمة
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="card bg-white dark:bg-zinc-900 border border-gray-100/80 dark:border-zinc-800 overflow-hidden transition-all duration-300 shadow-sm"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full p-5 text-right flex items-center justify-between gap-4 font-bold text-base md:text-lg text-brand-dark dark:text-brand-light focus:outline-none cursor-pointer select-none"
                    aria-expanded={isOpen}
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-brand-orange text-lg font-black">؟</span>
                      {faq.q}
                    </span>
                    <span className={`w-6 h-6 rounded-full bg-surface-muted dark:bg-zinc-900 flex items-center justify-center text-xs text-brand-dark dark:text-brand-light transition-transform duration-300 ${isOpen ? 'rotate-180 bg-brand-light/20 text-brand-dark font-black' : ''}`}>
                      {isOpen ? '▲' : '▼'}
                    </span>
                  </button>

                  <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 border-t border-gray-150/40 dark:border-zinc-800' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <p className="p-5 text-text-secondary dark:text-zinc-400 text-sm md:text-base leading-relaxed font-medium">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== Testimonials Section ===== */}
      <section className="py-20 bg-white border-y border-gray-150/40 overflow-hidden dark:bg-zinc-900 dark:border-zinc-800">
        <div className="container-app">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="badge-orange mb-3 mx-auto w-fit">💬 آراء عملائنا</div>
            <h2 className="section-title text-brand-dark dark:text-zinc-50">عائلة مقدار يتحدثون عن تجربتهم</h2>
            <p className="section-subtitle max-w-xl mx-auto dark:text-zinc-400">
              أكثر من 500 مشترك وصلوا لأهدافهم بمرونة وبدون حرمان. إليك بعض تقييماتهم الحقيقية:
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            {["الكل", "تنشيف", "تضخيم", "حياة يومية"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setSelectedTestimonialFilter(tab);
                  setVisibleTestimonialsCount(6); // reset expansion on filter change
                }}
                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all cursor-pointer select-none ${
                  selectedTestimonialFilter === tab
                    ? "bg-brand-dark text-white shadow-md scale-105 dark:bg-brand-light dark:text-zinc-950"
                    : "bg-surface-muted text-text-secondary border border-transparent hover:border-brand-light/30 hover:bg-brand-cream/40 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-brand-cream/10"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Desktop Grid Layout (hidden on mobile, visible on md and up) */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTestimonials.slice(0, visibleTestimonialsCount).map((item) => (
              <div key={item.id} className="card p-6 bg-white border border-gray-100/80 hover:-translate-y-1.5 hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between group dark:bg-zinc-900 dark:border-zinc-800">
                <div>
                  {/* Rating Stars */}
                  <div className="mb-3.5">
                    {renderStars(item.rating, item.id, false)}
                  </div>
                  {/* Review Text */}
                  <p className="text-text-secondary text-sm leading-relaxed mb-4 font-medium italic dark:text-zinc-400">
                    "{item.text}"
                  </p>
                </div>
                {/* Author Info */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto dark:border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${
                      item.target === "تضخيم" ? "from-green-500 to-brand-dark" :
                      item.target === "تنشيف" ? "from-brand-orange to-red-600" :
                      "from-brand-light to-brand-dark"
                    } flex items-center justify-center text-white font-black text-sm shadow-sm`}>
                      {item.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-brand-dark dark:text-zinc-50">{item.name}</h4>
                      <span className="text-[11px] text-text-muted dark:text-zinc-400">📍 {item.city}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    item.target === "تضخيم" ? "bg-green-50 text-brand-dark border border-brand-dark/20 dark:bg-green-950/30 dark:text-brand-light dark:border-brand-light/20" :
                    item.target === "تنشيف" ? "bg-orange-50 text-brand-orange border border-brand-orange/20 dark:bg-orange-950/30 dark:text-brand-orange dark:border-brand-orange/20" :
                    "bg-lime-50 text-lime-800 border border-lime-200/50 dark:bg-lime-950/30 dark:text-lime-400 dark:border-lime-900/30"
                  }`}>
                    اشتراك {item.target}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Show More Button */}
          {filteredTestimonials.length > visibleTestimonialsCount && (
            <div className="hidden md:flex justify-center mt-10">
              <button
                onClick={() => setVisibleTestimonialsCount((prev) => prev + 6)}
                className="btn-outline text-sm px-8 py-3.5 hover:bg-brand-orange hover:border-brand-orange hover:text-white font-semibold dark:border-brand-light dark:text-brand-light dark:hover:bg-brand-orange dark:hover:text-white dark:hover:border-brand-orange"
              >
                عرض المزيد من الآراء ({filteredTestimonials.length - visibleTestimonialsCount} متبقية)
              </button>
            </div>
          )}

          {/* Mobile Carousel / Horizontal Swiper Layout (visible on mobile, hidden on md) */}
          <div className="md:hidden">
            <div className="flex gap-4 overflow-x-auto pb-6 pt-2 scroll-snap-x snap-mandatory px-5 -mx-5 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
              {filteredTestimonials.map((item) => (
                <div
                  key={item.id}
                  className="snap-center shrink-0 w-[290px] card p-5 bg-white border border-gray-100 flex flex-col justify-between shadow-md animate-fade-in dark:bg-zinc-900 dark:border-zinc-800"
                >
                  <div>
                    <div className="mb-3">
                      {renderStars(item.rating, item.id, true)}
                    </div>
                    <p className="text-text-secondary text-xs leading-relaxed mb-4 font-medium italic line-clamp-4 dark:text-zinc-400">
                      "{item.text}"
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-3.5 border-t border-gray-50 mt-auto dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${
                        item.target === "تضخيم" ? "from-green-500 to-brand-dark" :
                        item.target === "تنشيف" ? "from-brand-orange to-red-600" :
                        "from-brand-light to-brand-dark"
                      } flex items-center justify-center text-white font-black text-xs shadow-sm`}>
                        {item.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-brand-dark dark:text-zinc-50">{item.name}</h4>
                        <span className="text-[10px] text-text-muted dark:text-zinc-400">📍 {item.city}</span>
                      </div>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      item.target === "تضخيم" ? "bg-green-50 text-brand-dark border border-brand-dark/20 dark:bg-green-950/30 dark:text-brand-light dark:border-brand-light/20" :
                      item.target === "تنشيف" ? "bg-orange-50 text-brand-orange border border-brand-orange/20 dark:bg-orange-950/30 dark:text-brand-orange dark:border-brand-orange/20" :
                      "bg-lime-50 text-lime-800 border border-lime-200/50 dark:bg-lime-950/30 dark:text-lime-400 dark:border-lime-900/30"
                    }`}>
                      {item.target}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {/* Scroll Indicator Hint */}
            <div className="text-center text-xs text-text-muted mt-2 animate-pulse-soft dark:text-zinc-400">
              ← اسحب لرؤية التقييمات ({filteredTestimonials.length}) →
            </div>
          </div>

        </div>
      </section>

      {/* ===== CTA Final ===== */}
      <section className="py-16 bg-surface-subtle dark:bg-zinc-950">
        <div className="container-app text-center">
          <h2 className="text-3xl font-black text-brand-dark dark:text-zinc-50 mb-3">مستعد تبدأ رحلتك الصحية؟</h2>
          <p className="text-text-secondary dark:text-zinc-400 mb-8">احسب سعراتك مجاناً وابدأ اليوم</p>
          <Link href="/calculator" id="final-cta" className="btn-primary px-12 py-4 text-lg">
            🧮 احسب سعراتي مجاناً
          </Link>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="bg-brand-dark text-white pt-16 pb-8 border-t border-brand-light/10">
        <div className="container-app">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
            {/* Column 1: Brand Info */}
            <div className="space-y-4 text-center md:text-right">
              {/* Logo Text */}
              <Link href="/" className="flex items-center gap-1.5 justify-center md:justify-start group transition-all duration-300 hover:scale-[1.03] w-fit mx-auto md:mx-0">
                <span className="font-black text-2xl text-brand-light">مقدار</span>
                <span className="font-light text-xl text-white/30">|</span>
                <span className="font-extrabold text-2xl text-brand-orange tracking-tight">Miqdar</span>
              </Link>
              <p className="text-sm text-white/70 leading-relaxed max-w-sm mx-auto md:mx-0">
                منصة اشتراك الوجبات الصحية السعودية الأولى التي تحسب احتياجك الفسيولوجي بدقة وتوفر وجبات طازجة ومتنوعة يومياً لتصل إلى هدفك الصحي بكل مرونة.
              </p>
            </div>

            {/* Column 2: Navigation Links */}
            <div className="space-y-4 text-center">
              <h3 className="font-bold text-brand-light text-base">روابط سريعة</h3>
              <ul className="space-y-2 text-sm text-white/70">
                <li><Link href="#goals" className="hover:text-white transition-colors">أهدافنا وباقاتنا</Link></li>
                <li><Link href="#how" className="hover:text-white transition-colors">كيف نعمل؟</Link></li>
                <li><Link href="#features" className="hover:text-white transition-colors">لماذا تختار مقدار؟</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">اتصل بنا</Link></li>
                <li><Link href="/calculator" className="hover:text-white transition-colors">حاسبة السعرات المجانية</Link></li>
              </ul>
            </div>

            {/* Column 3: Contact & Support */}
            <div className="space-y-4 text-center md:text-left md:rtl:text-right">
              <h3 className="font-bold text-brand-light text-base md:text-right">تواصل معنا</h3>
              <div className="flex flex-col gap-3 items-center md:items-start text-sm text-white/70">
                {/* WhatsApp */}
                <a
                  href="https://wa.me/966541688135"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand-light transition-colors flex items-center gap-2 justify-center md:justify-start"
                >
                  <svg className="w-5 h-5 fill-current text-brand-light" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.463h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span>واتساب: 0541688135</span>
                </a>
                {/* Phone */}
                <a
                  href="tel:0541688135"
                  className="hover:text-brand-light transition-colors flex items-center gap-2 justify-center md:justify-start"
                >
                  <svg className="w-5 h-5 fill-none stroke-current text-brand-light" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  <span>اتصال: 0541688135</span>
                </a>
                {/* Instagram */}
                <a
                  href="https://instagram.com/miq_dar1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand-light transition-colors flex items-center gap-2 justify-center md:justify-start"
                >
                  <svg className="w-5 h-5 fill-none stroke-current text-brand-light" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                  <span>إنستغرام: miq_dar1</span>
                </a>
                {/* TikTok */}
                <a
                  href="https://tiktok.com/@miq_dar1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand-light transition-colors flex items-center gap-2 justify-center md:justify-start"
                >
                  <svg className="w-5 h-5 fill-current text-brand-light" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-3.94-1.74-.22-.2-.42-.43-.61-.67-.02 3.48-.01 6.96-.02 10.43-.07 1.48-.52 2.97-1.44 4.1-1.37 1.74-3.69 2.76-5.91 2.82-2.2-.02-4.42-.99-5.75-2.73-1.43-1.8-1.78-4.36-1.02-6.52.68-1.99 2.4-3.63 4.49-4.14.34-.09.7-.14 1.05-.17V12c-.22.02-.45.04-.67.09-1.35.25-2.61 1.08-3.35 2.24-.9 1.36-1.04 3.17-.46 4.69.5 1.39 1.69 2.51 3.14 2.87 1.25.32 2.64.08 3.66-.72.93-.72 1.44-1.84 1.53-3.02.01-4.41.01-8.82.02-13.23l-.04-.04c-.15.08-.32.16-.49.23-1.37.52-2.88.35-4.1-.4-.68-.41-1.21-1.03-1.51-1.76V.02z"/>
                  </svg>
                  <span>تيك توك: miq_dar1</span>
                </a>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/50 text-center">
            <div>© {new Date().getFullYear()} مقدار للوجبات الصحية. جميع الحقوق محفوظة.</div>
            <div className="flex gap-4">
              <Link href="/contact" className="hover:text-white transition-colors">اتصل بنا</Link>
              <span>·</span>
              <a href="#" className="hover:text-white transition-colors">شروط الاستخدام</a>
              <span>·</span>
              <a href="#" className="hover:text-white transition-colors">سياسة الخصوصية</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ===== Modal detailed feature popup ===== */}
      {activeFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-brand-dark/45 backdrop-blur-md transition-opacity animate-fade-in"
            onClick={() => setActiveFeature(null)}
          />

          {/* Modal Content */}
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full relative z-10 shadow-2xl border border-brand-light/10 animate-slide-up text-right dark:bg-zinc-950 dark:border-zinc-800">
            {/* Close Button */}
            <button
              onClick={() => setActiveFeature(null)}
              className="absolute top-4 left-4 w-8 h-8 rounded-full bg-surface-muted hover:bg-brand-cream text-brand-dark flex items-center justify-center font-bold transition-colors cursor-pointer dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-brand-light"
              aria-label="Close"
            >
              ✕
            </button>

            {/* Icon & Title */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center text-3xl shadow-brand text-white flex-shrink-0">
                {activeFeature.icon}
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-black text-brand-dark dark:text-zinc-50">{activeFeature.title}</h3>
                <p className="text-xs text-brand-light font-semibold mt-0.5">ميزة مقدار المميزة</p>
              </div>
            </div>

            {/* Full Description */}
            <p className="text-sm text-text-secondary leading-relaxed mb-6 dark:text-zinc-400">
              {activeFeature.desc}
            </p>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Link
                href={activeFeature.linkUrl}
                onClick={() => setActiveFeature(null)}
                className="btn-orange flex-1 text-center py-3 text-sm font-bold rounded-xl shadow-md text-white"
              >
                {activeFeature.linkText}
              </Link>
              <button
                onClick={() => setActiveFeature(null)}
                className="btn-outline py-3 text-sm px-5 font-semibold rounded-xl border-2 border-brand-dark text-brand-dark cursor-pointer hover:bg-brand-dark hover:text-white dark:border-brand-light dark:text-brand-light dark:hover:bg-brand-light dark:hover:text-zinc-950"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "مقدار للوجبات الصحية | وجباتك المحسوبة بدقة",
  description: "اشترك في مقدار واحصل على وجبات صحية مخصصة لهدفك - تضخيم، تنشيف، أو حياة يومية متوازنة. وجبتان وسناك يومياً بسعرات محسوبة بدقة.",
  keywords: "وجبات صحية, سعرات حرارية, تضخيم, تنشيف, دايت, كيتو, مقدار",
  manifest: "/manifest.json",
  openGraph: {
    title: "مقدار للوجبات الصحية",
    description: "وجباتك المحسوبة بدقة لتحقيق هدفك الصحي",
    locale: "ar_SA",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('miqdar-theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `
          }}
        />
      </head>
      <body className="bg-surface-subtle font-arabic antialiased dark:bg-zinc-950 dark:text-zinc-50">
        {children}
        {/* Floating WhatsApp Button */}
        <a
          href="https://wa.me/966541688135"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 left-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-2xl hover:bg-[#20ba5a] hover:scale-110 active:scale-95 transition-all duration-300 group animate-bounce-soft"
          aria-label="تواصل معنا عبر واتساب"
          id="whatsapp-floating-button"
        >
          <svg
            className="w-7 h-7 fill-current transition-transform duration-300 group-hover:rotate-12"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.628 3.828 14.167 2.8 11.537 2.8c-5.444 0-9.87 4.374-9.874 9.8.002 2.028.536 4.015 1.554 5.772l-1.023 3.732 3.864-.999zm11.366-5.835c-.312-.156-1.848-.91-2.127-1.01-.279-.1-.482-.156-.684.156-.202.311-.785 1.01-.962 1.211-.177.202-.355.228-.668.072-1.393-.695-2.296-1.229-3.218-2.812-.243-.417.243-.387.696-1.29.076-.156.038-.292-.019-.39-.057-.1-.482-1.16-.66-1.597-.174-.418-.365-.361-.502-.368-.13-.006-.279-.007-.428-.007-.15 0-.393.056-.599.28-.206.225-.785.767-.785 1.871s.804 2.167.916 2.318c.112.15 1.58 2.413 3.828 3.381 1.816.786 2.502.852 3.398.721.572-.084 1.848-.755 2.11-1.485.262-.73.262-1.356.184-1.485-.078-.129-.279-.207-.591-.363z" />
          </svg>
          {/* Subtle notification ping */}
          <span className="absolute -top-1 -left-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
          </span>
        </a>
      </body>
    </html>
  );
}

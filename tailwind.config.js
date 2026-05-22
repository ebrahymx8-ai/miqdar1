/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ألوان مقدار الأساسية
        brand: {
          dark:    '#1A5C2A', // الأخضر الداكن - الشعار الرئيسي
          light:   '#7BC142', // الأخضر الفاتح - الشوكة والنص الفرعي
          orange:  '#E8763A', // البرتقالي - الأوراق واللمسات
          cream:   '#F5F0E8', // الكريمي - خلفية الشعار
          'dark-2': '#134520', // أخضر أعمق للـ hover
          'light-2': '#96D45A', // أخضر فاتح أوضح
          'orange-2': '#F28C56', // برتقالي أفتح للـ hover
        },
        // ألوان النظام
        surface: {
          DEFAULT: '#FFFFFF',
          subtle:  '#F9FBF7', // أخضر فاتح جداً
          muted:   '#F0F4EE',
        },
        text: {
          primary:   '#1A1A1A',
          secondary: '#4A5568',
          muted:     '#718096',
          inverse:   '#FFFFFF',
        },
        status: {
          success: '#1A5C2A',
          warning: '#E8763A',
          error:   '#E53E3E',
          info:    '#3182CE',
        },
      },
      fontFamily: {
        arabic: ['var(--font-cairo)', 'sans-serif'],
        sans:   ['var(--font-cairo)', 'sans-serif'],
      },
      borderRadius: {
        xl:  '16px',
        '2xl': '20px',
        '3xl': '28px',
      },
      boxShadow: {
        brand:  '0 4px 24px rgba(26, 92, 42, 0.15)',
        orange: '0 4px 24px rgba(232, 118, 58, 0.20)',
        card:   '0 2px 16px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 8px 32px rgba(26, 92, 42, 0.15)',
      },
      backgroundImage: {
        'gradient-brand':  'linear-gradient(135deg, #1A5C2A 0%, #7BC142 100%)',
        'gradient-orange': 'linear-gradient(135deg, #E8763A 0%, #F28C56 100%)',
        'gradient-hero':   'linear-gradient(160deg, #134520 0%, #1A5C2A 50%, #2D7A3F 100%)',
        'gradient-light':  'linear-gradient(135deg, #F5F0E8 0%, #F9FBF7 100%)',
      },
      animation: {
        'fade-in':   'fadeIn 0.5s ease-in-out',
        'slide-up':  'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
        'bounce-soft': 'bounceSoft 1s infinite',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%':   { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.7' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-4px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./views/**/*.ejs', './public/js/**/*.js', './utils/**/*.js'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#fff4ed', 100: '#ffe6d4', 200: '#ffc9a8', 300: '#ffa171', 400: '#ff7a3d',
          500: '#fb5a14', 600: '#ec4009', 700: '#c4300a', 800: '#9c2810', 900: '#7e2410',
        },
        ink: {
          50: '#f6f7fb', 100: '#eceef6', 200: '#d6daea', 300: '#aab0cd', 400: '#7c85ad',
          500: '#5b6591', 600: '#454d77', 700: '#363c5e', 800: '#262a45', 900: '#171a30', 950: '#0b0d1d',
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(23,26,48,.04), 0 8px 24px -8px rgba(23,26,48,.10)',
        lift: '0 2px 4px rgba(23,26,48,.05), 0 20px 40px -12px rgba(23,26,48,.22)',
        glow: '0 10px 30px -6px rgba(251,90,20,.55)',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
        fadeUp: { '0%': { opacity: 0, transform: 'translateY(16px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        slideIn: { '0%': { opacity: 0, transform: 'translateX(24px)' }, '100%': { opacity: 1, transform: 'translateX(0)' } },
        pulseRing: { '0%': { boxShadow: '0 0 0 0 rgba(16,185,129,.55)' }, '100%': { boxShadow: '0 0 0 10px rgba(16,185,129,0)' } },
        gradientShift: { '0%,100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        'fade-up': 'fadeUp .7s cubic-bezier(.2,.7,.2,1) both',
        'slide-in': 'slideIn .4s cubic-bezier(.2,.7,.2,1) both',
        'pulse-ring': 'pulseRing 1.8s ease-out infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',
      },
    },
  },
  plugins: [],
};

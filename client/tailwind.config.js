/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: { DEFAULT: '#2D6A4F', light: '#40916C', dark: '#1B4332' },
        sage: { DEFAULT: '#52796F', light: '#84A98C', muted: '#95A69A' },
        cream: { DEFAULT: '#F7F5F0', dark: '#EDE9E0' },
        terra: { DEFAULT: '#E07B39', light: '#F4A261', dark: '#B85C1F' },
        frost: { DEFAULT: '#A8DADC', dark: '#457B9D' },
        amber: { DEFAULT: '#E9C46A', dark: '#C9A227' },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.04)',
        lift: '0 8px 24px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'bounce-sm': 'bounceSm 0.4s ease-out',
      },
      keyframes: {
        slideUp: { '0%': { transform: 'translateY(20px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        bounceSm: { '0%': { transform: 'scale(1)' }, '50%': { transform: 'scale(0.92)' }, '100%': { transform: 'scale(1)' } },
      }
    }
  },
  plugins: []
}

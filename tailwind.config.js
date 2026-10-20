/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/data/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: "#0b0f19",
          card: "#131b2e",
          border: "#1e293b",
          red: "#ef233c",
          crimson: "#d90429",
          gold: "#ffd166",
          yellow: "#ffb703",
          cyan: "#06d6a0",
          blue: "#118ab2",
          purple: "#7209b7",
        },
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-short': 'bounce 0.5s ease-in-out infinite',
        'shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
        'glow': 'glow 1.5s ease-in-out infinite alternate',
      },
      keyframes: {
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' },
        },
        glow: {
          '0%': { filter: 'drop-shadow(0 0 5px rgba(255, 209, 102, 0.4))' },
          '100%': { filter: 'drop-shadow(0 0 20px rgba(255, 209, 102, 0.9))' },
        }
      }
    },
  },
  plugins: [],
};

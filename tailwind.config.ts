import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      keyframes: {
        fade: {
          "0%, 100%": { opacity: "0.2" },
          "50%": { opacity: "1" },
        },
        shake: {
          '0%, 16.7%, 100%': { transform: 'translate(0, 0)' }, // 靜止位置
          '3%, 7%, 11%, 15%': { transform: 'translate(-5px, -5px)' },
          '5%, 9%, 13%': { transform: 'translate(5px, 5px)' },
        },
      },
      animation: {
        fade: "fade 2s ease-in-out infinite",
        shake: 'shake 4.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;

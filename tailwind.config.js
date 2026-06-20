/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#8DC63F", dk: "var(--green-dk)", lt: "var(--green-lt)", xlt: "var(--green-xlt)" },
        red: "#EF4444",
        orange: "#F97316",
        bg: "var(--bg)",
        surface: "var(--surface)",
        ink: "var(--dark)",
        t1: "var(--t1)",
        t2: "var(--t2)",
        t3: "var(--t3)",
        line: "var(--border)",
        group: {
          peito: "#3B82F6", costas: "#8B5CF6", ombros: "#F59E0B", biceps: "#EC4899",
          triceps: "#EF4444", pernas: "#10B981", gluteos: "#F97316", abdomen: "#6B7280",
        },
      },
      fontFamily: { sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"] },
      borderRadius: { card: "20px", btn: "13px", pill: "100px" },
      boxShadow: {
        card: "var(--shadow)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: { from: { transform: "translateY(16px)", opacity: "0" }, to: { transform: "translateY(0)", opacity: "1" } },
        popIn: { from: { transform: "scale(0.94)", opacity: "0" }, to: { transform: "scale(1)", opacity: "1" } },
      },
      animation: {
        fadeIn: "fadeIn 0.25s ease",
        slideUp: "slideUp 0.4s cubic-bezier(.2,.8,.2,1)",
        popIn: "popIn 0.3s cubic-bezier(.2,.8,.2,1)",
      },
    },
  },
  plugins: [],
};

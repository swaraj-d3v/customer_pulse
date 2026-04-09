/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#09090f",
        card: "#111118",
        accent: "#6366f1",
        ink: "#f4f7fb",
        muted: "#8f97b2",
        border: "rgba(255,255,255,0.08)",
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444",
        info: "#38bdf8"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(99,102,241,0.15), 0 18px 40px rgba(2,6,23,0.45)"
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top, rgba(99,102,241,0.22), transparent 28%), linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)"
      },
      backgroundSize: {
        "hero-grid": "100% 100%, 28px 28px, 28px 28px"
      },
      animation: {
        float: "float 10s ease-in-out infinite"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" }
        }
      }
    }
  },
  plugins: []
};

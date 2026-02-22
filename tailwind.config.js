/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1E40AF",
          dark: "#1E3A8A",
          light: "#3B82F6",
        },
        accent: "#F59E0B",
        success: "#10B981",
        danger: "#EF4444",
        background: "#0F172A",
        surface: "#1E293B",
        border: "#334155",
        "text-primary": "#F1F5F9",
        "text-muted": "#94A3B8",
      },
      borderRadius: {
        card: "12px",
        button: "8px",
        pill: "999px",
      },
    },
  },
  plugins: [],
};

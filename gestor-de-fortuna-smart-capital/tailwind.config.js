 export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        background: "var(--background)",
        card: "var(--card)",
        input: "var(--input)",
        textMain: "var(--text)",
        textSecondary: "var(--text-secondary)",
      },
    },
  },
  plugins: [],
}
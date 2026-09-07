/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Earth + Industrial identity
        sand: "#F3EFE7",        // page background
        ivory: "#FFFDF8",       // cards
        pine: {
          DEFAULT: "#173F38",   // sidebar / brand
          light: "#1F534A",
          darker: "#0F2B26",
        },
        terracotta: {
          DEFAULT: "#B9553D",   // primary CTA
          hover: "#96432F",     // burnt clay hover
          soft: "#F6E3DC",
        },
        brass: {
          DEFAULT: "#C9A66B",
          soft: "#F2E8D5",
        },
        charcoal: "#172522",    // text
        sage: "#66736D",        // secondary text
        // shadcn-ish tokens mapped to the identity
        border: "#E5E0D5",
        input: "#DCD6C8",
        ring: "#173F38",
        background: "#F3EFE7",
        foreground: "#172522",
        primary: { DEFAULT: "#B9553D", foreground: "#FFFDF8" },
        secondary: { DEFAULT: "#173F38", foreground: "#F3EFE7" },
        destructive: { DEFAULT: "#A93226", foreground: "#FFFDF8" },
        muted: { DEFAULT: "#EDE8DD", foreground: "#66736D" },
        accent: { DEFAULT: "#F2E8D5", foreground: "#173F38" },
        card: { DEFAULT: "#FFFDF8", foreground: "#172522" },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(23,37,34,0.05), 0 1px 3px rgba(23,37,34,0.04)",
        raised: "0 4px 12px rgba(23,37,34,0.08)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0", transform: "translateY(4px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out",
      },
    },
  },
  plugins: [],
};  
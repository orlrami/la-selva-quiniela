import type { Config } from "tailwindcss";

const config = {
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "muted-foreground": "var(--muted-foreground)",
        card: "var(--card)",
        "card-strong": "var(--card-strong)",
        "accent-gold": "var(--accent-gold)",
        "accent-green": "var(--accent-green)",
        "accent-teal": "var(--accent-teal)",
        "accent-danger": "var(--accent-danger)",
      },
      borderRadius: {
        card: "var(--radius-card)",
      },
      boxShadow: {
        glow: "0 22px 70px rgba(31, 182, 166, 0.16)",
      },
    },
  },
} satisfies Config;

export default config;

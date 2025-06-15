import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          green: "hsl(var(--primary-green))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Brand Colors
        "primary-green": "hsl(var(--primary-green))",
        "medium-teal": "hsl(var(--medium-teal))",
        "light-mint": "hsl(var(--light-mint))",
        // Neutral Colors
        white: "hsl(var(--white))",
        "light-gray": "hsl(var(--light-gray))",
        "medium-gray": "hsl(var(--medium-gray))",
        "dark-gray": "hsl(var(--dark-gray))",
        black: "hsl(var(--black))",
        // State Colors
        red: "hsl(var(--red))",
        orange: "hsl(var(--orange))",
        purple: "hsl(var(--purple))",
        "dark-blue": "hsl(var(--dark-blue))",
        "light-blue": "hsl(var(--light-blue))",
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
        round: "var(--radius-round)",
      },
      spacing: {
        xs: "var(--space-xs)",
        sm: "var(--space-sm)",
        md: "var(--space-md)",
        lg: "var(--space-lg)",
        xl: "var(--space-xl)",
        xxl: "var(--space-xxl)",
      },
      fontSize: {
        xs: ["12px", { lineHeight: "16px" }],      // Caption
        sm: ["14px", { lineHeight: "20px" }],      // Body Small
        base: ["16px", { lineHeight: "24px" }],    // Body
        lg: ["18px", { lineHeight: "28px" }],      // Body Large
        xl: ["20px", { lineHeight: "28px" }],      // H4
        "2xl": ["24px", { lineHeight: "32px" }],   // H3
        "3xl": ["30px", { lineHeight: "38px" }],   // Between H3 and H2
        "4xl": ["36px", { lineHeight: "44px" }],   // H2
        "5xl": ["48px", { lineHeight: "56px" }],   // H1
      },
      fontWeight: {
        light: "300",
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(2px)' },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "ripple": {
          "0%": { opacity: "0.7", transform: "scale(0)" },
          "100%": { opacity: "0", transform: "scale(2.5)" },
        },
        "pulse": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.05)" },
        },
        "spin-grow": {
          "0%": { transform: "rotate(0deg) scale(1)" },
          "50%": { transform: "rotate(180deg) scale(1.1)" },
          "100%": { transform: "rotate(360deg) scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "shake": "shake 0.5s ease-in-out",
        "fade-in": "fade-in 0.3s ease-in-out",
        "ripple": "ripple 0.6s ease-out",
        "pulse": "pulse 1.5s ease-in-out infinite",
        "spin-grow": "spin-grow 1.5s ease-in-out infinite",
      },
      maxWidth: {
        'container-sm': '640px',
        'container-md': '960px',
        'container-lg': '1280px',
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
    require("@tailwindcss/aspect-ratio"),
    require("tailwindcss-animate"),
  ],
}

export default config;
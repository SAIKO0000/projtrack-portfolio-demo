import type { Config } from "tailwindcss"
import tailwindcssAnimate from "tailwindcss-animate"

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    screens: {
      // Mobile Phones (Portrait & Landscape)
      'xs': '360px',        // 360×800 - Small phones
      'phone-sm': '375px',  // 375×812 - iPhone 12/13/14 size  
      'phone-md': '390px',  // 390×844 - iPhone 14 Pro size
      'phone-lg': '430px',  // 430×932 - iPhone 14 Pro Max size
      'phone-landscape': '640px', // Landscape mode for phones
      
      // Tablets (Portrait & Landscape)
      'sm': '768px',        // 768×1024 - iPad Mini/Standard tablets
      'tablet-md': '820px', // 820×1180 - iPad Air
      'tablet-lg': '834px', // 834×1112 - iPad Pro 11" 
      'tablet-xl': '1024px', // 1024×1366 - iPad Pro 12.9" landscape
      
      // Laptops/Desktops
      'md': '1280px',       // 1280×800/720 - Small laptops
      'lg': '1366px',       // 1366×768 - Common laptop size
      'xl': '1440px',       // 1440×900/1536×864 - Large laptops
      '2xl': '1920px',      // 1920×1080 - Full HD displays
      '3xl': '2560px',      // 2560×1440 - 2K/QHD displays
      
      // Utility breakpoints
      'mobile-nav': '1024px', // Below this, show mobile navigation
    },
    extend: {
      // Responsive spacing system for modals and components
      spacing: {
        'modal-xs': '0.5rem',     // 8px - Extra small spacing for mobile
        'modal-sm': '0.75rem',    // 12px - Small spacing 
        'modal-md': '1rem',       // 16px - Medium spacing
        'modal-lg': '1.5rem',     // 24px - Large spacing
        'modal-xl': '2rem',       // 32px - Extra large spacing
        'modal-2xl': '2.5rem',    // 40px - 2x Extra large spacing
        'safe-area-inset': 'env(safe-area-inset-top, 0px)', // Safe area for mobile
      },
      
      // Modal sizing system
      maxWidth: {
        'modal-xs': '20rem',      // 320px
        'modal-sm': '24rem',      // 384px  
        'modal-md': '28rem',      // 448px
        'modal-lg': '32rem',      // 512px
        'modal-xl': '36rem',      // 576px
        'modal-2xl': '42rem',     // 672px
        'modal-3xl': '48rem',     // 768px
        'modal-4xl': '56rem',     // 896px
        'modal-5xl': '64rem',     // 1024px
        'modal-full': '95vw',     // Almost full width with margin
      },
      
      maxHeight: {
        'modal-xs': '20rem',      // 320px
        'modal-sm': '24rem',      // 384px
        'modal-md': '32rem',      // 512px
        'modal-lg': '40rem',      // 640px
        'modal-xl': '48rem',      // 768px
        'modal-2xl': '56rem',     // 896px
        'modal-screen': '90vh',   // 90% of viewport height
        'modal-screen-sm': '85vh', // 85% for smaller screens
      },

      colors: {
        // GYG Power Systems Brand Colors
        "gyg-orange": {
          50: "#FFF7ED",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#FF6B35", // Primary Orange
          600: "#FF8C42", // Secondary Orange
          700: "#C2410C",
          800: "#9A3412",
          900: "#7C2D12",
        },
        "gyg-gray": {
          50: "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#6C6C6C", // Medium Gray
          600: "#4B5563",
          700: "#374151",
          800: "#2C2C2C", // Charcoal Gray
          900: "#111827",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
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
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config

export default config

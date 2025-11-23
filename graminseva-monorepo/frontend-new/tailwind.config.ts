// frontend/tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0D1117', // Main background
        'card-bg': '#161B22',     // Card background
        'card-border': '#30363D', // Card border
        foreground: '#C9D1D9',   // Main text color
        'foreground-muted': '#8B949E', // Subtler text color
        'accent-blue': '#58A6FF', // Buttons, highlights
        'accent-blue-hover': '#79B8FF',
      },
    },
  },
  plugins: [],
}
export default config
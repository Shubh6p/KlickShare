/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          surface: '#fcfaf6',
          surfaceDim: '#e8e4d9',
          surfaceLowest: '#ffffff',
          surfaceLow: '#f8f6f0',
          surfaceContainer: '#eeebe0',
          surfaceHigh: '#e6e2d6',
          surfaceHighest: '#e1dcd0',
          primary: '#000000',
          primaryFixed: '#d3cabc',
          secondary: '#4d5d36',
          secondaryDim: '#3e4a2b',
          secondaryContainer: '#cce1aa',
          tertiary: '#ff8800',
          tertiaryFixed: '#ff8800',
          onSurface: '#000000',
          inverseSurface: '#0a0a0a',
          outlineVariant: '#d3cabc'
        }
      },
      fontFamily: {
        mono: ['"Space Mono"', 'monospace'],
        display: ['"Press Start 2P"', 'cursive'],
      },
      letterSpacing: {
        tightest: '-.02em',
      }
    }
  },
  plugins: [],
}

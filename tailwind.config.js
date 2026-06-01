/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
      fontFamily: {
        sans: ['var(--font-sans)'],
        serif: ['var(--font-serif)'],
        mono: ['var(--font-mono)'],
        bengali: ['var(--font-bengali)'],
      },
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			success: 'hsl(var(--success))',
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			},
  			/* Stitch Design Tokens (CSS variables set per-theme in JS) */
  			'outline': 'hsl(var(--stitch-outline))',
  			'outline-variant': 'hsl(var(--stitch-outline-variant))',
  			'surface-gray': 'hsl(var(--stitch-surface-gray))',
  			'surface-blue': 'hsl(var(--stitch-surface-blue))',
  			'surface-container': 'hsl(var(--stitch-surface-container))',
  			'surface-container-low': 'hsl(var(--stitch-surface-container-low))',
  			'surface-container-high': 'hsl(var(--stitch-surface-container-high))',
  			'surface-container-highest': 'hsl(var(--stitch-surface-container-highest))',
  			'primary-container': 'hsl(var(--stitch-primary-container))',
  			'on-primary-container': 'hsl(var(--stitch-on-primary-container))',
  			'secondary-container': 'hsl(var(--stitch-secondary-container))',
  			'on-secondary-container': 'hsl(var(--stitch-on-secondary-container))',
  			'error': 'hsl(var(--stitch-error))',
  			'error-red': 'hsl(var(--stitch-error-red))',
  			'error-container': 'hsl(var(--stitch-error-container))',
  			'on-error-container': 'hsl(var(--stitch-on-error-container))',
  			'tertiary': 'hsl(var(--stitch-tertiary))',
  			'tertiary-container': 'hsl(var(--stitch-tertiary-container))',
  			'tertiary-fixed-dim': 'hsl(var(--stitch-tertiary-fixed-dim))',
  			'inverse-surface': 'hsl(var(--stitch-inverse-surface))',
  			'inverse-on-surface': 'hsl(var(--stitch-inverse-on-surface))',
  			'inverse-primary': 'hsl(var(--stitch-inverse-primary))',
  			'on-surface': 'hsl(var(--stitch-on-surface))',
  			'on-surface-variant': 'hsl(var(--stitch-on-surface-variant))',
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' }
  			},
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' }
        }
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}

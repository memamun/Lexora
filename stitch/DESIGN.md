---
name: Lexora Design System
colors:
  surface: '#faf8ff'
  surface-dim: '#d9d9e4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3fd'
  surface-container: '#ededf8'
  surface-container-high: '#e7e7f2'
  surface-container-highest: '#e1e2ec'
  on-surface: '#191b23'
  on-surface-variant: '#424654'
  inverse-surface: '#2e3038'
  inverse-on-surface: '#f0f0fa'
  outline: '#737785'
  outline-variant: '#c3c6d6'
  surface-tint: '#0a56ce'
  primary: '#0041a2'
  on-primary: '#ffffff'
  primary-container: '#0c57cf'
  on-primary-container: '#cdd9ff'
  inverse-primary: '#b2c5ff'
  secondary: '#006d42'
  on-secondary: '#ffffff'
  secondary-container: '#89f9b9'
  on-secondary-container: '#007347'
  tertiary: '#802b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#a73b00'
  on-tertiary-container: '#ffcfbd'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#b2c5ff'
  on-primary-fixed: '#001847'
  on-primary-fixed-variant: '#0040a0'
  secondary-fixed: '#89f9b9'
  secondary-fixed-dim: '#6ddc9e'
  on-secondary-fixed: '#002111'
  on-secondary-fixed-variant: '#005231'
  tertiary-fixed: '#ffdbce'
  tertiary-fixed-dim: '#ffb599'
  on-tertiary-fixed: '#370e00'
  on-tertiary-fixed-variant: '#7f2b00'
  background: '#faf8ff'
  on-background: '#191b23'
  surface-variant: '#e1e2ec'
  surface-blue: '#e7f0fd'
  surface-gray: '#f0f2f4'
  error-red: '#d14747'
  text-muted: '#666666'
typography:
  display:
    fontFamily: DM Sans
    fontSize: 33.6px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg:
    fontFamily: DM Sans
    fontSize: 26.88px
    fontWeight: '700'
    lineHeight: 35.84px
  headline-md:
    fontFamily: DM Sans
    fontSize: 22.4px
    fontWeight: '700'
    lineHeight: 28px
  headline-sm:
    fontFamily: DM Sans
    fontSize: 17.92px
    fontWeight: '700'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 15.68px
    fontWeight: '700'
    lineHeight: 22.4px
    letterSpacing: -0.392px
  body-md:
    fontFamily: Inter
    fontSize: 13.44px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '500'
    lineHeight: '1.4'
  label-sm:
    fontFamily: Inter
    fontSize: 9px
    fontWeight: '900'
    lineHeight: 13.5px
    letterSpacing: 1.8px
  headline-lg-mobile:
    fontFamily: DM Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 2.24px
  xs: 4.48px
  sm: 8.96px
  md: 13.44px
  lg: 17.92px
  xl: 22.4px
  xxl: 35.84px
  gutter: 17.92px
  margin: 22.4px
---

# Design System Inspired by Lexora
> Auto-extracted from `http://localhost:5173/` on 2026-06-01
## 1. Visual Theme & Atmosphere
Friendly, approachable design with rounded shapes and generous whitespace.
The hero section leads with "Welcome back, Abdullah!" followed by "Path to Mastery15 Levels300 words".
**Key Characteristics:**
- DM Sans as the heading font
- Inter as the body font for all running text
- Heading weight 700
- Light/white background (#f9fafb) as the primary canvas
- Primary accent `#0c57cf` used for CTAs and brand highlights
- 2 shadow level(s) detected — tinted shadows
- Rounded corners (2px+) creating a friendly, approachable feel
- Tags: light, rounded, accented, compact, sans-serif
## 2. Color Palette & Roles
### Primary
- **Primary Accent** (`#0c57cf`) · `--color-primary`: Brand color, CTA backgrounds, link text, interactive highlights.
- **Secondary Accent** (`#39ac73`) · `--color-secondary`: Secondary brand, hover states, complementary highlights.
- **Background** (`#f9fafb`) · `--color-bg`: Page background, primary canvas.
- **Background Secondary** (`#1f1f1f`) · `--color-bg-secondary`: Cards, surfaces, alternating sections.
### Text
- **Text Primary** (`#1f1f1f`) · `--color-text`: Headings and body text.
- **Text Secondary** (`#666666`) · `--color-text-secondary`: Muted text, captions, placeholders.
### Borders & Surfaces
- **Border** (`#1f1f1f`) · `--color-border`: Dividers, outlines, input borders.
### Full Extracted Palette
| # | Hex | CSS Variable | Role | Area | Contrast |
|---|---|---|---|---|---|
| 1 | `#ffffff` | `--palette-1` | section | large | text-dark |
| 2 | `#1f1f1f` | `--palette-2` | block | medium | text-light |
| 3 | `#e7f0fd` | `--palette-3` | badge | medium | text-dark |
| 4 | `#f0f2f4` | `--palette-4` | block | medium | text-dark |
| 5 | `#0c57cf` | `--palette-5` | text-accent | medium | text-light |
| 6 | `#39ac73` | `--palette-6` | block | medium | text-dark |
| 7 | `#d14747` | `--palette-7` | text-accent | small | text-light |
## 3. Typography Rules
- **Heading Font:** `DM Sans`, sans-serif
- **Body Font:** `Inter`, sans-serif
### Type Hierarchy
| Role | Font | Size | Weight | Line Height | Letter Spacing |
|---|---|---|---|---|---|
| H1 | DM Sans | 26.88px | 700 | 35.84px | normal |
| H3 | Inter | 15.68px | 700 | 22.4px | -0.392px |
| H4 | DM Sans | 22.4px | 700 | 28px | -0.56px |
| Body | Inter | 9px | 900 | 13.5px | 1.8px |
| Small | DM Sans | 15.68px | 600 | 22.4px | -0.392px |
### Type Scale
| Token | Size | Suggested Usage |
|---|---|---|
| Display | `33.6px` | headings |
| H1 | `26.88px` | headings |
| H2 | `22.4px` | headings |
| H3 | `17.92px` | headings |
| H4 | `15.68px` | headings |
| Body L | `13.44px` | body / supporting text |
| Body | `10px` | body / supporting text |
| Small | `9px` | body / supporting text |
| XS | `8px` | body / supporting text |
## 4. Component Stylings
### Primary Button
```css
.btn-primary {
  background: transparent;
  color: #5e6368;
  border-radius: 13.44px;
  padding: 8.96px 8.96px;
  font-size: 17.92px;
  font-weight: 400;
  border: none;
  cursor: pointer;
}
```
### Ghost Button
```css
.btn-ghost {
  background: transparent;
  color: #0c57cf;
  border-radius: 13.44px;
  padding: 8.96px 13.44px;
  font-size: 15.68px;
  font-weight: 500;
  border: none;
  cursor: pointer;
}
```
### Filled Button
```css
.btn-filled {
  background: #e7f0fd;
  color: #1f1f1f;
  border-radius: 13.44px;
  padding: 0px 0px;
  font-size: 17.92px;
  font-weight: 400;
  border: 1px solid rgb(209, 213, 219);
  cursor: pointer;
}
```
### Filled Button 2
```css
.btn-filled-2 {
  background: #e7f0fd;
  color: #5e6368;
  border-radius: 17.92px;
  padding: 0px 0px;
  font-size: 17.92px;
  font-weight: 400;
  border: 1px solid rgba(209, 213, 219, 0.8);
  cursor: pointer;
}
```
### Filled Button 3
```css
.btn-filled-3 {
  background: #0c57cf;
  color: #080c16;
  border-radius: 13.44px;
  padding: 8.96px 15.68px;
  font-size: 15.68px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}
```
### Filled Button 4
```css
.btn-filled-4 {
  background: #ffffff;
  color: #1f1f1f;
  border-radius: 13.44px;
  padding: 8.96px 15.68px;
  font-size: 15.68px;
  font-weight: 600;
  border: 1px solid rgba(209, 213, 219, 0.6);
  cursor: pointer;
}
```
### Card
```css
.card {
  background: #ffffff;
  border-radius: 13.44px;
  padding: 8.96px;
  box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 1px 2px 0px;
}
```
## 5. Layout Principles
- **Base spacing unit:** `2.24px` — use multiples (4.48px, 6.720000000000001px, 8.96px, etc.)
### Spacing Scale (extracted from real elements)
| Token | Value | Role |
|---|---|---|
| spacing-1 | `2.24px` | element |
| spacing-2 | `8.96px` | element |
| spacing-3 | `22.4px` | element |
| spacing-4 | `13.44px` | element |
| spacing-5 | `17.92px` | element |
| spacing-6 | `35.84px` | card |
| spacing-7 | `4.48px` | element |
### Border Radius Scale
| Token | Value | Element |
|---|---|---|
| radius-subtle | `2px` | subtle |
| radius-button | `13.44px` | button |
| radius-button | `15.92px` | button |
| radius-card | `17.92px` | card |
| radius-button | `13.92px` | button |
## 6. Depth & Elevation
| Level | Shadow | Usage |
|---|---|---|
| Low | `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0...` | Cards, subtle elevation |
| Low | `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0...` | Cards, subtle elevation |
## 7. Do's and Don'ts
### Do
- Use `#f9fafb` as the primary background color
- Use `DM Sans` for all headings and `Inter` for body text
- Use `#0c57cf` as the single dominant accent/CTA color
- Maintain `2.24px` as the base spacing unit — all gaps should be multiples
- Use rounded corners (`2px`+) consistently for all interactive elements
- Apply the shadow system for elevation — use the extracted shadow values
- Use weight 700 for headings to match the brand's typographic voice
### Don't
- Don't use colors outside the extracted palette without justification
- Don't substitute DM Sans/Inter with generic alternatives
- Don't use irregular spacing — stick to 2.24px grid
- Don't use dark/black backgrounds — this is a light-themed design
- Don't use sharp corners — they feel hostile in this rounded design language
- Don't use oversized hero text — this brand uses restrained type
- Don't use pure black (#000000) for text — use `#1f1f1f` instead
- Don't add decorative elements not present in the original design — no badges, ribbons, banners, or ornaments unless the source site uses them
- Don't invent UI patterns the source site doesn't have — if the original has no NEW badge, don't add one just because a red is in the palette
## 8. Responsive Behavior
| Breakpoint | Width | Notes |
|---|---|---|
| Mobile | < 640px | Single column, stack sections, reduce font sizes ~80% |
| Tablet | 640–1024px | 2-column where appropriate, maintain spacing ratios |
| Desktop | 1024–1440px | Full layout as designed |
| Wide | > 1440px | Max-width container, center content |
- Touch targets: minimum 44×44px on mobile
- Maintain 2.24px base unit across breakpoints — only scale multipliers
## 9. Agent Prompt Guide
### Quick Color Reference
```
Background:  #f9fafb
Text:        #1f1f1f
Accent:      #0c57cf
Secondary:   #39ac73
Border:      #1f1f1f
```
### Example Prompts
1. "Build a hero section with a `#f9fafb` background, `DM Sans` heading in `#1f1f1f`, and a `#0c57cf` CTA button with 13.44px radius."
2. "Create a pricing card using background `#1f1f1f`, border `#1f1f1f`, `Inter` for text, and 6.720000000000001px padding."
3. "Design a navigation bar — `#f9fafb` background, `#1f1f1f` links, `#0c57cf` for active state."
4. "Build a feature grid with 3 columns, 6.720000000000001px gap, each card using the card component style."
5. "Create a footer with `#1f1f1f` background, `#f9fafb` text, and 4.48px padding."
### Iteration Guide
1. Start with layout structure (sections, grid, spacing)
2. Apply colors from the palette — background first, then text, then accents
3. Set typography — font families, sizes from the type scale, weights
4. Add components — buttons, cards, inputs using the specs above
5. Apply border-radius consistently across all elements
6. Add shadows for depth — use the extracted shadow values, not defaults
7. Check responsive behavior — test mobile and tablet layouts
8. Final pass — verify all colors match, spacing is consistent, fonts are correct
## 10. CSS Custom Properties
> 40 custom properties extracted from `:root` / `html` stylesheets.
### Spacing Variables
| Variable | Value |
|---|---|
| `--radius` | `1rem` |
### Typography Variables
| Variable | Value |
|---|---|
| `--font-sans` | `'Inter', 'Hind Siliguri', sans-serif` |
| `--font-serif` | `'DM Sans', sans-serif` |
| `--font-mono` | `'JetBrains Mono', monospace` |
| `--font-bengali` | `'Hind Siliguri', sans-serif` |
### Other Variables
| Variable | Value |
|---|---|
| `--background` | `222 47% 6%` |
| `--foreground` | `40 20% 92%` |
| `--card` | `222 40% 9%` |
| `--card-foreground` | `40 20% 92%` |
| `--popover` | `222 40% 9%` |
| `--popover-foreground` | `40 20% 92%` |
| `--primary` | `38 92% 60%` |
| `--primary-foreground` | `222 47% 6%` |
| `--secondary` | `222 30% 14%` |
| `--secondary-foreground` | `40 15% 75%` |
| `--muted" | "222 25% 12%` |
| `--muted-foreground" | "220 15% 50%` |
| `--accent" | "185 40% 45%` |
| `--accent-foreground" | "40 20% 95%` |
| `--destructive" | "0 60% 55%` |
| ... | *(20 more)* |

## 1. Install Aceternity component

- [x] 1.1 Run `pnpm dlx shadcn@latest add @aceternity/wavy-background` to add `src/components/ui/wavy-background.tsx` and any transitive dependencies
- [x] 1.2 Confirm the installed component exports `WavyBackground` and review default props (`colors`, `backgroundFill`, `waveOpacity`, `blur`, `speed`)

## 2. Integrate wavy background in Hero115

- [x] 2.1 Add `"use client"` to `src/components/hero115.tsx` (or extract a minimal client wrapper if needed for the canvas effect)
- [x] 2.2 Import `WavyBackground` from `@/components/ui/wavy-background`
- [x] 2.3 Keep the existing concentric-circle decoration (`aria-hidden` absolute border rings) unchanged
- [x] 2.4 Wrap the full hero block (rings, headline, description, icon, CTA, and hero image) in `WavyBackground`, passing theme-appropriate `backgroundFill`, `colors`, `waveOpacity`, `blur`, and `speed="slow"`
- [x] 2.5 Set z-index so the wavy canvas sits below everything (`-z-20` or lower), circle rings stay at `-z-10`, and all foreground content remains above both layers

## 3. Theme tuning

- [x] 3.1 Configure light-mode wave colors and background fill to match Parrot neutral tokens (readable headline and CTA contrast)
- [x] 3.2 Configure dark-mode wave colors and background fill for equivalent legibility when theme is dark

## 1. Responsive wave anchor

- [x] 1.1 Add a viewport media-query hook or inline `matchMedia('(min-width: 768px)')` listener in `src/components/hero115.tsx` to track whether the viewport is at or above the `md` breakpoint
- [x] 1.2 Pass responsive `waveYPosition` to `WavyBackground`: ~`0.4` below `md`, `0.58` at or above `md`
- [x] 1.3 Confirm `WavyBackground` picks up `waveYPosition` changes via its existing ref sync without additional canvas lifecycle changes

## 2. Verification

- [x] 2.1 Run lint and type check
- [x] 2.2 Run production build

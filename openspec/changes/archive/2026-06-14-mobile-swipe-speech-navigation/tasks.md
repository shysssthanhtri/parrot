## 1. Mobile layout and hint

- [x] 1.1 Import `useIsMobile` in `learner-speech-catalog.tsx` and branch layout: single centered card column on mobile, existing three-column grid on desktop
- [x] 1.2 Show platform-specific hint copy (keyboard on desktop, swipe on mobile) and hide chevron buttons on mobile via `hidden md:flex` or conditional render

## 2. Swipe navigation

- [x] 2.1 Add pointer event handlers on the mobile card container to detect vertical swipes with a distance threshold (e.g. 50px)
- [x] 2.2 Map swipe up to `navigateSpeech(1)` and swipe down to `navigateSpeech(-1)`, reusing existing clamp and `hasNavigated` dismissal

## 3. Verification

- [x] 3.1 Run lint and typecheck for touched files

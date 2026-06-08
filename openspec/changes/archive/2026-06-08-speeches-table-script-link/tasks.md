## 1. Speeches table navigation

- [x] 1.1 In `speeches-table.tsx`, remove `"use client"`, `useRouter`, row `onClick`, and `cursor-pointer` styling
- [x] 1.2 Wrap `speech.script.title` in a Next.js `Link` to `ROUTES.CMS.SPEECH_DETAIL(speech.id)` with `prefetch={false}` and `hover:underline underline-offset-4` classes (match `scripts-table.tsx` / `voices-table.tsx`)
- [x] 1.3 Manually verify on `/cms/speeches`: script title navigates to detail, shows hover underline, supports open-in-new-tab, and non-title cells do not navigate

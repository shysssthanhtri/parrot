## 1. Verify thumbnail worker has no sharp dependency

- [x] 1.1 Confirm `src/lib/speech-thumbnail-processing.ts` has no `sharp` import or PNG→WebP conversion; uploads Modal response directly as WebP
- [x] 1.2 Confirm `sharp` is not listed in `package.json` dependencies (only allowed as optional Next.js transitive dep if needed for global image optimizer)

## 2. Harden Vercel serverless compatibility

- [x] 2.1 Add `serverExternalPackages: ['sharp']` to `next.config.ts` so Turbopack does not incorrectly bundle sharp into queue server chunks
- [x] 2.2 If sharp load errors persist after redeploy, add pnpm `supportedArchitectures` for linux/x64 in `package.json` so Vercel installs `@img/sharp-linux-x64` optional binaries during build
- [x] 2.3 Ensure `src/app/api/queues/speech-thumbnail/route.ts` uses Node.js runtime (not edge) consistent with other queue handlers

## 3. Modal WebP output

- [x] 3.1 Verify `modal/speech_thumbnail.py` returns WebP (`Content-Type: image/webp`, Pillow `format="WEBP"`, quality 85)
- [x] 3.2 Redeploy Modal via **Deploy Thumbnail Image to Modal** workflow after any Python changes

## 4. Deploy and recovery

- [ ] 4.1 Deploy Next.js to Vercel with the updated bundle (no sharp in thumbnail worker path)
- [x] 4.2 Document in PR/commit that speeches previously stuck in `failed` thumbnail status can be recovered via CMS **Regenerate thumbnail**

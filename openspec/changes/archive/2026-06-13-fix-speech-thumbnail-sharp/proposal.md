## Why

The `speech-thumbnail` Vercel Queue handler fails in production with `ERR_DLOPEN_FAILED: libvips-cpp.so.8.18.3: cannot open shared object file` when loading the `sharp` native module on linux-x64. Thumbnail jobs never complete, so speeches stay stuck in `pending`/`processing`/`failed` and publish readiness blocks on missing thumbnails. A partial fix moved PNG→WebP conversion to Modal and removed the direct `sharp` import from the queue worker, but the handler still crashes at module load time—likely because Turbopack bundles or externalizes `sharp` into the server chunk (via Next.js image optimization or a stale deploy). This must be resolved before authors can reliably generate speech cover art.

## What Changes

- Eliminate any runtime dependency on `sharp` from the speech-thumbnail queue worker import graph so the handler can load on Vercel serverless linux-x64.
- Confirm Modal `POST /generate` returns WebP bytes (832×1088) and the Next.js worker uploads them directly without server-side image conversion.
- Harden deployment so linux native binaries are not required by the thumbnail queue route (verify build output, redeploy Modal + Next.js).
- If Next.js still pulls `sharp` into shared server chunks, add targeted Next.js/pnpm configuration so production installs the correct linux-x64 optional dependencies—or isolate the queue handler from image-optimizer bundles.
- Update the `speech-thumbnail-jobs` spec to reflect WebP output from Modal (replacing the outdated PNG requirement).

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `speech-thumbnail-jobs`: Modal `/generate` returns WebP image bytes (not PNG); queue worker SHALL NOT use `sharp` or other native image libraries for format conversion; worker MUST run successfully on Vercel linux-x64.

## Impact

- **Queue worker**: `src/lib/speech-thumbnail-processing.ts`, `src/lib/thumbnail/generateThumbnail.ts`, `src/app/api/queues/speech-thumbnail/route.ts`
- **Modal**: `modal/speech_thumbnail.py` (WebP output; redeploy required)
- **Dependencies**: Remove or avoid `sharp` in the thumbnail path; possible `next.config.ts` or pnpm platform config if Next.js global sharp loading persists
- **CI/deploy**: Redeploy Modal thumbnail app; redeploy Next.js to Vercel after fix
- **Specs**: Delta update to `speech-thumbnail-jobs` for WebP contract and serverless compatibility

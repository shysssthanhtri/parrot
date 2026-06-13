## Context

Speech thumbnails are generated asynchronously via Vercel Queue (`speech-thumbnail`) calling Modal SD 3.5 Medium Turbo (`modal/speech_thumbnail.py`), then uploading to R2 from `src/lib/speech-thumbnail-processing.ts`.

The original implementation converted Modal PNG output to WebP using `sharp` in the queue worker. On Vercel linux-x64, the handler fails at cold start:

```
Failed to load external module sharp: ERR_DLOPEN_FAILED: libvips-cpp.so.8.18.3: cannot open shared object file
```

Commit `cb9a8f1` already removed `sharp` from `package.json` and moved WebP encoding to Modal (Pillow). The worker now passes through WebP bytes from `generateThumbnail()`. If the error persists, causes are likely:

1. **Stale Vercel deployment** still running the pre-fix bundle that imports `sharp`.
2. **Turbopack/Next.js shared server chunk** externalizes `sharp` (Next.js optional dependency for image optimization) into a chunk loaded by the queue route even when app code does not import it.
3. **Platform-specific optional deps** not installed correctly for linux-x64 on Vercel (pnpm may skip non-host platform binaries).

The TTS queue handlers (`speech-tts-*`) do not use `sharp` and run fine—thumbnail should follow the same pattern: pure HTTP + storage + Prisma, no native image libs.

## Goals / Non-Goals

**Goals:**

- `speech-thumbnail` queue handler loads and processes jobs on Vercel linux-x64 without `sharp` or libvips.
- Modal returns final WebP bytes; Next.js uploads them as `image/webp` to `thumbnailR2ObjectKey`.
- Document and verify the deployment steps (Modal redeploy + Vercel redeploy).

**Non-Goals:**

- Changing thumbnail model, resolution, or queue topology.
- Adding a separate image-processing service.
- Fixing Next.js `next/image` optimization globally (only ensure thumbnail queue is unaffected).
- CMS UI or publish-readiness changes.

## Decisions

### 1. Keep image conversion on Modal (Pillow), not Next.js

Modal `generate()` saves WebP at quality 85 via Pillow; `POST /generate` returns `image/webp`. The queue worker uploads the response buffer directly.

**Alternative:** Re-add `sharp` on Next.js with explicit linux optional deps — rejected; adds native dependency to serverless, same class of failure, unnecessary when Modal already has GPU-side Pillow.

### 2. Verify zero `sharp` imports in thumbnail import graph

Audit `src/app/api/queues/speech-thumbnail/route.ts` → `speech-thumbnail-processing` → `generateThumbnail` → `storage` for any direct or transitive `sharp` import. Current code has none; keep it that way.

Add a lightweight guard: grep/CI check or comment in `speech-thumbnail-processing.ts` that native image libs must not be added to this path.

### 3. Isolate queue handler from Turbopack sharp externalization

If production still loads `sharp` after redeploying code without it:

**Option A (preferred):** Add `serverExternalPackages: ['sharp']` to `next.config.ts` so Turbopack does not bundle sharp into server chunks incorrectly. Next.js resolves it at runtime from `node_modules` with correct platform binaries.

**Option B:** Add explicit `sharp` as a dependency pinned to the version Next.js expects (currently `0.34.5` via Next.js optional dep), plus pnpm `supportedArchitectures` in `package.json`:

```json
"pnpm": {
  "supportedArchitectures": {
    "os": ["current", "linux"],
    "cpu": ["current", "x64"]
  }
}
```

This ensures Vercel installs `@img/sharp-linux-x64` and `@img/sharp-libvips-linux-x64` during build.

**Option C:** Set `export const runtime = 'nodejs'` on the queue route (if not already) to avoid edge runtime mismatches.

Apply Option A first if error persists after redeploy; Option B only if Next.js image optimizer requires sharp globally and Option A alone fails.

**Alternative:** `images.unoptimized: true` — rejected; affects all pages, not targeted.

### 4. Redeploy Modal before testing end-to-end

The WebP change in `modal/speech_thumbnail.py` requires running **Deploy Thumbnail Image to Modal** workflow. Until redeployed, Modal may still return PNG while the worker expects WebP—upload would succeed but MIME/key mismatch could confuse clients.

### 5. Update spec contract: WebP not PNG

`speech-thumbnail-jobs` spec still says Modal returns PNG. Update to WebP to match implementation and storage content type (`SPEECH_THUMBNAIL_CONTENT_TYPE = image/webp`).

## Risks / Trade-offs

| Risk                                             | Mitigation                                                                              |
| ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Stale Vercel deployment masks the fix            | Redeploy Next.js after merge; verify build log has no `sharp` in speech-thumbnail chunk |
| Modal not redeployed returns PNG                 | Run deploy workflow; smoke-test `POST /generate` Content-Type                           |
| Next.js global sharp still breaks shared chunks  | `serverExternalPackages` + pnpm `supportedArchitectures`                                |
| WebP quality differs from prior sharp conversion | Pillow quality 85 matches prior sharp setting; acceptable for catalog cards             |

## Migration Plan

1. Merge fix (verify no `sharp` in thumbnail code; apply next.config/pnpm changes if needed).
2. Run **Deploy Thumbnail Image to Modal** (`deploy-modal-thumbnail-image.yml`).
3. Deploy Next.js to Vercel.
4. Create a test speech or trigger `regenerateThumbnail` on an unpublished speech; confirm queue handler completes and `thumbnailProcessStatus` → `finished`.
5. For speeches stuck in `failed` from prior errors, authors can use **Regenerate thumbnail** in CMS.

**Rollback:** Revert next.config/pnpm changes; thumbnail pipeline has no DB migration.

## Open Questions

- None blocking. If error persists after redeploy + Modal update, capture Vercel function logs and inspect `.next/server` output for `sharp` references in the speech-thumbnail chunk.

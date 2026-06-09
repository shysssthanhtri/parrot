## 1. Chunking algorithm fix

- [x] 1.1 Replace period-only `findBreakIndex` with tiered scan: paragraph (`\n\n`) → line (`\n`) → sentence (`.`, `!`, `?`, CJK closers with whitespace/end guard)
- [x] 1.2 Add ellipsis handling: never break on individual `.` inside `...`/`..`/`…`; break after ellipsis only when the next word starts uppercase (or at end of text/window)
- [x] 1.3 Keep existing hard-split fallback and short-text single-chunk behavior unchanged

## 2. Unit tests

- [x] 2.1 Add `src/lib/speech-text-chunking.test.ts` with short-text single-chunk case
- [x] 2.2 Add regression test: `"But sometimes, she felt a little... contained, maybe?"` stays in one chunk when under limit
- [x] 2.3 Add tests for paragraph preference (`\n\n`), line break preference, sentence splits on `!`/`?`, and hard-split when no boundary fits
- [x] 2.4 Add test: `"She paused... Then she left."` breaks after ellipsis when chunking forces a split
- [x] 2.5 Add test: ellipsis with lowercase continuation does not break even when forced to split a longer passage

## 3. Verification

- [x] 3.1 Run unit tests and confirm all pass
- [ ] 3.2 Manual CMS check: generate preview on a script with ellipsis-heavy prose and confirm sync viewer keeps phrases intact

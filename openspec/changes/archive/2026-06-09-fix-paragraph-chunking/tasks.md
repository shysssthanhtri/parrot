## 1. Chunking algorithm fix

- [x] 1.1 Replace period-only `findBreakIndex` with tiered scan: paragraph (`\n\n`) → line (`\n`) → sentence (`.`, `!`, `?`, CJK closers with whitespace/end guard)
- [x] 1.2 Add ellipsis handling: never break on individual `.` inside `...`/`..`/`…`; break after ellipsis only when the next word starts uppercase (or at end of text/window)
- [x] 1.3 Keep existing hard-split fallback and short-text single-chunk behavior unchanged

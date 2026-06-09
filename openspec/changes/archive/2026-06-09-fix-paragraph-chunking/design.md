## Context

`splitTextForTts` in `src/lib/speech-text-chunking.ts` splits long scripts into TTS-safe chunks (default 400 chars). The original `speech-text-chunking` change specified a greedy boundary scan: paragraph → line → sentence → hard-split. The current implementation only scans for periods via `/\.(?:\s|$)/g`, which:

1. Misses paragraph and line breaks entirely
2. Treats each `.` in an ellipsis (`...`) as a sentence end
3. Ignores `!`, `?`, and other closing punctuation

Speech-script-sync (Option B) stores one alignment segment per chunk. Bad chunk boundaries produce incorrect karaoke-style highlights and audible mid-phrase pauses during TTS synthesis.

**Regression example:** With a 400-char limit, text ending in `"... contained, maybe?"` splits after `a little...` because the third period in the ellipsis matches before the real sentence-ending `?`.

## Goals / Non-Goals

**Goals:**

- Implement the documented boundary priority within each `maxChars` window
- Treat ellipsis as a sentence boundary only when the next word starts with an uppercase letter; otherwise keep the phrase together
- Preserve existing function signature and `CHATTERBOX_PROMPT_MAX_CHARS` export
- Add unit tests for ellipsis, paragraph preference, and the reported regression

**Non-Goals:**

- Re-chunking or backfilling alignment on existing persisted speeches
- Word-level or character-level splitting
- Changing the 400-char default limit
- Handling every Unicode ellipsis variant beyond common forms (`...`, `…`)

## Decisions

### Boundary priority: latest break in window, tiered scan

Within each `maxChars` window, find the **latest** (rightmost) valid break, checking tiers in order:

1. **Paragraph** — `\n\n` (include trailing whitespace after the break)
2. **Line** — single `\n` not part of `\n\n`
3. **Sentence** — closing punctuation followed by whitespace or end-of-window:
   - `.`, `!`, `?`, `。`, `！`, `？`
   - For ellipsis (`...`, `..`, or `…`): valid boundary only when the next word (after optional whitespace) starts with an uppercase ASCII letter (`A`–`Z`); otherwise skip
   - Individual `.` characters inside an ellipsis run are never sentence boundaries on their own

If a tier yields a break index > 0, use it. If none found, hard-split at `maxChars`.

**Alternative:** Regex-only single pass — rejected; ellipsis and paragraph tiers need contextual checks that are clearer as explicit scans.

**Alternative:** Break at earliest boundary — rejected; greedy latest break maximizes chunk size and reduces total API calls.

### Ellipsis detection

Ellipsis is detected as `...`, `..`, or Unicode `…` (U+2026). Individual `.` characters within a run are never sentence boundaries on their own.

After a detected ellipsis, skip optional whitespace and inspect the next word's first letter:

- **Uppercase** (`A`–`Z`) → ellipsis ends a sentence; break after the ellipsis (include trailing whitespace)
- **Lowercase** (`a`–`z`) → ellipsis continues the same thought; do not break (e.g. `a little... contained, maybe?`)
- **End of window or text** → treat as a sentence boundary (nothing follows to continue the phrase)

**Example:** `She paused... Then she left.` breaks after `...` because `Then` is uppercase. `She felt a little... contained, maybe?` does not break after `...` because `contained` is lowercase.

**Alternative:** Never break at ellipsis — rejected; legitimate sentence breaks like `Wait... What happened?` would be missed when chunking long text.

### Sentence punctuation set

Extend beyond `.` to `!`, `?`, and common CJK closers (`。`, `！`, `？`), each requiring trailing whitespace or end-of-window—same rule as the archived design.

**Alternative:** Only fix ellipsis on current period logic — rejected; paragraph preference was never implemented and is part of the spec.

### No downstream API changes

`generateLongSpeech`, alignment capture, and the sync viewer continue to consume `splitTextForTts` output unchanged. Chunk text changes only affect newly generated audio.

## Risks / Trade-offs

| Risk                                                                    | Mitigation                                                                                              |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Abbreviations like `Dr.` or `U.S.` split incorrectly                    | Out of scope for v1; same limitation as naive period splitting. Could add abbreviation allowlist later. |
| Decimal numbers (`3.14`) split at the period                            | Period not followed by whitespace/end won't match sentence rule                                         |
| Existing speeches have stale alignment vs re-chunked script             | Alignment is generation-time snapshot; no migration. Regenerate preview to refresh.                     |
| Slightly longer individual chunks when lowercase follows ellipsis       | Fewer API calls; still bounded by `maxChars`                                                            |
| Lowercase after ellipsis that is actually a new sentence (style choice) | Heuristic matches common prose conventions; acceptable trade-off                                        |

## Migration Plan

Deploy as a code-only fix. No database migration. Users who need corrected sync on old speeches regenerate preview or create a new speech.

## Open Questions

- None blocking. Optional follow-up: abbreviation-aware sentence detection if CMS scripts use many honorifics.

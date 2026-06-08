## Why

The speeches list table navigates via a row `onClick` handler and `router.push`, not a real anchor link. That breaks expected link behavior (open in new tab, copy link, keyboard focus, crawler-friendly URLs) and is inconsistent with the scripts and voices tables, which use Next.js `Link` on the primary column. Users expect the script title to be the clickable link to the speech detail page.

## What Changes

- Replace row-level click navigation in `SpeechesTable` with a Next.js `Link` on the script title column
- Match link styling and `prefetch={false}` behavior used by `ScriptsTable` and `VoicesTable`
- Remove the client-only `useRouter` dependency from the speeches table (align with server-friendly table components)
- Update the cms-speeches requirement from "row click" to "script title link" navigation

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `cms-speeches`: Change list navigation from whole-row click to script-title link (`/cms/speeches/{speechId}`)

## Impact

- **Code**: `src/app/(cms)/cms/speeches/_components/speeches-table.tsx` only
- **UI**: Script title becomes an underlined-on-hover link; row no longer shows pointer cursor or handles click
- **Systems**: No API, database, routing, or auth changes

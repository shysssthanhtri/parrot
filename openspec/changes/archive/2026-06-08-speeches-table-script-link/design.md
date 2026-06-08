## Context

`SpeechesTable` is a client component that renders speech rows with an `onClick` handler calling `router.push(ROUTES.CMS.SPEECH_DETAIL(speech.id))`. The scripts and voices list tables already use Next.js `Link` in the first column with `prefetch={false}` and hover underline styling. The speeches table should follow the same pattern so navigation uses a real `<a>` element.

Current implementation:

```tsx
<TableRow
  className="cursor-pointer"
  onClick={() => router.push(ROUTES.CMS.SPEECH_DETAIL(speech.id))}
>
  <TableCell className="font-medium">{speech.script.title}</TableCell>
  ...
</TableRow>
```

## Goals / Non-Goals

**Goals:**

- Script title in the speeches table is a link to `/cms/speeches/{speechId}`
- Link behavior matches `ScriptsTable` and `VoicesTable` (styling, `prefetch={false}`)
- Remove unnecessary client router usage from the table component

**Non-Goals:**

- Making the entire row clickable
- Changing other columns, empty state, or list page layout
- Adding row actions or secondary links

## Decisions

1. **Link on script title only (not whole row)**  
   Matches scripts/voices tables and gives users a clear, copyable URL target. Alternative: keep row click plus link — rejected as redundant and still hides the real href from non-title clicks.

2. **Drop `"use client"` if possible**  
   After removing `useRouter`, the component has no client hooks and can become a server component like `ScriptsTable` and `VoicesTable`. Alternative: keep as client component — rejected without reason to stay client-only.

3. **Reuse existing link classes**  
   Use `className="hover:underline underline-offset-4"` and `prefetch={false}` from peer tables for visual and performance consistency.

## Risks / Trade-offs

- [Users who click non-title cells no longer navigate] → Acceptable; script title is the conventional primary link in sibling tables
- [Minor UX change from row-wide hit target] → Script title remains the obvious affordance with hover underline

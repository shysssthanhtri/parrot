## 1. Topics — adopt page header

- [x] 1.1 Render `CMSPageHeader` with `[{ label: "Topics" }]` on `src/app/(cms)/cms/topics/page.tsx` and remove the in-page `h1`
- [x] 1.2 Update `src/app/(cms)/cms/topics/loading.tsx` to use the same header breadcrumb and remove the standalone `h1`
- [x] 1.3 Add `CMSPageHeader` with **Topics** → **New** breadcrumbs on `src/app/(cms)/cms/topics/new/page.tsx` and remove `TopicFormBackLink`
- [x] 1.4 Add async `src/app/(cms)/cms/topics/[topicId]/layout.tsx` that loads the topic name and renders **Topics** → topic name breadcrumbs
- [x] 1.5 Remove `TopicFormBackLink` from the topic detail page and delete the export from `topic-form.tsx` if unused

## 2. Scripts — adopt page header

- [x] 2.1 Render `CMSPageHeader` with `[{ label: "Scripts" }]` on `src/app/(cms)/cms/scripts/page.tsx` and remove the in-page `h1`
- [x] 2.2 Add `src/app/(cms)/cms/scripts/loading.tsx` with the **Scripts** header breadcrumb and table skeleton matching the list columns
- [x] 2.3 Add `CMSPageHeader` with **Scripts** → **New** breadcrumbs on `src/app/(cms)/cms/scripts/new/page.tsx` and remove `ScriptFormBackLink`
- [x] 2.4 Add async `src/app/(cms)/cms/scripts/[scriptId]/layout.tsx` that loads the script title and renders **Scripts** → script title breadcrumbs
- [x] 2.5 Remove `ScriptFormBackLink` from the script detail page and delete the export from `script-form.tsx` if unused

## 3. Speeches — adopt page header

- [x] 3.1 Render `CMSPageHeader` with `[{ label: "Speeches" }]` on `src/app/(cms)/cms/speeches/page.tsx` and remove the in-page `h1`
- [x] 3.2 Update `src/app/(cms)/cms/speeches/loading.tsx` to use the same header breadcrumb and remove the standalone `h1`
- [x] 3.3 Add `CMSPageHeader` with **Speeches** → **New** breadcrumbs on `src/app/(cms)/cms/speeches/new/page.tsx` and remove `SpeechCreateFormBackLink`
- [x] 3.4 Add async `src/app/(cms)/cms/speeches/[speechId]/layout.tsx` that loads the speech and renders **Speeches** → script title breadcrumbs
- [x] 3.5 Remove `SpeechDetailBackLink` from the speech detail page and delete the export from `speech-detail.tsx` if unused

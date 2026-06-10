## 1. Database

- [x] 1.1 Add `Topic` model to `prisma/schema.prisma` with fields: id, name, description, color, userId, createdAt, updatedAt
- [x] 1.2 Run `prisma migrate dev` to generate and apply the migration

## 2. tRPC Router

- [x] 2.1 Create `src/trpc/routers/topics.ts` with list, create, update, delete procedures
- [x] 2.2 Add `topics.suggestColor` mutation that calls Gemini to suggest a hex color for a topic name
- [x] 2.3 Add input validation (non-empty name, hex color regex) using zod schemas
- [x] 2.4 Register topics router in the app router

## 3. CMS UI - Topics List Page

- [x] 3.1 Create `/cms/topics` page with table displaying name (color badge), description, updatedAt
- [x] 3.2 Add loading skeleton for topics list page
- [x] 3.3 Add empty state when no topics exist
- [x] 3.4 Add row click navigation to `/cms/topics/[topicId]`

## 4. CMS UI - New Topic Page

- [x] 4.1 Create `/cms/topics/new` page with form (name, description, color palette picker)
- [x] 4.2 Add AI suggest color button that calls `topics.suggestColor` and updates the color selection
- [x] 4.3 On successful creation, navigate to the new topic's detail page

## 5. CMS UI - Topic Detail Page

- [x] 5.1 Create `/cms/topics/[topicId]` detail page displaying topic name, description, color
- [x] 5.2 Implement edit form on detail page
- [x] 5.3 Implement delete with confirmation dialog, navigate back to list on success

## 6. CMS Sidebar

- [x] 6.1 Add "Topics" navigation link to CMS sidebar after "Scripts"

## MODIFIED Requirements

### Requirement: Landing page metadata

The app SHALL expose Parrot-specific document metadata for the landing page, including a title and description suitable for end-user learners (not CMS operators). The landing page SHALL also expose Open Graph and Twitter Card metadata with title, description, and a share image at `/og-image.png` (1200×630 recommended). The document title SHALL NOT duplicate the root layout title suffix (e.g. SHALL NOT render as `Parrot — Language shadowing practice | Parrot`).

#### Scenario: Landing page title

- **WHEN** an unauthenticated user loads `/`
- **THEN** the document title identifies the product as Parrot for language shadowing without a duplicated site suffix

#### Scenario: Social share preview includes image

- **WHEN** a social platform crawler fetches Open Graph metadata for `/`
- **THEN** an `og:image` (or equivalent) tag points to an absolute URL for `/og-image.png`

#### Scenario: Social share preview includes description

- **WHEN** a social platform crawler fetches Open Graph metadata for `/`
- **THEN** the description describes language shadowing practice for learners

## ADDED Requirements

### Requirement: Landing page structured data

The landing page SHALL include JSON-LD structured data describing Parrot as a language-learning web application, including site name, URL, and description.

#### Scenario: Structured data present in HTML

- **WHEN** a crawler or developer inspects the HTML source of `/`
- **THEN** a `application/ld+json` script block is present with WebSite or SoftwareApplication schema

### Requirement: Static landing page SEO compatibility

Landing page SEO metadata and structured data SHALL be statically emitted at build time. The `(marketing)` landing page SHALL remain compatible with `export const dynamic = "force-static"` and SHALL NOT require per-request dynamic data for SEO tags.

#### Scenario: SEO metadata does not force dynamic rendering

- **WHEN** the application is built for production
- **THEN** `/` remains statically prerendered with SEO metadata embedded in the HTML

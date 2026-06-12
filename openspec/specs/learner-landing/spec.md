# learner-landing Specification

## Purpose

TBD - created by archiving change learner-landing-page. Update Purpose after archive.

## Requirements

### Requirement: Public marketing landing page

The app SHALL provide a learner-focused marketing landing page at `/` outside the CMS layout. The page SHALL NOT require authentication to view. Signed-in users MAY view the landing page without being redirected.

#### Scenario: Guest views landing page

- **WHEN** an unauthenticated user navigates to `/`
- **THEN** the marketing landing page is displayed without redirecting to sign-in

#### Scenario: Signed-in user views landing

- **WHEN** an authenticated user navigates to `/`
- **THEN** the marketing landing page is displayed without redirecting to `/learn`

#### Scenario: Landing route constant

- **WHEN** application code references the public landing route
- **THEN** `ROUTES.PUBLIC.HOME` resolves to `/`

### Requirement: Static landing page rendering

The marketing landing page at `/` SHALL be statically generated at build time. The `(marketing)` route group SHALL NOT call `auth()` or other per-request dynamic data sources in its layout or page components.

#### Scenario: Landing page is statically prerendered

- **WHEN** the application is built for production
- **THEN** `/` is emitted as static HTML without requiring a server session lookup per request

#### Scenario: Guest and signed-in users see the same landing HTML

- **WHEN** any user navigates to `/`
- **THEN** the same static marketing content is served regardless of authentication state

### Requirement: Landing page site header

The landing page SHALL include a site header with the Parrot brand name or logo and a primary navigation control labeled **Go to learner space** that links to `/learn`. The header SHALL NOT display sign-in, sign-up, or sign-out controls on the marketing landing route.

#### Scenario: Header shows learner space entry point

- **WHEN** a user views the landing page header
- **THEN** a **Go to learner space** control is visible in the top-right navigation area

#### Scenario: Header link targets learner space

- **WHEN** a user activates **Go to learner space** from the landing page header
- **THEN** the app navigates to `/learn`

### Requirement: Landing page hero section

The landing page SHALL include a hero section above the fold with a learner-focused headline, supporting subheadline, and a static primary call-to-action. The primary CTA SHALL navigate to sign-up and SHALL NOT vary based on session state. The hero SHALL use shadcn/ui components and project theme tokens.

#### Scenario: Hero displays learner value proposition

- **WHEN** a user views `/`
- **THEN** a hero section with headline, subheadline, and primary CTA is visible without scrolling on typical desktop viewports

#### Scenario: Primary CTA navigates to signup

- **WHEN** a user activates the hero primary call-to-action
- **THEN** the app navigates to `/signup`

### Requirement: Landing page how-it-works section

The landing page SHALL include a static "How it works" section below the hero describing the shadowing flow in three steps (browse speeches, listen and follow along, practice out loud). The section SHALL NOT require authentication or live catalog data.

#### Scenario: How-it-works visible on landing

- **WHEN** an unauthenticated user scrolls the landing page
- **THEN** a three-step how-it-works section is displayed below the hero

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

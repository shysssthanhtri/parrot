## ADDED Requirements

### Requirement: Site metadata base URL

The application SHALL configure a canonical site base URL used to resolve absolute metadata links (Open Graph images, sitemap, canonical URLs). The base URL SHALL be derived from `NEXT_PUBLIC_APP_URL` when set, with a development fallback of `http://localhost:3000`.

#### Scenario: Production metadata uses configured hostname

- **WHEN** the application is built or served with `NEXT_PUBLIC_APP_URL=https://parrot.shyss.space`
- **THEN** metadata and sitemap entries use `https://parrot.shyss.space` as the site origin

#### Scenario: Local development fallback

- **WHEN** `NEXT_PUBLIC_APP_URL` is not set in local development
- **THEN** the site origin defaults to `http://localhost:3000`

### Requirement: Root layout default metadata

The root application layout SHALL export default document metadata including site name, title template, default description, Open Graph site name, and Twitter card type (`summary_large_image`). The layout SHALL set `metadataBase` to the site origin.

#### Scenario: Child pages inherit site defaults

- **WHEN** a public page does not override Open Graph site name
- **THEN** crawlers receive consistent Parrot branding from the root layout defaults

### Requirement: Robots directives file

The application SHALL serve a `robots.txt` at `/robots.txt` generated at build time. The file SHALL allow indexing of public marketing and auth entry routes and SHALL disallow crawling of `/cms`, `/learn`, and `/api` paths. The file SHALL reference the sitemap URL.

#### Scenario: Crawler requests robots.txt

- **WHEN** a search engine crawler requests `/robots.txt`
- **THEN** the response includes disallow rules for `/cms`, `/learn`, and `/api` and a sitemap URL

#### Scenario: Public routes are allowed

- **WHEN** a search engine crawler reads `/robots.txt`
- **THEN** the root path `/` is not disallowed

### Requirement: XML sitemap

The application SHALL serve a sitemap at `/sitemap.xml` listing indexable public routes: `/`, `/signin`, and `/signup`. Each entry SHALL include an absolute URL using the site origin.

#### Scenario: Sitemap lists landing page

- **WHEN** a crawler or tool requests `/sitemap.xml`
- **THEN** the sitemap includes an entry for `/` with an absolute URL

#### Scenario: Sitemap excludes authenticated areas

- **WHEN** a crawler or tool requests `/sitemap.xml`
- **THEN** the sitemap does not include `/cms`, `/learn`, or API routes

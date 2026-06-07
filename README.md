# Parrot

Parrot is a Next.js application with local PostgreSQL development support through Docker Compose.

## Local Development

### Bootstrap the environment

Run the following from the repository root:

```bash
make bootstrap
```

This target will:

- install project dependencies with `pnpm`
- start PostgreSQL using [docker/docker-compose.yml](docker/docker-compose.yml)
- append `DATABASE_URL` to `.env` if it is missing

The generated local database connection string is:

```bash
postgresql://parrot:parrot@localhost:5432/parrot?schema=public
```

### Start the application

After bootstrap finishes, run:

```bash
make migrate-deploy
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

`make migrate-deploy` applies the Prisma migrations in [prisma/migrations](prisma/migrations) to the database configured by `DATABASE_URL`.

### Voice audio storage

Voice audio uses a storage driver selected by `STORAGE_DRIVER`:

| Driver                       | When               | Behavior                                                                                                         |
| ---------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `local` (default in dev)     | Local development  | Serves files from [data/system-voices](data/system-voices) via `/api/storage/*`; uploads go to `.local-storage/` |
| `r2` (default in production) | Staging/production | Cloudflare R2 via the AWS S3 SDK                                                                                 |

Copy [.env.example](.env.example) for auth and database settings. R2 variables are only required when `STORAGE_DRIVER=r2`:

| Variable               | Description                                                              |
| ---------------------- | ------------------------------------------------------------------------ |
| `STORAGE_DRIVER`       | Optional; `local` or `r2`                                                |
| `LOCAL_STORAGE_DIR`    | Optional; defaults to `.local-storage`                                   |
| `R2_ACCOUNT_ID`        | Cloudflare account ID                                                    |
| `R2_ACCESS_KEY_ID`     | R2 API token access key ID                                               |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret access key                                           |
| `R2_BUCKET_NAME`       | Target R2 bucket name                                                    |
| `R2_ENDPOINT`          | Optional; defaults to `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com` |

Storage helpers live in [src/lib/storage](src/lib/storage) (`uploadObject`, `getAudioUrl`).

Seed system voices from [data/system-voices](data/system-voices) (no R2 credentials needed in local mode):

```bash
make migrate-deploy
pnpm prisma db seed
```

To test against R2 locally, set `STORAGE_DRIVER=r2` and configure the R2 variables above.

Use **R2 S3 API credentials** (Access Key ID + Secret Access Key from the R2 API token page), not a Cloudflare `cfat_` account API token.

When saving speeches with `STORAGE_DRIVER=r2`, the CMS uploads preview audio directly to R2 via presigned PUT URLs. Configure bucket CORS to allow `PUT` from your CMS origin (e.g. `http://localhost:3000` in development), for example:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-production-domain"
    ],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

If seed fails with an XML/HTML parse error or HTTP 403, check that your network allows HTTPS to `*.r2.cloudflarestorage.com`. Corporate proxies (e.g. Zscaler) often block this endpoint until it is allowlisted.

### OpenAPI clients

External HTTP APIs are integrated with [openapi-typescript](https://github.com/openapi-ts/openapi-typescript) (type generation) and [openapi-fetch](https://github.com/openapi-ts/openapi-typescript/tree/main/packages/openapi-fetch) (typed runtime client).

Committed OpenAPI snapshots live under [openapi/](openapi/). Mappings from snapshot to generated types are listed in [openapi/generate.config.json](openapi/generate.config.json). The first API is Chatterbox TTS ([src/lib/chatterbox](src/lib/chatterbox)).

Regenerate types from snapshots (no network required):

```bash
pnpm generate:api              # all configured APIs
pnpm generate:api chatterbox     # one API (matches the snapshot filename stem)
```

Generated `schema.d.ts` files are committed so `pnpm typecheck` works without running generate first. Re-run `pnpm generate:api` after updating a snapshot.

#### Adding another API

1. **Save an OpenAPI snapshot** — fetch the spec from the running service and commit it:

   ```bash
   curl -s "$MY_API_URL/openapi.json" -o openapi/my-api.openapi.json
   ```

   Use a committed file rather than fetching at generate time so CI and offline dev stay reliable.

2. **Register the mapping** in [openapi/generate.config.json](openapi/generate.config.json):

   ```json
   {
     "input": "openapi/my-api.openapi.json",
     "output": "src/lib/my-api/schema.d.ts"
   }
   ```

3. **Generate types**:

   ```bash
   pnpm generate:api my-api
   ```

4. **Add a server-only client module** in `src/lib/my-api/`:
   - `schema.d.ts` — generated; do not edit by hand
   - `client.ts` — `createMyApiClient()` using `openapi-fetch`, `import "server-only"`, and env vars from [src/lib/env.ts](src/lib/env.ts)
   - optional helpers (e.g. `generate.ts`) for common operations
   - `index.ts` — re-exports for consumers

   Follow [src/lib/chatterbox](src/lib/chatterbox) as the reference. Keep API keys and base URLs server-side only; never import these modules from client components.

5. **Document env vars** in [.env.example](.env.example) and add validation in `src/lib/env.ts`.

When the upstream API changes, refresh its snapshot and run `pnpm generate:api <name>` again.

## Useful Commands

```bash
make bootstrap  # install deps, configure .env, and start postgres
make dev-up     # start postgres only
make dev-down   # stop postgres
make migrate-deploy  # apply Prisma migrations
pnpm dev        # start the Next.js dev server
pnpm prisma db seed  # upsert system voice rows (uploads to R2 when STORAGE_DRIVER=r2)
pnpm generate:api   # regenerate OpenAPI TypeScript types from openapi/*.openapi.json
```

## PostgreSQL Service

The local database service is defined in [docker/docker-compose.yml](docker/docker-compose.yml) with these defaults:

- image: `postgres:16-alpine`
- host port: `5432`
- database: `parrot`
- username: `parrot`
- password: `parrot`

Data is persisted in the Docker volume `postgres_data`.

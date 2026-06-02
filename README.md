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

| Driver | When | Behavior |
|--------|------|----------|
| `local` (default in dev) | Local development | Serves files from [data/system-voices](data/system-voices) via `/api/storage/*`; uploads go to `.local-storage/` |
| `r2` (default in production) | Staging/production | Cloudflare R2 via the AWS S3 SDK |

Copy [.env.example](.env.example) for auth and database settings. R2 variables are only required when `STORAGE_DRIVER=r2`:

| Variable | Description |
|----------|-------------|
| `STORAGE_DRIVER` | Optional; `local` or `r2` |
| `LOCAL_STORAGE_DIR` | Optional; defaults to `.local-storage` |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 API token access key ID |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret access key |
| `R2_BUCKET_NAME` | Target R2 bucket name |
| `R2_ENDPOINT` | Optional; defaults to `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com` |

Storage helpers live in [src/lib/storage](src/lib/storage) (`uploadObject`, `getAudioUrl`).

Seed system voices from [data/system-voices](data/system-voices) (no R2 credentials needed in local mode):

```bash
make migrate-deploy
pnpm prisma db seed
```

To test against R2 locally, set `STORAGE_DRIVER=r2` and configure the R2 variables above.

Use **R2 S3 API credentials** (Access Key ID + Secret Access Key from the R2 API token page), not a Cloudflare `cfat_` account API token.

If seed fails with an XML/HTML parse error or HTTP 403, check that your network allows HTTPS to `*.r2.cloudflarestorage.com`. Corporate proxies (e.g. Zscaler) often block this endpoint until it is allowlisted.

## Useful Commands

```bash
make bootstrap  # install deps, configure .env, and start postgres
make dev-up     # start postgres only
make dev-down   # stop postgres
make migrate-deploy  # apply Prisma migrations
pnpm dev        # start the Next.js dev server
pnpm prisma db seed  # upsert system voice rows (uploads to R2 when STORAGE_DRIVER=r2)
```

## PostgreSQL Service

The local database service is defined in [docker/docker-compose.yml](docker/docker-compose.yml) with these defaults:

- image: `postgres:16-alpine`
- host port: `5432`
- database: `parrot`
- username: `parrot`
- password: `parrot`

Data is persisted in the Docker volume `postgres_data`.

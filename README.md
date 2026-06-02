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

### Cloudflare R2 (voice audio storage)

Voice audio files are stored in Cloudflare R2 via the AWS S3 SDK. Copy [.env.example](.env.example) and set:

| Variable | Description |
|----------|-------------|
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 API token access key ID |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret access key |
| `R2_BUCKET_NAME` | Target R2 bucket name |
| `R2_ENDPOINT` | Optional; defaults to `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com` |

R2 helpers live in [src/lib/r2.ts](src/lib/r2.ts) (`uploadObject`, `getPresignedGetUrl`).

## Useful Commands

```bash
make bootstrap  # install deps, configure .env, and start postgres
make dev-up     # start postgres only
make dev-down   # stop postgres
make migrate-deploy  # apply Prisma migrations
pnpm dev        # start the Next.js dev server
```

## PostgreSQL Service

The local database service is defined in [docker/docker-compose.yml](docker/docker-compose.yml) with these defaults:

- image: `postgres:16-alpine`
- host port: `5432`
- database: `parrot`
- username: `parrot`
- password: `parrot`

Data is persisted in the Docker volume `postgres_data`.

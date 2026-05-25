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
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Useful Commands

```bash
make bootstrap  # install deps, configure .env, and start postgres
make dev-up     # start postgres only
make dev-down   # stop postgres
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

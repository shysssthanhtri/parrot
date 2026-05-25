COMPOSE_FILE := docker/docker-compose.yml
DATABASE_URL := postgresql://parrot:parrot@localhost:5432/parrot?schema=public

.PHONY: help bootstrap dev-up dev-down migrate-deploy

help:
	@printf "Available targets:\n"
	@printf "  make bootstrap  Install deps, start Postgres, and seed DATABASE_URL in .env if missing\n"
	@printf "  make dev-up     Start local Postgres\n"
	@printf "  make dev-down   Stop local Postgres\n"
	@printf "  make migrate-deploy  Apply Prisma migrations to the configured database\n"

bootstrap:
	@if ! grep -q '^DATABASE_URL=' .env 2>/dev/null; then \
		printf '\nDATABASE_URL=%s\n' '$(DATABASE_URL)' >> .env; \
		printf 'Added DATABASE_URL to .env\n'; \
	fi
	corepack pnpm install
	docker compose -f $(COMPOSE_FILE) up -d

dev-up:
	docker compose -f $(COMPOSE_FILE) up -d

dev-down:
	docker compose -f $(COMPOSE_FILE) down

migrate-deploy:
	pnpm prisma migrate deploy

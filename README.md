# Lodestar

AI-powered networking OS for conferences. Turns event contacts into ranked next actions with briefings, cultural notes, and follow-up drafts.

> Scan the room. Know who matters. Follow up before the opportunity goes cold.

## Local Development

Go from a fresh clone to a fully-seeded, running demo in one command sequence.

### Prerequisites

- Node.js 18+
- Docker Desktop (for the MySQL container)

### Steps

```bash
# 1. Clone and enter the repo
git clone <repo-url> lodestar
cd lodestar

# 2. Install dependencies
npm install

# 3. Create your local env file
#    DATABASE_URL is already set for the docker-compose MySQL; no edits needed for the demo.
cp .env.example .env.local

# 4. Start MySQL (and the rest of the stack). Wait ~10s for MySQL to be ready.
docker compose up -d

# 5. Apply the 2 committed migrations and seed the demo data (6 contacts).
npm run demo:setup

# 6. Run the dev server
npm run dev
```

Then open: **http://localhost:3000/events/cle00000000000000000001**

> The seeded event resolves because the mock `getCurrentUser()` returns user id
> `clu00000000000000000001`, which matches the seed event's `userId`. No auth is
> wired up yet — the mock user is the owner of all seed data.

`npm run demo:setup` runs `prisma migrate deploy` (applies the committed migrations
in `prisma/migrations/` — the source of truth) followed by `prisma db seed`. The
seed is idempotent (upserts), so it is safe to re-run.

### Troubleshooting / Reset

```bash
# Wipe the database volume and start completely fresh
docker compose down -v
docker compose up -d        # wait ~10s for MySQL
npm run demo:setup
```

- **`migrate deploy` can't reach the database** — MySQL may not be ready yet. Wait a
  few seconds after `docker compose up -d` and retry.
- **Port 3306 already in use** — another MySQL is running locally. Stop it, or change
  the host port mapping in `docker-compose.yml`.
- **Event page 404s** — confirm the seed ran (`npm run demo:setup`) and that you used
  the demo event id `cle00000000000000000001` in the URL.

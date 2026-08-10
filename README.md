# Media Timeline

A self-hosted, custom watch-order timeline for movies and TV shows. Built for
a Marvel viewing order, but not hardcoded to it — use it for any franchise,
any list, any order.

- Next.js 14 (App Router) + TypeScript
- PostgreSQL 18 + Prisma
- Docker Compose, one-command deploy
- TMDB metadata by default; OMDb and TVDB as optional extra providers
- Drag-and-drop custom ordering, categories, notes, status tracking, export/import

---

## 1. Requirements

- Docker and Docker Compose (v2, i.e. the `docker compose` command)
- A free [TMDB API key](https://www.themoviedb.org/settings/api) — this is
  what powers metadata lookups for movies, shows, and seasons out of the box

That's it. Postgres runs inside Docker with a persistent volume — you don't
need to install Postgres or Node.js yourself.

---

## 2. Installation

```bash
git clone <your-fork-or-copy-of-this-repo>
cd media-timeline
cp .env.example .env
nano .env   # set POSTGRES_PASSWORD, TMDB_API_KEY, AUTH_USERNAME, AUTH_PASSWORD
docker compose up -d
```

Then open **http://localhost:3000**.

The public timeline is read-only until you log in. Click **Login** (top
right) and use the `AUTH_USERNAME` / `AUTH_PASSWORD` you set in `.env` to
reach `/admin`, where you can add entries, reorder, edit, and manage
categories.

### First run

On first start, the app automatically runs Prisma migrations against the
Postgres container (see `docker-entrypoint.sh`) — there's no manual
migration step for a fresh install. The database starts empty; there's no
demo/Marvel data seeded into production automatically (see [Seed data](#9-seed--demo-data)
if you want some for local development).

---

## 3. Environment variables

All variables live in `.env` (copy from `.env.example`). Key ones:

| Variable | Required | Notes |
|---|---|---|
| `POSTGRES_PASSWORD` | Yes | Set this to something random; used to build `DATABASE_URL` automatically inside Docker Compose |
| `TMDB_API_KEY` | Recommended | Enables movie/show/season metadata lookups. Free at themoviedb.org |
| `TVDB_API_KEY` / `TVDB_PIN` | Optional | Enables the TVDB provider option. PIN only needed if your TVDB account requires one |
| `OMDB_API_KEY` | Optional | Enables the OMDb provider (IMDb-id based; movies/shows only, no season support) |
| `AUTH_USERNAME` / `AUTH_PASSWORD` | Yes | Protects `/admin`, `/settings`, and all write operations. The `/` timeline stays viewable without login (read-only) |
| `AUTH_PASSWORD_HASH` | Optional | Use a bcrypt hash instead of a plaintext password (takes precedence over `AUTH_PASSWORD` if set) — see below |
| `NEXT_PUBLIC_APP_NAME` | No | Shown in the header, e.g. "Marvel Timeline" |
| `APP_PORT` | No | Host port to expose (default `3000`) |

Any provider left blank is simply disabled in the Add Entry UI — the app
never crashes because a key is missing.

### Generating a bcrypt password hash (optional, more secure)

```bash
docker run --rm node:20-alpine node -e "console.log(require('bcryptjs').hashSync('yourpassword', 10))"
```

Put the result in `AUTH_PASSWORD_HASH` and leave `AUTH_PASSWORD` blank.

---

## 4. Adding your first entries

1. Log in and go to `/admin`.
2. Click **+ Add Entry**.
3. Pick a provider (TMDB by default) and paste an ID or URL:
   - `tt0120611` (IMDb id)
   - `1771` (a numeric TMDB/TVDB id)
   - `https://www.imdb.com/title/tt0120611/` (a full URL — the id is
     extracted automatically)
   - For a **season**, check "This is a TV season" and enter the *show's*
     ID plus the season number.
4. Review the metadata preview, optionally assign a category, and confirm.
5. Reorder anything by dragging rows in `/admin` — order saves immediately
   (you'll see a small "Saved" indicator).

Duplicate imports are caught automatically by provider ID before they're
added, with an option to add anyway.

---

## 5. Database migrations

Migrations run automatically on container startup. If you change
`prisma/schema.prisma` yourself and want to create a new migration:

```bash
# with the stack running
docker compose exec app npx prisma migrate dev --name your_change_name
```

Or generate the SQL without applying it (e.g. to review before deploying):

```bash
docker compose exec app npx prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma --script
```

---

## 6. Logs

```bash
docker compose logs -f app
docker compose logs -f postgres
```

---

## 7. Updating the app

```bash
git pull
docker compose build app
docker compose up -d
```

Migrations for any schema changes run automatically on the next start.

---

## 8. Backup and restore

### Backup

```bash
./scripts/backup.sh
```

Writes a timestamped `pg_dump` file to `backups/`. Equivalent manual command:

```bash
docker compose exec postgres pg_dump -U timeline timeline > backups/manual-backup.sql
```

### Restore

```bash
./scripts/restore.sh backups/timeline-20260101-120000.sql
```

This drops and recreates the `public` schema before restoring — you'll be
asked to confirm first.

### JSON export/import (portable, app-level)

Separately from full database backups, `/settings` has **Export Timeline**
and **Import Timeline** buttons that download/upload a `timeline-export.json`
file containing your entries, categories, and cached metadata — handy for
moving to a new server or keeping a lightweight backup outside Postgres.

---

## 9. Seed / demo data

For local development only (never runs automatically in production):

```bash
docker compose exec app npm run seed
```

This adds a few fictional demo entries (not Marvel content) if your
timeline is empty, so you can see the UI populated. It's a no-op if you
already have entries.

---

## 10. Metadata provider setup

- **TMDB** (recommended, default): create a free account at
  [themoviedb.org](https://www.themoviedb.org/settings/api), request an API
  key (the "API Read Access" v3 key works), and set `TMDB_API_KEY`. Supports
  movies, shows, and seasons, plus resolving IMDb IDs automatically.
- **OMDb**: get a key at [omdbapi.com](https://www.omdbapi.com/apikey.aspx).
  Only supports IMDb-style IDs (`tt...`) and does not support season-level
  lookups — use TMDB for those.
- **TVDB**: get a v4 API key at
  [thetvdb.com](https://thetvdb.com/api-information). This integration
  covers the common fields on TVDB's free tier; if your account needs a
  subscriber PIN for certain fields, set `TVDB_PIN` too. TVDB's API has
  had tier-related changes over time, so double check results after adding
  your key — if something looks off, TMDB is the more battle-tested option
  in this app.

You can mix and match — leave any of these blank and that provider option
simply won't appear as selectable in Add Entry.

---

## 11. Troubleshooting

**"TMDB isn't configured" when adding an entry**
Add `TMDB_API_KEY` (or the relevant provider's key) to `.env` and restart:
`docker compose up -d` (Compose picks up the new env value on recreate).

**"Metadata provider unavailable"**
The provider's API didn't respond. Your existing timeline data is
unaffected — try again in a moment.

**Migrations fail on first start**
The app retries `prisma migrate deploy` for up to a minute while Postgres
finishes starting up (see `docker-entrypoint.sh`). If it still fails after
that, check `docker compose logs postgres` for startup errors — most often
a `POSTGRES_PASSWORD` mismatch between an existing volume and a changed
`.env`. If you're sure it's safe to lose existing data, remove the volume
with `docker compose down -v` and start fresh.

**Forgot the admin password**
Edit `AUTH_PASSWORD` (or `AUTH_PASSWORD_HASH`) in `.env`, then
`docker compose up -d` to recreate the app container with the new value.

**Posters not loading**
Check that the poster's image host is allowed in `next.config.js`'s
`images.remotePatterns` — TMDB (`image.tmdb.org`) is included by default;
add others there if you extend the provider layer.

---

## 12. Security notes

- PostgreSQL is **not** exposed to the host — `docker-compose.yml`
  intentionally has no `ports:` mapping on the `postgres` service. Only the
  `app` container can reach it, over an internal Docker network.
- All metadata API keys stay server-side; nothing is sent to the browser.
- All mutating API routes require an authenticated admin session
  (httpOnly, signed cookie). The public `/` timeline is read-only.
- All input is validated with Zod before touching the database; all queries
  go through Prisma (parameterized, no raw SQL string building).
- If you put this behind a reverse proxy on the open internet, terminate
  TLS there (e.g. Caddy, nginx, Traefik) — this app itself serves plain
  HTTP on `APP_PORT`.

---

## 13. Project structure

```
src/
├── app/
│   ├── page.tsx           # public timeline
│   ├── admin/              # drag-reorder dashboard (auth-gated)
│   ├── settings/           # categories, providers, backup/import (auth-gated)
│   ├── login/
│   └── api/                 # entries, reorder, metadata, categories, export/import, auth
├── components/
│   ├── timeline/            # TimelineView, TimelineCard, AddEntryModal, etc.
│   ├── admin/
│   ├── settings/
│   └── ui/
├── lib/
│   ├── db/                  # Prisma client, media upsert/dedupe helpers
│   ├── metadata/             # MetadataProvider interface + TMDB/OMDb/TVDB implementations
│   ├── auth/                 # session + auth guards
│   ├── validation/            # Zod schemas
│   └── utils/                 # fractional ordering helpers
└── types/
```

The metadata layer is intentionally decoupled from the rest of the app
(`src/lib/metadata/types.ts` defines the `MetadataProvider` interface) —
adding a new provider means implementing that interface and registering it
in `src/lib/metadata/index.ts`, without touching the UI or API routes.

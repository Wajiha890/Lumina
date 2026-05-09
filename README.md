# Lumina

Full-stack media gallery: **Node.js (Express) + Sequelize** API and **React (Vite)** SPA. PostgreSQL in Docker (or SQLite for a local file DB). JWT auth; creator uploads media and manages users; consumers browse, search, rate, react, and comment.

---

## Default admin (fresh database)

After the API starts and creates tables, it seeds a creator if none exists:

- **Username:** `Wajiha`
- **Password:** `Wajiha123`  
  Override with `SEED_CREATOR_USERNAME` / `SEED_CREATOR_PASSWORD` in the environment.

If you previously ran the **Python** app against the same Postgres volume, table names differ. Reset the DB volume once:

```bash
docker compose down -v
docker compose up --build
```

---

## Tech stack

| Layer    | Stack                          |
| -------- | ------------------------------ |
| API      | Node 20, Express, Sequelize    |
| DB       | PostgreSQL (Docker) or SQLite |
| Web UI   | React 18, React Router, Vite   |

---

## Local development (Node + npm)

**Backend** (from `backend/`):

```bash
npm install
set DATABASE_URL=postgresql://user:pass@localhost:5433/pixshare
node src/index.js
```

Or SQLite:

```bash
set DATABASE_URL=sqlite:./media.db
node src/index.js
```

**Frontend** (from `frontend/`):

```bash
npm install
set VITE_API_BASE=http://127.0.0.1:5000
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). Set `VITE_API_BASE` to your API origin (no trailing slash).

---

## Docker Compose

```bash
docker compose up --build
```

| Service    | URL (defaults) |
| ---------- | -------------- |
| React (Vite) | http://127.0.0.1:5510 |
| API        | http://127.0.0.1:5010 |
| Postgres (host tools) | `127.0.0.1:5433` — DB `pixshare`, user `pixshare_user`, password `pixshare_password` |

The frontend container sets `VITE_API_BASE` so the browser can call the API on your machine.

Override ports if needed:

```powershell
$env:BACKEND_HOST_PORT="5020"; $env:FRONTEND_HOST_PORT="5520"; docker compose up --build
```

---

## API

Same REST contract as before: `/signup`, `/login`, `/me`, `/images`, `/images/search`, `/images/:id`, `/comments`, `/ratings`, `/reactions`, `/users`, etc. Static uploads are served at `/uploads/…`.

---

## Project layout

- `backend/src/` — Express app (`index.js`, `app.js`, `db.js`)
- `frontend/src/` — React pages and `api.js` (API base from `VITE_API_BASE` or fallbacks)

Legacy Python and static HTML files have been removed.

# Chuddy List — Setup Guide

A Geometry Dash–style demon list: public site + local admin panel, backed by Supabase.

---

## Files

```
index.html               Public site (GitHub Pages)
admin.html               Admin panel — open locally, keep private
supabase_setup.sql       Run once in Supabase to create tables + seed data

assets/
  list_icon.png          Logo / favicon

css/
  shared/base.css        Design tokens (colours, fonts), reset, scrollbar, keyframes
  site/layout.css        Header, nav, theme picker, sidebar, responsive layout
  site/components.css    Shared bits: headings, stat cards, chips, buttons, lightbox, status bar
  site/list.css          Level page (hero, verification video, records)
  site/leaderboard.css   Leaderboard page
  site/profile.css       Player profile page
  site/roulette.css      Roulette page
  admin/layout.css       Admin login, header, nav, panels
  admin/components.css   Admin forms, buttons, tables, modals, toast

js/
  shared/utils.js        esc(), dates, YouTube ID parsing, scoring formula (calcPoints)
  site/config.js         ← Supabase URL + anon key go here
  site/placeholder-data.js  Demo data used when Supabase isn't reachable
  site/state.js          Global state, player stats / points
  site/api.js            Loads demons + records from Supabase
  site/ui.js             Status bar, video lightbox, mobile sidebar
  site/theme.js          Accent colour picker
  site/sidebar.js        Level list + search
  site/demon.js          Level detail page
  site/leaderboard.js    Leaderboard page
  site/profile.js        Player profile page
  site/roulette.js       Roulette page
  site/router.js         URL routing (#/demon/3, #/player/Name, …)
  site/main.js           Startup, click delegation, keyboard shortcuts
  admin/api.js           Supabase REST helpers (service_role)
  admin/ui.js            Toast, panels, modals, busy guard
  admin/data.js          Loads everything, fills dropdowns
  admin/dashboard.js     Dashboard panel
  admin/demons.js        Demon CRUD + rank shifting
  admin/records.js       Record CRUD
  admin/players.js       Player CRUD
  admin/auth.js          Sign in / out, session restore

_backup/                 The original single-file index.html / admin.html
```

The scripts are plain `<script>` files (not ES modules) loaded in order, so both
pages still work when opened straight from disk via `file://`.

---

## Step 1 — Create a Supabase project

1. Go to **supabase.com** and create a free account
2. Click **New Project**, give it a name (e.g. "chuddy-list")
3. Set a strong database password — save it somewhere
4. Wait ~2 minutes for the project to spin up

## Step 2 — Run the SQL setup

1. In your Supabase dashboard, go to **SQL Editor**
2. Paste the entire contents of `supabase_setup.sql`
3. Click **Run**

This creates the 3 tables, sets up Row Level Security and seeds placeholder data.
It's safe to re-run on an existing database — it also adds the `attempts` and
`video_id` record columns if they're missing.

## Step 3 — Get your API keys

In **Settings → API**:

- **Project URL** → looks like `https://xyzabc.supabase.co`
- **anon public key** → used by the public site (safe to expose, read-only)
- **service_role key** → used by the admin panel (keep this SECRET, write access)

## Step 4 — Configure the public site

Open `js/site/config.js` and set:

```js
const SUPABASE_URL = "https://xyzabc.supabase.co";
const SUPABASE_ANON_KEY = "eyJ…";
```

If Supabase is unreachable the site automatically falls back to the demo data
in `js/site/placeholder-data.js`.

## Step 5 — Deploy to GitHub Pages

1. Push the repo (at minimum `index.html`, `assets/`, `css/`, `js/`)
2. **Settings → Pages**, set the source to your main branch
3. Your site is live at `https://yourusername.github.io/your-repo/`

`admin.html` contains no keys (you type them in at sign-in), but there's no
reason to publish it — keep it local.

## Step 6 — Use the admin panel

Open `admin.html` **locally** (double-click it). Enter your Project URL,
service_role key and an admin password. Tick *Stay signed in* to survive page
refreshes until the tab is closed.

- **Dashboard** — totals, recent records, levels nobody has beaten yet
- **Demons** — add / edit / delete, ▲▼ to move a level one spot; changing a
  rank slides the levels in between so there are never gaps or duplicates
- **Records** — filter by demon / player / completion, sortable columns,
  optional attempts + completion video
- **Players** — name + flag emoji, jump to a player's records

All forms submit with **Enter**, and **Esc** closes dialogs.

---

## Public site features

- Every page has its own link — `#/demon/3`, `#/leaderboard`, `#/roulette`,
  `#/player/Name` — so you can share them and Back/Forward work
- Keyboard: **/** search, **↑ ↓** browse levels, **Enter** opens the top search
  result, **Esc** closes the video / menus
- Level pages show the video thumbnail as the header, prev/next level buttons,
  completions and in-progress records separately, and a 👑 for the first victor
- Leaderboard with player search, ties, hardest level beaten, top 3,
  most-completed levels and recent records
- Player profiles with completed / in progress / not beaten columns
- Roulette with a no-repeat challenge mode, saved results and CSV export
- Accent colour picker (saved per browser)

---

## Scoring

Defined once in `js/shared/utils.js` (`calcPoints`): rank #1 is worth 300 points,
the last level 1 point, with exponential decay in between. Partial records earn
points proportional to their percentage.

---

## Architecture

```
index.html (GitHub Pages — public)
    │  fetch() with anon key (read-only)
    ▼
Supabase REST API  ──►  PostgreSQL
    ▲
    │  fetch() with service_role key (read + write)
admin.html (local only)
```

## Database Schema

```
demons   (id, rank, name, creator, video_id, created_at)
players  (id, name, flag, created_at)
records  (id, demon_id → demons, player_id → players, percentage,
          attempts, video_id, created_at)
```

- Deleting a demon or player also deletes its records (CASCADE)
- One record per player per demon (UNIQUE constraint)
- Public users can only READ; only the service_role key can write

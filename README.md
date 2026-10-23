# La Selva Quiniela

A private prediction game (quiniela) I built for my family for the 2026 World Cup. Everyone predicts the score of each match and the knockout bracket, and the app grades the picks automatically and keeps a live leaderboard.

It ran in production for the whole tournament with real users. The app is in Spanish because that is what my family speaks.

## Features

- Invite only sign up, with invite links created by the admin.
- Score predictions for all 104 matches, locked on the server before kickoff.
- Knockout bracket predictions that update as teams advance.
- Automatic grading. A cron job pulls results and updates points without anyone touching it.
- Live leaderboard, stats page and a view of everyone's picks after lock.
- Bonus points and tie breakers.
- Admin panel for matches, results and invites.
- Profile page with avatar colors and password change.
- Installable as a mobile app (PWA).

## Tech stack

| Part | Tools |
|---|---|
| App | Next.js 16 (App Router), React 19, TypeScript, Tailwind |
| Data | PostgreSQL, Prisma |
| Auth | Session cookies with signed JWTs (jose), bcrypt passwords |
| Validation | Zod |
| Deploy | Docker Compose, Caddy (automatic HTTPS), a separate cron container |

## Run it locally

```bash
git clone https://github.com/orlrami/la-selva-quiniela.git
cd la-selva-quiniela
npm install
cp .env.example .env      # fill in DATABASE_URL, AUTH_SECRET and SEED_ADMIN_PASSWORD
npx prisma migrate deploy
npm run db:seed
npm run dev
```

## Deploy

The production setup is Docker Compose with three services. Postgres, the Next.js app and a cron container for grading. Caddy sits in front and handles HTTPS.

```bash
docker compose up -d --build
```

## What I learned

- Real users find every edge case. Kickoff times, time zones and bracket rules took more work than I expected.
- Locking picks at the right time matters a lot when people are competing, so it is checked on the server, not only in the UI.
- Grading has to be automatic and safe to run again. If a result changes, the points get recalculated, not added twice.

## How I built it

I designed and built this app myself. I used AI tools like Claude and Codex during development, mostly for code review and writing tests. The design and the decisions are mine.

## License

MIT

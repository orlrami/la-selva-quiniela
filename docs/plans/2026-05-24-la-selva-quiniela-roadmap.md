# La Selva Quiniela Implementation Roadmap

**Goal:** Build and deploy a modern family quiniela web app for the 2026 World Cup, hosted on a VPS so it does not depend on a local PC.
**Architecture:** Use a full-stack Next.js app with PostgreSQL, Docker Compose, and Caddy. Build locally in `F:\Projects\laselvaquiniela`, test locally, push to GitHub, then deploy to an Ubuntu VPS such as IONOS VPS M.
**Tech Stack:** Next.js, TypeScript, Tailwind CSS, Framer Motion, PostgreSQL, Prisma, NextAuth/Auth.js or custom credentials auth, Docker, Caddy, GitHub Actions.
**Estimated Tasks:** 14 phases, each with small implementation steps.

---

## Product Vision

La Selva Quiniela should feel like a polished private family sports app, not a generic form. The reference site has the right core idea: login, leaderboard, prediction cards, rules, profile prompt, and chat. This app should improve that with clearer navigation, better mobile design, smoother animations, easier admin control, and a safer deployment setup.

The first production version should prioritize:

- Family login/register with invite links.
- Mobile-first dashboard.
- Group-stage predictions.
- Leaderboard and scoring.
- Admin score entry.
- Rules/scoring page.
- Profile avatar/name.
- VPS deployment with HTTPS and backups.

Later versions can add:

- Knockout bracket predictions.
- Chat.
- GIF/image messages.
- Notifications.
- Hidden picks until deadline.
- Automatic match data imports.

---

## Recommended Infrastructure

Use:

- VPS: IONOS VPS M if budget allows, Ubuntu 24.04 LTS.
- Domain: paid domain from Cloudflare Registrar or Namecheap if possible.
- Temporary/free domain for testing: DuckDNS or EU.org.
- DNS: Cloudflare DNS.
- SSL: Caddy automatic HTTPS.
- Runtime: Docker Compose.
- Database: PostgreSQL container with persistent volume.
- Backups: daily `pg_dump` to local folder first, then Cloudflare R2/S3 later.

Production target:

```text
https://laselvaquiniela.com
  -> Cloudflare DNS
  -> IONOS VPS public IP
  -> Caddy reverse proxy
  -> Next.js app container
  -> PostgreSQL container
```

---

## Phase 1: Project Bootstrap

### Task 1: Create Next.js App

**Files:**
- Create project in `F:\Projects\laselvaquiniela`

**Steps:**

1. Open terminal in `F:\Projects\laselvaquiniela`.
2. Run:

```powershell
npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*"
```

3. Choose defaults that keep the app simple.
4. Run:

```powershell
npm run dev
```

5. Verify `http://localhost:3000` loads.

### Task 2: Add Core Dependencies

Install:

```powershell
npm install framer-motion lucide-react clsx class-variance-authority tailwind-merge zod @prisma/client prisma bcryptjs
npm install -D @types/bcryptjs
```

Optional later:

```powershell
npm install socket.io socket.io-client
```

### Task 3: Initialize Git

Run:

```powershell
git init
git add -A
git commit -m "chore: bootstrap la selva quiniela"
```

---

## Phase 2: Design Foundation

### Task 4: Create Visual Theme

**Files:**
- Modify `src/app/globals.css`
- Modify `tailwind.config.ts`
- Modify `src/app/layout.tsx`

**Design Direction:**

- Base: deep charcoal / rich green-black.
- Accent: gold, jungle green, teal, red/orange for warnings.
- Style: modern, friendly, family sports app.
- Avoid: plain clone of the reference site, overly dark unreadable UI, too many emojis, huge marketing hero.

**Core UI Feel:**

- Rounded but controlled cards, max 8px to 12px radius.
- Large touch targets.
- Motion on page transitions, score saving, leaderboard rank changes.
- Subtle background texture or gradients, not distracting.

### Task 5: Create Shared Components

**Files:**
- Create `src/components/ui/button.tsx`
- Create `src/components/ui/card.tsx`
- Create `src/components/ui/input.tsx`
- Create `src/components/ui/dialog.tsx`
- Create `src/components/ui/tabs.tsx`
- Create `src/components/ui/avatar.tsx`
- Create `src/components/ui/toast.tsx`

**Acceptance Criteria:**

- Components are reusable.
- Components are accessible.
- Buttons have loading/disabled states.
- Inputs show validation errors.

---

## Phase 3: Database Schema

### Task 6: Add Prisma

Run:

```powershell
npx prisma init
```

**Files:**
- Modify `prisma/schema.prisma`
- Create `.env.example`

### Task 7: Define Models

Models needed:

- `User`
- `Quiniela`
- `QuinielaMember`
- `Invite`
- `Team`
- `Match`
- `Prediction`
- `ScoreRule`
- `StandingSnapshot`
- `ChatMessage` later

Suggested relationships:

```text
User -> many QuinielaMember
Quiniela -> many QuinielaMember
Quiniela -> many Invite
Quiniela -> many Prediction
Match -> many Prediction
Team -> many Match as home/away
```

### Task 8: Create Seed Data

**Files:**
- Create `prisma/seed.ts`

Seed:

- One admin user.
- One demo quiniela named `La Selva Quiniela`.
- 2026 group teams and matches.
- Default scoring rules.

Run:

```powershell
npx prisma migrate dev --name init
npx prisma db seed
```

---

## Phase 4: Authentication

### Task 9: Build Auth Pages

**Files:**
- Create `src/app/(auth)/login/page.tsx`
- Create `src/app/(auth)/register/page.tsx`
- Create `src/app/(auth)/invite/[token]/page.tsx`

**Features:**

- Email/password login.
- Register via invite token.
- Friendly error messages.
- Password hashing with `bcryptjs`.

### Task 10: Session Protection

**Files:**
- Create `src/lib/auth.ts`
- Create `src/middleware.ts`

Protect:

- Dashboard.
- Predictions.
- Profile.
- Admin pages.

Public:

- Login.
- Register/invite.

---

## Phase 5: Core Layout

### Task 11: App Shell

**Files:**
- Create `src/app/(app)/layout.tsx`
- Create `src/components/app/app-header.tsx`
- Create `src/components/app/bottom-nav.tsx`

Navigation:

- Dashboard
- Picks
- Leaderboard
- Rules
- Profile
- Admin if current user is admin

Mobile first:

- Bottom nav on mobile.
- Compact top header.
- Profile/avatar access.

---

## Phase 6: Dashboard

### Task 12: Build Dashboard Page

**Files:**
- Create `src/app/(app)/dashboard/page.tsx`
- Create `src/components/dashboard/stat-card.tsx`
- Create `src/components/dashboard/next-deadline.tsx`
- Create `src/components/dashboard/leaderboard-preview.tsx`

Dashboard should show:

- User points.
- User rank.
- Completed predictions.
- Missing predictions.
- Next match lock time.
- Quick action to finish predictions.
- Leaderboard preview.

Animations:

- Cards fade/slide in.
- Score numbers count up.
- Rank movement chip animates.

---

## Phase 7: Predictions

### Task 13: Build Prediction Screen

**Files:**
- Create `src/app/(app)/predictions/page.tsx`
- Create `src/components/predictions/phase-tabs.tsx`
- Create `src/components/predictions/group-tabs.tsx`
- Create `src/components/predictions/match-card.tsx`
- Create `src/components/predictions/score-stepper.tsx`

Features:

- Group tabs A-L.
- Match cards with teams, flags, date, venue, lock countdown.
- Score steppers for group stage.
- Save automatically or with clear save button.
- Locked state after deadline.
- Empty state for missing predictions.

Acceptance Criteria:

- User can enter scores.
- Prediction saves to database.
- Saved state is visible.
- Locked matches cannot be edited.

### Task 14: Add Prediction API

**Files:**
- Create `src/app/api/predictions/route.ts`
- Create `src/lib/predictions.ts`

Validation:

- User must be authenticated.
- User must belong to the quiniela.
- Match must not be locked.
- Scores must be non-negative integers.

---

## Phase 8: Scoring and Leaderboard

### Task 15: Implement Scoring Logic

**Files:**
- Create `src/lib/scoring.ts`
- Create `src/lib/scoring.test.ts` if test setup exists

Rules for V1:

- Group stage correct outcome: 3 points.
- Group stage exact score: 6 points total.
- Knockout winner points later.
- No points if prediction missing.

### Task 16: Build Leaderboard

**Files:**
- Create `src/app/(app)/leaderboard/page.tsx`
- Create `src/components/leaderboard/leaderboard-row.tsx`

Features:

- Rank.
- Avatar.
- Name.
- Points.
- Correct picks.
- Exact scores.
- Missing picks.
- Rank movement later.

---

## Phase 9: Admin

### Task 17: Admin Dashboard

**Files:**
- Create `src/app/(app)/admin/page.tsx`
- Create `src/components/admin/admin-card.tsx`

Admin tools:

- View members.
- Create invite link.
- Enter final match scores.
- Lock/unlock quiniela.
- Manage scoring rules.

### Task 18: Match Result Entry

**Files:**
- Create `src/app/(app)/admin/matches/page.tsx`
- Create `src/app/api/admin/matches/[id]/result/route.ts`

Acceptance Criteria:

- Admin can set final score.
- Leaderboard recalculates.
- Non-admin cannot access route.

---

## Phase 10: Rules Page

### Task 19: Build Rules Page

**Files:**
- Create `src/app/(app)/rules/page.tsx`

Content:

- Scoring table.
- Deadline explanation.
- What happens when match locks.
- How tie/ranking is handled.

Keep it readable and short.

---

## Phase 11: Profile

### Task 20: Profile Editing

**Files:**
- Create `src/app/(app)/profile/page.tsx`
- Create `src/app/api/profile/route.ts`

Features:

- Display name.
- Avatar upload or avatar color/icon first.
- Short bio optional.

Start simple:

- Use initials/avatar color in V1.
- Add image upload after VPS storage is decided.

---

## Phase 12: Deployment Prep

### Task 21: Add Docker

**Files:**
- Create `Dockerfile`
- Create `docker-compose.yml`
- Create `.dockerignore`
- Create `Caddyfile`

Services:

- `app`
- `db`
- `caddy`

Environment:

- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXT_PUBLIC_APP_URL`

### Task 22: Production Build Test

Run locally:

```powershell
npm run build
docker compose build
docker compose up -d
```

Verify:

- App loads.
- Login works.
- Predictions save.
- Admin works.

---

## Phase 13: VPS Setup

### Task 23: Buy/Prepare VPS

Recommended:

- IONOS VPS M.
- Ubuntu 24.04 LTS.
- SSH key login.

Install:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y ca-certificates curl git ufw
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

Firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### Task 24: DNS

At Cloudflare:

- Add `A` record for root domain to VPS IPv4.
- Add `CNAME` or `A` record for `www`.
- Proxy can be enabled after initial verification.

### Task 25: Deploy App

On VPS:

```bash
git clone <repo-url> /opt/laselvaquiniela
cd /opt/laselvaquiniela
cp .env.example .env
nano .env
docker compose up -d --build
```

Then:

```bash
docker compose logs -f
```

Verify:

- `https://yourdomain.com` loads.
- SSL is active.
- Login works.
- Database persists after restart.

---

## Phase 14: Backups and Maintenance

### Task 26: Database Backups

Create:

- `scripts/backup-db.sh`
- cron job for daily backup.

Backup command shape:

```bash
docker compose exec -T db pg_dump -U postgres laselvaquiniela > backups/laselva-$(date +%F).sql
```

Keep:

- 7 daily backups locally.
- Add Cloudflare R2/S3 upload later.

### Task 27: Simple Update Flow

On local machine:

```powershell
git add -A
git commit -m "feat: ..."
git push
```

On VPS:

```bash
cd /opt/laselvaquiniela
git pull
docker compose up -d --build
```

Later automate with GitHub Actions.

---

## Fresh Session Prompt

Use this prompt in a new Codex session opened at `F:\Projects\laselvaquiniela`:

```text
We are building La Selva Quiniela, a modern family quiniela web app for the 2026 World Cup.

Read docs/plans/2026-05-24-la-selva-quiniela-roadmap.md first. Then start Phase 1 and Phase 2:

1. Bootstrap a Next.js TypeScript app in this directory if it is not already created.
2. Install the recommended dependencies.
3. Set up the initial visual theme, app layout, and reusable UI components.
4. Keep the design mobile-first, modern, animated, and user-friendly.
5. Do not deploy yet. Run the local dev server and verify the first screen loads.

Use the roadmap as the source of truth. Make conservative implementation choices and commit logical chunks if git is initialized.
```

---

## Initial Definition of Done

The app is ready for family testing when:

- Family members can register/login.
- Each member can fill group-stage predictions.
- Predictions lock after deadline.
- Admin can enter match results.
- Leaderboard updates from scoring rules.
- UI works well on mobile.
- App is deployed on VPS with HTTPS.
- Database backups exist.


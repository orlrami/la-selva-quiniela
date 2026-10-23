# syntax=docker/dockerfile:1.7

# ---------- deps ----------
FROM node:24-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund --include=optional

# ---------- builder ----------
FROM node:24-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Dummy build-time env so module-load checks pass; not used at runtime.
ENV DATABASE_URL="postgresql://dummy:dummy@dummy:5432/dummy?schema=public"
ENV AUTH_SECRET="build-time-secret-that-is-at-least-32-chars-long"
ENV NEXT_PUBLIC_APP_URL="http://localhost"
RUN npx prisma generate
RUN npm run build

# ---------- runner ----------
FROM node:24-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 --ingroup nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/src/generated ./src/generated
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/package.json /app/package-lock.json /app/next.config.ts /app/tsconfig.json ./

USER nextjs
EXPOSE 3000

# Apply pending Prisma migrations, run the idempotent seed (admin upsert + group fixtures),
# then start Next.js in production mode.
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && npm start"]

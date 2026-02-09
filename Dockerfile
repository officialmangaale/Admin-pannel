# Stage 1: Dependencies
FROM node:20 AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Builder
FROM node:20 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Copy production environment variables for build
COPY .env.production .env.production

# Build arguments for environment-specific URLs
# Default to localhost if not provided (prevents build failure)
ARG NEXT_PUBLIC_AUTH_API_BASE_URL=http://localhost:8000/api/v1/auth
ARG NEXT_PUBLIC_RESTAURANT_API_BASE_URL=http://localhost:8001/api/v1
ARG NEXT_PUBLIC_DEBUG=false

# Set as environment variables for build
ENV NEXT_PUBLIC_AUTH_API_BASE_URL=$NEXT_PUBLIC_AUTH_API_BASE_URL
ENV NEXT_PUBLIC_RESTAURANT_API_BASE_URL=$NEXT_PUBLIC_RESTAURANT_API_BASE_URL
ENV NEXT_PUBLIC_DEBUG=$NEXT_PUBLIC_DEBUG
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Stage 3: Runner
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

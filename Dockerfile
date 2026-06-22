# Base image
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# libc6-compat is needed for certain native modules
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the package manager
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable telemetry
ENV NEXT_TELEMETRY_DISABLED 1

# Generate prisma client before build
RUN npx prisma generate

# Provide dummy build-time environment variables so Next.js static evaluation doesn't crash
ENV GEMINI_API_KEY="dummy"
ENV GOOGLE_API_KEY="dummy"
ENV BETTER_AUTH_SECRET="dummy"
ENV BETTER_AUTH_URL="http://localhost:3000"
ENV AWS_ACCESS_KEY_ID="dummy"
ENV AWS_SECRET_ACCESS_KEY="dummy"
ENV AWS_REGION="dummy"
ENV AWS_S3_BUCKET="dummy"

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Note: Prisma migrations (npx prisma migrate deploy) should ideally be run
# before starting the application, typically via a CI/CD pipeline or a separate init container.
CMD ["node", "server.js"]

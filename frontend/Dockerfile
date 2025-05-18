FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_AUTH_API_URL
ARG NEXT_PUBLIC_TENANT_API_URL
ARG NEXT_PUBLIC_USER_API_URL
ARG NEXT_PUBLIC_FILE_API_URL
ARG API_GATEWAY_URL

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_AUTH_API_URL=${NEXT_PUBLIC_AUTH_API_URL}
ENV NEXT_PUBLIC_TENANT_API_URL=${NEXT_PUBLIC_TENANT_API_URL}
ENV NEXT_PUBLIC_USER_API_URL=${NEXT_PUBLIC_USER_API_URL}
ENV NEXT_PUBLIC_FILE_API_URL=${NEXT_PUBLIC_FILE_API_URL}
ENV API_GATEWAY_URL=${API_GATEWAY_URL}

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Set environment variables for runtime
ENV PORT=3001

# Expose port
EXPOSE ${PORT}

# Start the application
CMD ["node", "server.js"]

# syntax=docker.io/docker/dockerfile:1

FROM node:20-slim AS base

# Install dependencies only when needed
FROM base AS deps
# Install build dependencies for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /usr/src/cli

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
# Install build dependencies for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /usr/src/cli
COPY --from=deps /usr/src/cli/node_modules ./node_modules
COPY . .

# Rebuild sqlite3 for the current platform
RUN npm rebuild sqlite3 --build-from-source

# Build the NestJS application
RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Production image, copy all the files and run nest
FROM base AS runner
# Install runtime dependencies for sqlite3
RUN apt-get update && apt-get install -y \
    libsqlite3-0 \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /usr/src/cli

ENV NODE_ENV=production

# Create data directory and set permissions
RUN mkdir -p /data && chown -R node:node /data

# Copy necessary files from builder
COPY --from=builder /usr/src/cli ./

# Change to non-root user
USER node

EXPOSE 3009

CMD ["tail", "-f", "/dev/null"]
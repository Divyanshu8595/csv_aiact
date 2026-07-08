# --- Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json postcss.config.mjs eslint.config.mjs next.config.ts next-env.d.ts ./
COPY src/ ./src/
COPY public/ ./public/

# Disable telemetry and build the application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- Production Stage ---
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production

# Copy built application and required configurations
COPY --from=builder /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/next.config.ts ./
COPY --from=builder /usr/src/app/node_modules/next ./node_modules/next

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

CMD ["npx", "next", "start"]

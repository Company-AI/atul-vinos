# Build en dos etapas sobre debian-slim: Prisma y sharp traen binarios nativos
# y el target que genera `prisma generate` acá es el mismo que corre en runtime.

FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY prisma ./prisma
# postinstall corre `prisma generate`: por eso prisma/ se copia antes.
RUN npm ci

FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# robots.txt y sitemap.xml se prerenderizan en el build: si la URL del sitio no
# está acá, quedan horneados con localhost y ponerla en runtime no los corrige.
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}

ENV NEXT_TELEMETRY_DISABLED=1
# El build no toca la base: el resto de las páginas son dinámicas.
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Las migraciones NO corren acá: el CLI de Prisma arrastra dependencias que npm
# hoistea a la raíz de node_modules, y traerlas obligaría a copiar node_modules
# entero. Corren en el servicio `migrate` del compose, que usa la etapa builder.
RUN mkdir -p public/uploads && chown -R node:node public/uploads

USER node
EXPOSE 3000
CMD ["node", "server.js"]

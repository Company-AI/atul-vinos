# ─────────────────────────────────────────────────────────────────────────────
# Imagen del sitio. Tres etapas para que lo que termina corriendo no arrastre
# el compilador ni las dependencias de desarrollo.
#
# Debian slim y no Alpine a propósito: Prisma compila su motor contra la libc
# del sistema, y con musl hay que declarar un target extra en el schema. Con
# Debian el target "native" alcanza y una cosa menos puede salir mal.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS base
# openssl lo necesita el motor de Prisma; ca-certificates, las llamadas salientes.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1


# ── Dependencias ────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
# npm ci respeta el lockfile; postinstall corre prisma generate.
RUN npm ci


# ── Compilación ─────────────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Las variables NEXT_PUBLIC_ se escriben dentro del JavaScript del navegador
# durante el build, no se leen al arrancar. Por eso entran como argumento.
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}

# El build no toca la base, pero Prisma necesita el cliente generado.
RUN npx prisma generate && npm run build


# ── Lo que corre ────────────────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
# standalone escucha en el puerto y host que le digan.
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# El cliente de Prisma y su motor, que es lo único que hace falta para
# consultar. El CLI no viene: arrastra su propio árbol de dependencias y las
# migraciones las corre el servicio "migrate" de docker-compose, que sí tiene
# todo. Así la imagen que queda expuesta carga sólo lo que sirve.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

RUN mkdir -p /app/public/uploads && chown -R node:node /app/public/uploads

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]

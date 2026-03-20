# PawActivity Platform

Base técnica inicial del monorepo para la plataforma privada y la API de PawActivity.

## Qué incluye esta fase

- `apps/web`: aplicación privada en Next.js con App Router.
- `apps/api`: API en NestJS con auth base funcional.
- `prisma/schema.prisma`: esquema inicial para PostgreSQL.
- `packages/types`: tipos compartidos mínimos.
- `packages/validation`: validaciones compartidas con Zod.
- `packages/config`: configuración compartida base.
- configuración de `pnpm workspaces`, `turbo`, TypeScript y ESLint.

## Estructura principal

```txt
apps/
  web/
  api/
packages/
  types/
  validation/
  config/
prisma/
```

## Requisitos

- Node.js 20+
- pnpm 10+
- PostgreSQL 15+

## Variables de entorno

Copia el archivo de ejemplo:

```bash
cp .env.example .env
```

Variables mínimas:

- `DATABASE_URL`
- `API_PORT`
- `API_CORS_ORIGIN`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `NEXT_PUBLIC_API_URL`

## Instalación

```bash
pnpm install
```

## Base de datos

Puedes levantar PostgreSQL localmente con Docker:

```bash
docker compose -f infra/local/docker-compose.yml up -d
```

Luego:

1. Configura `DATABASE_URL` en `.env`.
2. Ejecuta:

```bash
pnpm db:generate
pnpm db:push
```

## Desarrollo local

### API

```bash
pnpm dev:api
```

API disponible en:

- `http://localhost:4000/v1`

### Web

```bash
pnpm dev:web
```

Web disponible en:

- `http://localhost:3000`

### Ambos en paralelo

```bash
pnpm dev
```

## Endpoints implementados en esta fase

- `POST /v1/auth/register`
- `POST /v1/auth/login`
- `POST /v1/auth/refresh`
- `POST /v1/auth/logout`
- `GET /v1/auth/me`

## Frontend implementado en esta fase

- `/login`
- `/register`
- `/dashboard`
- protección básica de rutas privadas con middleware
- sesión inicial mediante cookies httpOnly desde route handlers de Next.js

## Qué falta para la siguiente fase

- CRUD real de mascotas
- base funcional de dispositivos
- formularios protegidos con sesión validada contra `GET /auth/me`
- logout desde frontend
- dashboard con datos reales
- refresh automático de sesión en frontend

# PawActivity Platform

Base técnica del monorepo para la plataforma privada y la API de PawActivity.

## Estado actual

El repositorio ya incluye:

- `apps/web`: aplicación privada en Next.js con auth, mascotas y dispositivos.
- `apps/api`: API en NestJS con auth funcional, gestión de mascotas y base funcional de dispositivos.
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
infra/local/
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

## Endpoints implementados

### Auth
- `POST /v1/auth/register`
- `POST /v1/auth/login`
- `POST /v1/auth/refresh`
- `POST /v1/auth/logout`
- `GET /v1/auth/me`

### Pets
- `GET /v1/pets`
- `POST /v1/pets`
- `GET /v1/pets/:petId`
- `PATCH /v1/pets/:petId`

### Devices
- `GET /v1/devices`
- `POST /v1/devices/activate`
- `GET /v1/devices/:deviceId`
- `GET /v1/devices/:deviceId/status`
- `POST /v1/pets/:petId/devices/assign`

## Pantallas implementadas

- `/login`
- `/register`
- `/dashboard`
- `/pets`
- `/pets/new`
- `/pets/[petId]`
- `/pets/[petId]/edit`
- `/devices`

## Flujo funcional actual

1. El usuario crea su cuenta o inicia sesión.
2. Entra al panel privado.
3. Puede crear y editar mascotas.
4. Puede activar un dispositivo por serial.
5. Puede asignar un dispositivo a una mascota desde el detalle de esa mascota.
6. Puede ver el estado básico del dispositivo asociado.

## Decisión UX de esta fase

La asignación de dispositivo se hace desde la pantalla de detalle de la mascota en lugar de centralizarla en `/devices`, porque para este MVP resulta más claro decidir **qué dispositivo queda asociado a qué perro** desde el contexto de la mascota.

## Qué falta para la siguiente fase

- sincronización de actividad desde la app móvil
- modelo y endpoints de eventos de actividad
- timeline o métricas simples por mascota
- estado de última sincronización
- batería y `last_seen_at` alimentados por datos reales

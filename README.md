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

### Activity Sync
- `POST /v1/activity/sync`

### Activity Read
- `GET /v1/pets/:petId/activity/daily`
- `GET /v1/pets/:petId/activity/weekly`
- `GET /v1/pets/:petId/activity/monthly`
- `GET /v1/pets/:petId/activity/history`
- `GET /v1/pets/:petId/activity/timeline`

## Pantallas implementadas

- `/login`
- `/register`
- `/dashboard`
- `/pets`
- `/pets/new`
- `/pets/[petId]`
- `/pets/[petId]/edit`
- `/devices`
- `/history`

## Flujo funcional actual

1. El usuario crea su cuenta o inicia sesión.
2. Entra al panel privado.
3. Puede crear y editar mascotas.
4. Puede activar un dispositivo por serial.
5. Puede asignar un dispositivo a una mascota desde el detalle de esa mascota.
6. Puede ver el estado básico del dispositivo asociado.
7. La app móvil ya puede enviar lotes de actividad al backend para almacenarlos y resumirlos por día.
8. El dashboard y el historial consumen esos datos para mostrar actividad diaria, semanal y timeline.

## Endurecimientos incluidos en esta iteración

- La API ahora normaliza los errores HTTP para responder con un objeto JSON consistente con `statusCode` y `message`.
- Las consultas de actividad validan explícitamente `range`, `timezone` y `generatedAt` antes de procesar datos.
- La sincronización de actividad evita duplicados exactos por evento y recalcula el resumen diario a partir de los eventos persistidos.
- La web convierte errores `401/403` en redirección a `/login` en las páginas privadas más importantes.
- Los formularios principales de mascotas y dispositivos muestran errores inline en vez de depender de `alert()`.
- Se agregó una ruta `POST /logout` en la app web para cerrar sesión local incluso si el backend falla durante el logout remoto.

## Checks manuales sugeridos

1. Registrar un usuario, iniciar sesión y confirmar acceso a `/dashboard`.
2. Crear una mascota, editarla y verificar que los errores de validación o backend se muestren dentro del formulario.
3. Activar un dispositivo por serial y revisar que el mensaje de error aparezca inline si la activación falla.
4. Asignar un dispositivo a una mascota y confirmar que la asignación siga visible al volver al detalle.
5. Enviar dos veces el mismo lote a `POST /v1/activity/sync` y verificar que la segunda respuesta reporte duplicados omitidos.
6. Abrir `/dashboard`, `/pets`, `/devices`, `/history` y el detalle de una mascota con una sesión inválida/expirada para confirmar la redirección a `/login`.

## Tests automatizados disponibles

```bash
pnpm --filter api test
```

Actualmente cubren:

- flujo básico de registro/login/me/logout en `AuthService`
- sincronización válida de actividad con reporte de duplicados
- rechazo de duraciones inválidas en la sincronización

## Decisión UX de esta fase

La asignación de dispositivo se hace desde la pantalla de detalle de la mascota en lugar de centralizarla en `/devices`, porque para este MVP resulta más claro decidir **qué dispositivo queda asociado a qué perro** desde el contexto de la mascota.

## Qué falta para la siguiente fase

- hardening técnico (builds, typecheck, lint reales en CI)
- manejo más robusto de estados de sesión/refresh
- pulido final de UX y mensajes de error
- preparación de release/staging/production

# PawActivity Deployment Plan

## Recomendación concreta para staging

Para mantener el stack actual y minimizar complejidad, la recomendación práctica para **staging** es:

- **Web privada (`apps/web`)**: Vercel
- **API (`apps/api`)**: Railway
- **PostgreSQL**: Railway Postgres o Neon

Esta combinación es simple, realista y suficiente para validar integración end-to-end sin introducir Kubernetes, Terraform o infraestructura compleja.

## Topología recomendada

### Development

- Web: `http://localhost:3000`
- API: `http://localhost:4000/v1`
- DB: PostgreSQL local por Docker

### Staging

- Web: `https://app-staging.pawactivity.com`
- API: `https://api-staging.pawactivity.com/v1`
- DB: instancia PostgreSQL dedicada de staging

### Production

- Web: `https://app.pawactivity.com`
- API: `https://api.pawactivity.com/v1`
- DB: instancia PostgreSQL dedicada de producción

## Servicios elegidos y por qué

### Vercel para web

- encaja naturalmente con Next.js
- despliegue rápido desde Git
- manejo simple de variables por ambiente
- previews útiles para QA

### Railway para API

- despliegue muy directo para un servicio Node/Nest
- variables por ambiente sencillas
- fácil conexión a PostgreSQL administrado
- suficiente para staging sin overengineering

### PostgreSQL administrado

- separa claramente development/staging/production
- evita depender de una VM propia para la base
- simplifica backups y credenciales

## Ambientes definidos

### Development

Objetivo:

- desarrollo local
- debug rápido
- iteración con Docker local

### Staging

Objetivo:

- probar integración real Android + API + web
- validar CORS, cookies, dominios y migraciones
- ejecutar QA funcional antes de producción

### Production

Objetivo:

- ambiente estable para usuarios finales
- variables/secretos separados
- base de datos aislada

## Variables por ambiente

### Compartidas

- `NODE_ENV`
- `DATABASE_URL`

### API

- `API_HOST`
- `API_PORT`
- `API_PUBLIC_URL`
- `API_CORS_ORIGIN`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`

### Web

- `WEB_APP_URL`
- `NEXT_PUBLIC_API_URL`

## Recomendación de dominios

### Staging

- Web: `app-staging.pawactivity.com`
- API: `api-staging.pawactivity.com`

### Production

- Web: `app.pawactivity.com`
- API: `api.pawactivity.com`

## Notas operativas importantes

- La web usa cookies HTTP-only para la sesión, pero las llamadas a la API protegida se hacen del lado servidor desde Next.js, así que no hace falta compartir cookies entre subdominios.
- La API ya soporta múltiples orígenes CORS en `API_CORS_ORIGIN` separados por coma.
- El endpoint de logout web ya no depende de `localhost`; ahora redirige usando el origen real del request.

## Estrategia inicial de despliegue

### Web

Build command recomendado:

```bash
pnpm install --no-frozen-lockfile
pnpm --filter web build
```

### API

Build command recomendado:

```bash
pnpm install --no-frozen-lockfile
pnpm --filter api build
```

Start command recomendado:

```bash
pnpm --filter api start
```

### Migraciones

Antes de promover una versión de staging o production:

```bash
pnpm db:migrate:deploy
```

## CI/CD inicial recomendado

Pipeline simple:

1. instalar dependencias
2. lint
3. typecheck
4. build
5. tests mínimos de API

Eso ya es suficiente para una primera etapa de staging.

## Qué queda para la fase siguiente

- estrategia de backups/restores
- manejo formal de secretos
- monitoreo y alerting
- previews por rama más maduros
- release process controlado a producción

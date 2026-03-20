# PawActivity Staging Setup

## Objetivo

Dejar un entorno de staging reproducible para validar:

- web privada
- backend/API
- PostgreSQL
- integración Android
- flujo web end-to-end

## 1. Preparar base de datos de staging

Crear una base PostgreSQL dedicada, por ejemplo:

- `pawactivity_staging`

Nunca reutilizar la base local ni la futura base de producción.

Variable mínima:

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/pawactivity_staging?sslmode=require
```

## 2. Configurar API de staging

Variables sugeridas:

```bash
NODE_ENV=production
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/pawactivity_staging?sslmode=require
API_HOST=0.0.0.0
API_PORT=4000
API_PUBLIC_URL=https://api-staging.pawactivity.com/v1
API_CORS_ORIGIN=https://app-staging.pawactivity.com
JWT_ACCESS_SECRET=replace-with-real-secret
JWT_REFRESH_SECRET=replace-with-real-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

Build:

```bash
pnpm install --no-frozen-lockfile
pnpm --filter api build
```

Migraciones:

```bash
pnpm db:migrate:deploy
```

Start:

```bash
pnpm --filter api start
```

## 3. Configurar web de staging

Variables sugeridas:

```bash
NODE_ENV=production
WEB_APP_URL=https://app-staging.pawactivity.com
NEXT_PUBLIC_API_URL=https://api-staging.pawactivity.com/v1
```

Build:

```bash
pnpm install --no-frozen-lockfile
pnpm --filter web build
```

## 4. Flujo recomendado de Prisma

### En development

Para iterar local:

```bash
pnpm db:migrate
```

o, si solo estás explorando cambios locales:

```bash
pnpm db:push
```

### En staging y production

Usar siempre:

```bash
pnpm db:migrate:deploy
```

Y validar estado con:

```bash
pnpm db:migrate:status
```

## 5. Seed

Actualmente el repositorio **no incluye seed automatizado**.

Para staging inicial, la recomendación es:

- crear un usuario manualmente vía `POST /v1/auth/register`, o
- añadir más adelante un seed mínimo cuando existan datos estándar realmente necesarios

Para esta fase no hace falta complicarlo con un pipeline de seed.

## 6. GitHub Actions incluida

Se agregó una workflow simple en:

```txt
.github/workflows/ci.yml
```

Valida:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `pnpm --filter api test`

## 7. Checklist de staging

### Infra/config

- [ ] `NEXT_PUBLIC_API_URL` apunta al dominio real del API de staging
- [ ] `API_PUBLIC_URL` refleja el dominio real expuesto
- [ ] `API_CORS_ORIGIN` incluye el dominio real de la web
- [ ] `DATABASE_URL` apunta a la base de staging
- [ ] secrets JWT son propios de staging

### Auth

- [ ] register funciona
- [ ] login funciona
- [ ] `GET /v1/auth/me` responde correctamente
- [ ] refresh rota tokens correctamente
- [ ] logout invalida sesión

### Pets

- [ ] crear mascota
- [ ] editar mascota
- [ ] listar mascotas
- [ ] obtener detalle de mascota

### Devices

- [ ] activar dispositivo
- [ ] consultar dispositivo
- [ ] consultar status del dispositivo
- [ ] asignar dispositivo a mascota

### Activity sync

- [ ] enviar payload real a `POST /v1/activity/sync`
- [ ] duplicados devuelven `skippedDuplicates`
- [ ] ownership inválido devuelve error controlado
- [ ] dispositivo no asignado devuelve `403`

### Web

- [ ] dashboard muestra datos sincronizados
- [ ] history muestra datos sincronizados
- [ ] responsive básico correcto
- [ ] errores controlados se muestran sin romper navegación

### Integración

- [ ] Android puede loguear
- [ ] Android puede refrescar sesión
- [ ] Android puede consultar mascotas
- [ ] Android puede sincronizar actividad real

## 8. Recomendación de despliegue paso a paso

1. provisionar PostgreSQL de staging
2. cargar variables del API
3. desplegar API
4. correr `pnpm db:migrate:deploy`
5. cargar variables de la web
6. desplegar web
7. validar checklist de staging

## 9. Pendiente después de staging

- deploy de producción
- backups y restore plan
- monitoreo
- políticas de rollback
- estrategia de releases más controlada

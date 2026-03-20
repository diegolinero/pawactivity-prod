# PawActivity Production Release Plan

## 1. Arquitectura final de producción

La arquitectura final inicial de producción queda así:

- `pawactivity.com` → marketing / WordPress pendiente
- `app.pawactivity.com` → app web privada en Next.js
- `api.pawactivity.com` → API NestJS
- PostgreSQL administrado → base de datos de producción

Para mantener simplicidad operativa:

- **web** en Vercel
- **api** en Railway
- **db** en Neon o Railway Postgres

## 2. Dominios finales

- `app.pawactivity.com` para la app privada
- `api.pawactivity.com` para la API

El marketing en `pawactivity.com` puede seguir pendiente sin bloquear el release inicial del producto autenticado.

## 3. Variables de producción

### Compartidas

- `NODE_ENV=production`
- `DATABASE_URL`
- `ALLOW_PUBLIC_REGISTRATION=false`
- `REGISTRATION_EMAIL_ALLOWLIST=team@pawactivity.com,tester@pawactivity.com`

### API

- `API_HOST=0.0.0.0`
- `API_PORT=4000`
- `API_PUBLIC_URL=https://api.pawactivity.com/v1`
- `API_CORS_ORIGIN=https://app.pawactivity.com`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES_IN=15m`
- `JWT_REFRESH_EXPIRES_IN=7d`
- `SENTRY_DSN` opcional para captura de errores

### Web

- `WEB_APP_URL=https://app.pawactivity.com`
- `NEXT_PUBLIC_API_URL=https://api.pawactivity.com/v1`

## 4. Seguridad básica de producción

### HTTPS

- obligatorio en web y API
- delegar TLS a Vercel/Railway/proxy administrado

### Cookies y sesión

- las cookies HTTP-only quedan marcadas como `secure` en `NODE_ENV=production`
- el logout ya redirige usando el origen real del request, evitando errores por dominio hardcodeado

### CORS

- restringir `API_CORS_ORIGIN` al dominio real de la web
- si se necesita más de un origen, usar lista separada por comas

### Rate limiting básico implementado

Ya quedó implementado en memoria para:

- `POST /v1/auth/register`
- `POST /v1/auth/login`
- `POST /v1/auth/refresh`
- `POST /v1/activity/sync`

Notas:

- es suficiente para el primer release controlado
- más adelante puede migrarse a Redis si se necesitan límites distribuidos

## 5. Base de datos de producción

### Reglas

- usar una base exclusiva de producción
- nunca compartir `DATABASE_URL` entre staging y production
- no usar `db push` en producción

### Migraciones

Usar únicamente:

```bash
pnpm db:migrate:deploy
```

Y validar con:

```bash
pnpm db:migrate:status
```

### Backups

Para el primer release:

- activar backups automáticos del proveedor administrado
- definir retención mínima diaria
- verificar que exista restore point reciente antes de migraciones sensibles

## 6. Flujo de deploy recomendado

### Web

Recomendación:

- merge a `main`
- Vercel hace build y deploy automático
- promoción controlada desde proyecto configurado para production

### API

Recomendación:

- merge a `main`
- Railway hace build
- deploy automático o manual aprobado, según preferencia del equipo

### Flujo mínimo controlado

1. merge a `main`
2. CI verde
3. deploy API
4. correr migraciones si aplica
5. deploy web
6. ejecutar checklist de producción

## 7. Monitoreo básico implementado o recomendado

### Implementado

- logging estructurado de auth:
  - register success
  - login success/failure
  - refresh success/failure
  - logout
- logging estructurado de sync:
  - recepción de lote
  - resultado con `storedEvents` y `skippedDuplicates`
- logging estructurado de errores HTTP desde el filtro global
- endpoint de health: `GET /v1/health`

### Recomendado

- conectar logs del proveedor (Railway/Vercel)
- si se desea captura externa, usar `SENTRY_DSN` como variable preparada para una siguiente iteración

## 8. Release controlado

Para no abrir el producto de golpe:

- `ALLOW_PUBLIC_REGISTRATION=false`
- `REGISTRATION_EMAIL_ALLOWLIST` con emails internos, testers y early adopters

Esto deja el acceso controlado sin agregar paneles de administración ni feature flags complejas.

## 9. Checklist de producción

- [ ] `GET /v1/health` responde `ok`
- [ ] login OK
- [ ] refresh OK
- [ ] logout OK
- [ ] crear mascota OK
- [ ] editar mascota OK
- [ ] activar dispositivo OK
- [ ] asignar dispositivo OK
- [ ] sync real desde Android OK
- [ ] dashboard muestra datos reales
- [ ] history correcto
- [ ] timezone correcto
- [ ] duplicados controlados
- [ ] errores controlados
- [ ] responsive básico OK
- [ ] variables correctas
- [ ] CORS correcto
- [ ] registro limitado solo a allowlist

## 10. Rollback simple

### Web

- volver al deploy anterior desde Vercel

### API

- redeploy de la versión anterior desde Railway

### DB

- evitar migraciones destructivas en el primer release
- si una migración es riesgosa, hacer backup/restore point antes
- si la app falla pero la migración no es destructiva, hacer rollback de app primero

## 11. Soporte inicial después del release

Durante la primera ventana de release:

- revisar logs de auth
- revisar logs de sync
- revisar errores HTTP 4xx/5xx
- validar que los primeros usuarios reales entren en la allowlist correcta

## 12. Qué queda pendiente después del primer release

- captura externa de errores tipo Sentry
- métricas agregadas y alertas
- rate limiting distribuido
- runbooks más detallados
- estrategia de soporte/incident response más formal

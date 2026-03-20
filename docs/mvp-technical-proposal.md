# PawActivity - Propuesta técnica concreta del MVP

## 1. Decisiones confirmadas

A partir de tus ajustes, el MVP debe construirse con esta separación obligatoria:

- **Sitio público en WordPress**.
- **Plataforma privada completamente separada** de WordPress.
- **Backend/API independiente** para autenticación, negocio y sincronización.
- **Dashboard simple, profesional y sin sobreingeniería**.

## 2. Arquitectura concreta del MVP

## Dominios recomendados
- `pawactivity.com` → WordPress marketing.
- `app.pawactivity.com` → plataforma privada.
- `api.pawactivity.com` → backend/API.

## Arquitectura funcional

```txt
[Usuario web] ---> [WordPress público - pawactivity.com]
                      |
                      └--> CTA a registro/login

[Usuario autenticado] ---> [Next.js app - app.pawactivity.com]
                               |
                               v
                         [NestJS API - api.pawactivity.com]
                               |
                 ┌-------------┴-------------┐
                 v                           v
           [PostgreSQL]                 [Redis opcional]
                 ^
                 |
         [App móvil PawActivity]
                 |
                 v
       Sincronización de actividad
```

## Decisión técnica final del MVP

### Marketing público
- **WordPress** con tema liviano personalizado.
- Constructor visual solo si realmente lo necesitan; si no, mejor un tema custom simple.
- Formularios conectados al API o a email/CRM.

### Plataforma privada
- **Next.js + TypeScript**.
- Renderizado híbrido con páginas autenticadas protegidas.
- UI basada en componentes reutilizables.

### API y lógica de negocio
- **NestJS + TypeScript**.
- Módulos separados por dominio:
  - auth
  - users
  - pets
  - devices
  - activity
  - sync

### Base de datos
- **PostgreSQL**.
- Modelo relacional simple y claro.

### ORM
- **Prisma**.

### Cache / soporte
- **Redis** es opcional en el MVP: úsalo solo si implementan rate limit distribuido, colas o caché real.
- Si quieren máxima simplicidad inicial, puede entrar en fase 2 técnica.

---

## 3. Qué incluye realmente el MVP

## Alcance funcional del MVP

### Sitio público
- Home.
- Sección de producto.
- Cómo funciona.
- Beneficios.
- FAQ.
- Contacto/interés.
- CTA a compra o registro.

### Plataforma privada
- Registro.
- Login.
- Recuperación de contraseña.
- Dashboard principal.
- Alta de mascota.
- Edición de perfil de mascota.
- Vinculación de dispositivo.
- Vista de actividad diaria, semanal y mensual.
- Estado de última sincronización.
- Estado de batería si la app lo envía.

### Backend/API
- Registro e inicio de sesión.
- Gestión de mascotas.
- Gestión de dispositivos.
- Endpoint de sincronización desde app móvil.
- Lectura de históricos y resúmenes.

## Lo que **no** debe entrar en este MVP
- Panel administrativo complejo.
- Multiusuario por hogar.
- Roles avanzados.
- Alertas inteligentes.
- Recomendaciones basadas en IA.
- Comparativas veterinarias avanzadas.
- Integraciones externas no críticas.
- IoT directo dispositivo → cloud si hoy la app ya hace de puente.

---

## 4. Stack definitivo sugerido para este MVP

## Frontend privado
- **Next.js 15**
- **React**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**
- **Recharts**
- **React Hook Form + Zod**

## Backend
- **NestJS**
- **TypeScript**
- **Prisma**
- **PostgreSQL**
- **JWT + refresh tokens**
- **Argon2**

## DevOps / calidad
- **GitHub** desde el inicio.
- **GitHub Actions** para lint, typecheck y build.
- **Docker** para desarrollo y despliegue repetible.
- **Sentry** opcional desde fase 2.

## WordPress público
- Tema custom.
- Plugins mínimos.
- Formularios seguros.
- Recomendado separar hosting WordPress del hosting app/API si el proveedor lo permite.

---

## 5. Estructura de repositorio recomendada

## Recomendación práctica
Aunque WordPress viva aparte operativamente, conviene que el desarrollo del producto vaya en un repositorio GitHub principal para app + API + docs.

```txt
pawactivity-platform/
├─ apps/
│  ├─ web/                  # Next.js app privada
│  └─ api/                  # NestJS API
├─ packages/
│  ├─ ui/
│  ├─ types/
│  ├─ validation/
│  └─ config/
├─ prisma/
│  ├─ schema.prisma
│  └─ migrations/
├─ docs/
│  ├─ architecture.md
│  └─ mvp-technical-proposal.md
├─ infra/
│  ├─ docker/
│  └─ deploy/
├─ .github/workflows/
├─ package.json
├─ pnpm-workspace.yaml
└─ turbo.json
```

## Recomendación para WordPress
Dos opciones válidas:

### Opción simple
- WordPress fuera de este repo.
- Solo se documenta la integración y enlaces.

### Opción ordenada
- Repositorio separado: `pawactivity-marketing`.
- Repositorio principal: `pawactivity-platform`.

**Mi recomendación:** separar WordPress en otro repo si realmente habrá customización propia.

---

## 6. Estructura concreta de la app privada

```txt
apps/web/
├─ app/
│  ├─ (auth)/
│  │  ├─ login/
│  │  ├─ register/
│  │  └─ forgot-password/
│  ├─ dashboard/
│  ├─ pets/
│  │  ├─ page.tsx
│  │  └─ [petId]/page.tsx
│  ├─ devices/
│  ├─ history/
│  ├─ account/
│  └─ layout.tsx
├─ components/
│  ├─ dashboard/
│  ├─ charts/
│  ├─ pets/
│  └─ shared/
├─ lib/
│  ├─ api-client.ts
│  ├─ auth.ts
│  └─ utils.ts
├─ hooks/
└─ styles/
```

## Pantallas obligatorias del MVP

### 1. Login
- Email.
- Contraseña.
- Link recuperar contraseña.
- Link registro.

### 2. Registro
- Nombre.
- Email.
- Contraseña.
- Confirmación.

### 3. Dashboard
- Tarjetas con Reposo / Caminar / Correr del día.
- Gráfico donut diario.
- Barras últimos 7 días.
- Última sincronización.
- Estado de batería.
- Selector de mascota.

### 4. Perfil de mascota
- Nombre.
- Raza.
- Edad o fecha de nacimiento.
- Peso.
- Foto opcional.
- Dispositivo vinculado.

### 5. Historial
- Lista por fecha.
- Filtros simples.
- Eventos o bloques de actividad.

### 6. Dispositivo
- Código o serial.
- Estado.
- Última sincronización.
- Batería.

---

## 7. Dashboard MVP: simple pero profesional

## Principio clave
No construir analítica compleja al inicio. El dashboard debe responder solo 4 preguntas:

1. ¿Cómo estuvo hoy mi perro?
2. ¿Está más activo o menos que otros días?
3. ¿El dispositivo sincronizó correctamente?
4. ¿Qué mascota estoy viendo?

## Widgets recomendados

### Bloque superior
- Selector de mascota.
- Última sincronización.
- Estado de batería.

### Resumen principal
- Card: Reposo hoy.
- Card: Caminar hoy.
- Card: Correr hoy.
- Card: Total activo.

### Visualización principal
- Donut diario con distribución de estados.

### Visualización secundaria
- Barras últimos 7 días con minutos activos.

### Bloque inferior
- Timeline simple del día.
- Estado del dispositivo.

## Qué evitar
- Mapas.
- Demasiados filtros.
- Gráficas técnicas difíciles de leer.
- KPIs redundantes.
- Terminología demasiado científica.

---

## 8. Backend/API concreto del MVP

## Módulos de NestJS

### `auth`
- registro
- login
- refresh
- logout
- forgot password
- reset password

### `users`
- perfil del usuario
- actualización básica

### `pets`
- CRUD básico de mascota

### `devices`
- activación
- consulta de estado
- asignación a mascota

### `activity`
- consulta de resúmenes
- consulta de históricos

### `sync`
- recepción de lotes desde la app
- validación
- almacenamiento
- actualización de última sincronización

---

## 9. Endpoints mínimos para lanzar el MVP

## Auth
- `POST /v1/auth/register`
- `POST /v1/auth/login`
- `POST /v1/auth/refresh`
- `POST /v1/auth/logout`
- `POST /v1/auth/forgot-password`
- `POST /v1/auth/reset-password`
- `GET /v1/auth/me`

## Pets
- `GET /v1/pets`
- `POST /v1/pets`
- `GET /v1/pets/:petId`
- `PATCH /v1/pets/:petId`

## Devices
- `POST /v1/devices/activate`
- `POST /v1/pets/:petId/devices/assign`
- `GET /v1/devices/:deviceId/status`

## Activity
- `POST /v1/activity/sync`
- `GET /v1/pets/:petId/activity/daily`
- `GET /v1/pets/:petId/activity/weekly`
- `GET /v1/pets/:petId/activity/monthly`
- `GET /v1/pets/:petId/activity/history`

---

## 10. Contrato de sincronización recomendado

## Suposición MVP
La **app móvil** es quien autentica al usuario y envía los datos al backend. El dispositivo no necesita hablar directo con la nube en esta primera etapa.

## Payload sugerido

```json
{
  "petId": "uuid",
  "deviceId": "uuid",
  "generatedAt": "2026-03-20T10:30:00Z",
  "timezone": "America/Mexico_City",
  "batteryLevel": 83,
  "events": [
    {
      "activityType": "rest",
      "startedAt": "2026-03-20T00:00:00Z",
      "endedAt": "2026-03-20T06:00:00Z",
      "durationSeconds": 21600,
      "confidence": 0.98
    },
    {
      "activityType": "walk",
      "startedAt": "2026-03-20T08:00:00Z",
      "endedAt": "2026-03-20T08:20:00Z",
      "durationSeconds": 1200,
      "confidence": 0.94
    }
  ]
}
```

## Respuesta recomendada

```json
{
  "success": true,
  "recordsReceived": 2,
  "syncedAt": "2026-03-20T10:31:02Z"
}
```

## Reglas mínimas del endpoint
- Validar ownership de la mascota.
- Validar que el dispositivo esté asignado a esa mascota.
- Rechazar eventos inválidos o con rangos imposibles.
- Guardar log de sync.
- Actualizar `battery_level` y `last_seen_at` del dispositivo.

---

## 11. Modelo de datos mínimo para construir ya

## Tablas mínimas necesarias
- `users`
- `auth_sessions`
- `pets`
- `devices`
- `pet_devices`
- `activity_events`
- `activity_daily_summaries`
- `sync_logs`
- `password_resets`

## Decisión importante
Para el MVP, basta con:
- guardar eventos recibidos,
- generar resumen diario,
- calcular semanal/mensual desde resumen diario o consulta agregada.

No hace falta crear desde el día 1 una arquitectura de analítica compleja.

---

## 12. Seguridad mínima obligatoria del MVP

- HTTPS obligatorio en app y API.
- JWT de corta duración.
- Refresh token persistido como hash.
- Hash de contraseña con Argon2.
- Rate limiting en login y sync.
- Validación con DTOs + Zod o class-validator.
- Logs de actividad crítica.
- Secrets por ambiente.
- CORS restringido a `app.pawactivity.com` y apps móviles oficiales.

---

## 13. Infraestructura MVP recomendada

## Opción simple y profesional

### WordPress
- Hosting administrado o proveedor actual.

### App + API + DB
Puede ir en un proveedor cloud separado del WordPress.

#### Setup recomendado
- **Frontend web (Next.js)**: Vercel o servidor Node administrado.
- **API NestJS**: Railway, Render, Fly.io, VPS o contenedor Docker.
- **PostgreSQL**: Neon, Supabase Postgres, Railway Postgres o RDS.

## Recomendación práctica
Si quieren velocidad de salida:
- WordPress en hosting actual.
- Next.js en Vercel.
- API en Railway/Render.
- PostgreSQL administrado.

Eso reduce carga DevOps y acelera el MVP.

---

## 14. Roadmap técnico concreto

## Sprint 0 - Base técnica
- Crear repositorio GitHub.
- Configurar monorepo.
- Configurar CI básica.
- Levantar Next.js + NestJS + Prisma.
- Configurar PostgreSQL de desarrollo.
- Definir esquema inicial.

## Sprint 1 - Auth + estructura privada
- Login, registro y recuperación.
- Layout autenticado.
- Protección de rutas.
- Perfil de usuario básico.

## Sprint 2 - Mascotas + dispositivos
- CRUD básico de mascota.
- Activación de dispositivo.
- Asociación mascota-dispositivo.
- Estado del dispositivo.

## Sprint 3 - Sync de actividad
- Endpoint `/v1/activity/sync`.
- Persistencia de eventos.
- Logs de sincronización.
- Última sincronización visible en dashboard.

## Sprint 4 - Dashboard MVP
- Cards de resumen.
- Donut diario.
- Barras semanales.
- Historial simple.
- Vista mensual básica.

## Sprint 5 - Hardening
- Rate limiting.
- Manejo de errores.
- Observabilidad básica.
- QA responsivo.
- Ajustes UX/UI.

---

## 15. Recomendación final ejecutable

Si hoy tu objetivo es salir con un MVP sólido, la implementación concreta debería ser esta:

1. **WordPress solo para marketing** en `pawactivity.com`.
2. **Next.js privado** en `app.pawactivity.com`.
3. **NestJS API** en `api.pawactivity.com`.
4. **PostgreSQL** como única fuente de verdad.
5. **App móvil sincronizando contra la misma API** que consume el dashboard.
6. **Dashboard simple** con foco en Reposo, Caminar, Correr, última sync y batería.
7. **Sin funciones avanzadas innecesarias en fase 1**.

Esta es la arquitectura más equilibrada entre velocidad, claridad, mantenimiento y escalabilidad.

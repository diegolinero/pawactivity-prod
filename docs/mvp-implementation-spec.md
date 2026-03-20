# PawActivity - Especificación técnica de implementación MVP

## 1. Arquitectura técnica final

## Arquitectura recomendada
Para el MVP de PawActivity recomiendo esta arquitectura final:

- **`pawactivity.com`** → sitio público en **WordPress**.
- **`app.pawactivity.com`** → plataforma privada en **Next.js**.
- **`api.pawactivity.com`** → backend REST en **NestJS**.
- **PostgreSQL** → base de datos única del producto.

## Razón de esta decisión
- WordPress sí tiene sentido para la parte pública porque permite editar contenido comercial rápido.
- La plataforma privada **no** debe vivir dentro de WordPress porque necesita autenticación, dashboard, consultas de actividad y evolución de producto.
- La app móvil y la plataforma web deben consumir **la misma API** para evitar duplicación de lógica.
- La solución sigue siendo simple, moderna y mantenible.

## Vista simplificada

```txt
pawactivity.com           -> WordPress (marketing)
app.pawactivity.com       -> Next.js (panel privado)
api.pawactivity.com       -> NestJS REST API
postgres.pawactivity      -> PostgreSQL
```

---

## 2. Monorepo o multirepo y por qué

## Recomendación final: **monorepo para producto + repo separado opcional para WordPress**

### Recomendación práctica
- **1 monorepo** para `web` + `api` + `packages compartidos` + `db schema` + `docs`.
- **WordPress fuera del monorepo**, idealmente en otro repo o gestionado aparte.

### ¿Por qué no meter WordPress dentro del mismo monorepo?
- Tiene ciclos de vida distintos.
- Lo administrará probablemente otro flujo o equipo.
- No comparte casi nada con la app privada a nivel de código.

### ¿Por qué sí usar monorepo para app privada + API?
- Permite compartir tipos y validaciones.
- Facilita CI/CD y versionado.
- Reduce fricción entre frontend y backend.
- Es ideal para un MVP que luego crecerá.

---

## 3. Estructura real del repositorio

## Repositorio principal recomendado
Nombre sugerido: `pawactivity-platform`

```txt
pawactivity-platform/
├─ apps/
│  ├─ web/
│  │  ├─ app/
│  │  │  ├─ (auth)/
│  │  │  │  ├─ login/page.tsx
│  │  │  │  ├─ register/page.tsx
│  │  │  │  ├─ forgot-password/page.tsx
│  │  │  │  └─ reset-password/page.tsx
│  │  │  ├─ dashboard/page.tsx
│  │  │  ├─ pets/page.tsx
│  │  │  ├─ pets/new/page.tsx
│  │  │  ├─ pets/[petId]/page.tsx
│  │  │  ├─ pets/[petId]/edit/page.tsx
│  │  │  ├─ history/page.tsx
│  │  │  ├─ devices/page.tsx
│  │  │  ├─ account/page.tsx
│  │  │  ├─ layout.tsx
│  │  │  └─ page.tsx
│  │  ├─ components/
│  │  │  ├─ charts/
│  │  │  ├─ dashboard/
│  │  │  ├─ forms/
│  │  │  ├─ layout/
│  │  │  ├─ pets/
│  │  │  └─ shared/
│  │  ├─ lib/
│  │  │  ├─ api-client.ts
│  │  │  ├─ auth.ts
│  │  │  ├─ config.ts
│  │  │  └─ formatters.ts
│  │  ├─ hooks/
│  │  ├─ styles/
│  │  ├─ middleware.ts
│  │  ├─ next.config.ts
│  │  └─ package.json
│  └─ api/
│     ├─ src/
│     │  ├─ main.ts
│     │  ├─ app.module.ts
│     │  ├─ common/
│     │  │  ├─ decorators/
│     │  │  ├─ dto/
│     │  │  ├─ filters/
│     │  │  ├─ guards/
│     │  │  ├─ interceptors/
│     │  │  └─ pipes/
│     │  ├─ config/
│     │  ├─ modules/
│     │  │  ├─ auth/
│     │  │  ├─ users/
│     │  │  ├─ pets/
│     │  │  ├─ devices/
│     │  │  ├─ activity/
│     │  │  └─ sync/
│     │  └─ prisma/
│     ├─ test/
│     ├─ nest-cli.json
│     └─ package.json
├─ packages/
│  ├─ ui/
│  │  ├─ src/
│  │  │  ├─ components/
│  │  │  └─ index.ts
│  │  └─ package.json
│  ├─ types/
│  │  ├─ src/
│  │  │  ├─ auth.ts
│  │  │  ├─ pets.ts
│  │  │  ├─ devices.ts
│  │  │  └─ activity.ts
│  │  └─ package.json
│  ├─ validation/
│  │  ├─ src/
│  │  │  ├─ auth.schemas.ts
│  │  │  ├─ pets.schemas.ts
│  │  │  ├─ devices.schemas.ts
│  │  │  └─ activity.schemas.ts
│  │  └─ package.json
│  └─ config/
│     ├─ eslint/
│     ├─ typescript/
│     └─ tailwind/
├─ prisma/
│  ├─ schema.prisma
│  ├─ seed.ts
│  └─ migrations/
├─ docs/
│  ├─ architecture.md
│  ├─ mvp-technical-proposal.md
│  └─ mvp-implementation-spec.md
├─ infra/
│  ├─ docker/
│  │  ├─ api.Dockerfile
│  │  └─ web.Dockerfile
│  ├─ local/
│  │  └─ docker-compose.yml
│  └─ deploy/
├─ .github/
│  └─ workflows/
│     ├─ ci.yml
│     └─ deploy.yml
├─ package.json
├─ pnpm-workspace.yaml
├─ turbo.json
├─ tsconfig.base.json
└─ README.md
```

---

## 4. Tecnologías exactas

## Sitio público
- **WordPress**
- Tema custom ligero
- Formularios con plugin confiable o endpoint propio hacia el backend si se desea centralizar leads

## Frontend privado
- **Next.js 15**
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**
- **React Hook Form**
- **Zod**
- **TanStack Query**
- **Recharts**
- **date-fns**
- **Lucide React**

## Backend
- **NestJS**
- **TypeScript**
- **Prisma ORM**
- **PostgreSQL**
- **class-validator**
- **class-transformer**
- **@nestjs/jwt**
- **passport**
- **passport-jwt**
- **argon2**

## Infraestructura mínima
- **Vercel** para `app.pawactivity.com`
- **Railway / Render / Fly.io** para `api.pawactivity.com`
- **Neon / Supabase Postgres / Railway Postgres** para PostgreSQL
- **Cloudflare DNS** para dominios y SSL si quieren una capa limpia delante

---

## 5. Estructura del backend

## Módulos exactos

```txt
apps/api/src/modules/
├─ auth/
│  ├─ auth.controller.ts
│  ├─ auth.service.ts
│  ├─ auth.module.ts
│  ├─ dto/
│  └─ strategies/
├─ users/
│  ├─ users.controller.ts
│  ├─ users.service.ts
│  ├─ users.module.ts
│  └─ dto/
├─ pets/
│  ├─ pets.controller.ts
│  ├─ pets.service.ts
│  ├─ pets.module.ts
│  └─ dto/
├─ devices/
│  ├─ devices.controller.ts
│  ├─ devices.service.ts
│  ├─ devices.module.ts
│  └─ dto/
├─ activity/
│  ├─ activity.controller.ts
│  ├─ activity.service.ts
│  ├─ activity.module.ts
│  └─ dto/
└─ sync/
   ├─ sync.controller.ts
   ├─ sync.service.ts
   ├─ sync.module.ts
   └─ dto/
```

## Responsabilidad de cada módulo
- `auth`: registro, login, refresh, logout, recuperación de contraseña.
- `users`: perfil del usuario autenticado.
- `pets`: CRUD básico de mascotas.
- `devices`: activación y asociación de dispositivo.
- `activity`: resúmenes diarios, semanales, mensuales e histórico.
- `sync`: recepción de eventos desde la app móvil.

---

## 6. Estructura de la base de datos

## Motor
- **PostgreSQL 16**

## Criterio del MVP
- Modelo relacional simple.
- Guardar eventos crudos.
- Generar resúmenes diarios.
- Obtener semanal y mensual por agregación.

## Tablas principales
- `users`
- `auth_sessions`
- `password_resets`
- `pets`
- `devices`
- `pet_devices`
- `activity_events`
- `activity_daily_summaries`
- `sync_logs`
- `contact_leads` (opcional pero útil si centralizan formularios)

---

## 7. Modelo SQL inicial

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash TEXT NOT NULL,
  device_name VARCHAR(120),
  user_agent TEXT,
  ip_address INET,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  breed VARCHAR(120),
  birth_date DATE,
  weight_kg NUMERIC(5,2),
  sex VARCHAR(20),
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number VARCHAR(120) NOT NULL UNIQUE,
  model VARCHAR(80) NOT NULL,
  firmware_version VARCHAR(50),
  status VARCHAR(30) NOT NULL DEFAULT 'inactive',
  battery_level SMALLINT,
  activated_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pet_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unassigned_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  activity_type VARCHAR(20) NOT NULL CHECK (activity_type IN ('rest', 'walk', 'run')),
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  duration_seconds INTEGER NOT NULL,
  confidence NUMERIC(4,3),
  source VARCHAR(30) NOT NULL DEFAULT 'mobile_app',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE activity_daily_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  summary_date DATE NOT NULL,
  rest_seconds INTEGER NOT NULL DEFAULT 0,
  walk_seconds INTEGER NOT NULL DEFAULT 0,
  run_seconds INTEGER NOT NULL DEFAULT 0,
  total_active_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (pet_id, summary_date)
);

CREATE TABLE sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  records_received INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'success',
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  error_message TEXT
);

CREATE TABLE contact_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  message TEXT,
  source VARCHAR(50) NOT NULL DEFAULT 'website',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pets_user_id ON pets(user_id);
CREATE INDEX idx_pet_devices_pet_id ON pet_devices(pet_id);
CREATE INDEX idx_pet_devices_device_id ON pet_devices(device_id);
CREATE INDEX idx_activity_events_pet_id_started_at ON activity_events(pet_id, started_at DESC);
CREATE INDEX idx_activity_daily_summaries_pet_id_date ON activity_daily_summaries(pet_id, summary_date DESC);
CREATE INDEX idx_sync_logs_user_id_synced_at ON sync_logs(user_id, synced_at DESC);
```

---

## 8. Endpoints REST iniciales

## Base URL
- `https://api.pawactivity.com/v1`

## Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /auth/me`

## Users
- `GET /users/me`
- `PATCH /users/me`

## Pets
- `GET /pets`
- `POST /pets`
- `GET /pets/:petId`
- `PATCH /pets/:petId`
- `DELETE /pets/:petId`

## Devices
- `POST /devices/activate`
- `GET /devices/:deviceId`
- `GET /devices/:deviceId/status`
- `POST /pets/:petId/devices/assign`
- `POST /pets/:petId/devices/unassign`

## Activity
- `POST /activity/sync`
- `GET /pets/:petId/activity/daily?date=2026-03-20`
- `GET /pets/:petId/activity/weekly?startDate=2026-03-16`
- `GET /pets/:petId/activity/monthly?month=2026-03`
- `GET /pets/:petId/activity/history?page=1&limit=20`
- `GET /pets/:petId/activity/timeline?date=2026-03-20`

## Leads
- `POST /leads`

---

## 9. Páginas concretas del frontend público

Estas páginas vivirían en WordPress:

- `/` → Home
- `/producto` → overview del producto
- `/como-funciona` → proceso dispositivo + app + dashboard
- `/beneficios` → beneficios para dueños
- `/faq` → preguntas frecuentes
- `/contacto` → formulario de interés
- `/comprar` o `/reserva` → CTA comercial
- `/privacidad`
- `/terminos`

## Header público recomendado
- Logo
- Producto
- Cómo funciona
- Beneficios
- FAQ
- Iniciar sesión
- CTA Comprar

---

## 10. Páginas concretas del frontend privado

Estas páginas vivirían en `app.pawactivity.com`:

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/dashboard`
- `/pets`
- `/pets/new`
- `/pets/[petId]`
- `/pets/[petId]/edit`
- `/history`
- `/devices`
- `/account`

## Qué muestra cada una

### `/dashboard`
- Resumen actual.
- Donut diario.
- Barras semanales.
- Última sincronización.
- Batería.

### `/pets`
- Lista de mascotas del usuario.
- CTA para agregar mascota.

### `/pets/[petId]`
- Perfil de mascota.
- Resumen semanal.
- Estado del dispositivo.

### `/history`
- Historial paginado.
- Timeline por día.

### `/devices`
- Activar dispositivo.
- Estado del dispositivo vinculado.

### `/account`
- Datos del usuario.
- Cambio de contraseña.
- Cerrar sesión.

---

## 11. Componentes UI exactos

## Shared
- `AppShell`
- `SidebarNav`
- `Topbar`
- `PageHeader`
- `StatCard`
- `EmptyState`
- `LoadingState`
- `ConfirmDialog`
- `StatusBadge`
- `PrimaryButton`
- `SecondaryButton`

## Auth
- `LoginForm`
- `RegisterForm`
- `ForgotPasswordForm`
- `ResetPasswordForm`

## Dashboard
- `PetSelector`
- `ActivitySummaryCards`
- `ActivityDonutChart`
- `WeeklyActivityBarChart`
- `ActivityTimeline`
- `SyncStatusCard`
- `BatteryStatusCard`

## Pets
- `PetCard`
- `PetForm`
- `PetProfileHeader`
- `PetStatsPanel`

## Devices
- `DeviceActivationForm`
- `DeviceStatusPanel`
- `DeviceAssignmentCard`

## Forms
- `TextField`
- `PasswordField`
- `SelectField`
- `DateField`
- `WeightField`

---

## 12. Librerías recomendadas para gráficas

## Recomendación principal
- **Recharts**

### Por qué
- Muy buena para dashboards simples.
- Rápida de implementar.
- Suficiente para donut, barras y líneas del MVP.
- Menos compleja que alternativas más pesadas.

## Gráficas concretas del MVP
- Donut: distribución diaria de `rest / walk / run`
- Barras: actividad últimos 7 días
- Línea opcional: tendencia mensual

---

## 13. Librerías recomendadas para autenticación

## Frontend
- manejo de sesión propio con **httpOnly refresh cookie** o refresh token seguro
- cliente API con **fetch** o `ky`
- formularios con **React Hook Form + Zod**

## Backend
- `@nestjs/jwt`
- `passport`
- `passport-jwt`
- `argon2`

## Estrategia recomendada
- Access token corto.
- Refresh token persistido en `auth_sessions`.
- Logout con revocación de sesión.
- Recuperación de contraseña con token temporal.

**No recomiendo meter una solución de auth excesivamente abstracta** si el MVP tendrá una API propia clara.

---

## 14. Estrategia de despliegue

## Subdominios
- `pawactivity.com` → WordPress
- `app.pawactivity.com` → Next.js
- `api.pawactivity.com` → NestJS

## Despliegue recomendado para MVP

### Opción simple
- WordPress en hosting administrado actual.
- Next.js en **Vercel**.
- API en **Railway** o **Render**.
- PostgreSQL administrado en **Neon** o **Supabase Postgres**.

### Flujo de despliegue
1. Push a GitHub.
2. GitHub Actions ejecuta lint + typecheck + build.
3. Merge a `main`.
4. Deploy automático:
   - `web` a Vercel
   - `api` a Railway/Render
5. Variables de entorno por ambiente.

## Ambientes mínimos
- `development`
- `staging`
- `production`

---

## 15. Plan de desarrollo por sprint

## Sprint 0 - Setup
- Crear repo GitHub.
- Configurar monorepo con `pnpm` + `turbo`.
- Crear app `web` y `api`.
- Configurar Prisma y PostgreSQL local.
- Configurar CI.

## Sprint 1 - Auth
- Registro.
- Login.
- Refresh token.
- Forgot/reset password.
- Protección de rutas privadas.

## Sprint 2 - Mascotas y dispositivos
- CRUD básico de mascotas.
- Pantallas `/pets`, `/pets/new`, `/pets/[petId]`.
- Activación de dispositivo.
- Asociación mascota-dispositivo.

## Sprint 3 - Sync backend
- Endpoint `POST /activity/sync`.
- Guardado de `activity_events`.
- Guardado de `sync_logs`.
- Actualización de batería y última sincronización.

## Sprint 4 - Dashboard MVP
- `/dashboard`
- Cards de resumen.
- Donut diario.
- Barras semanales.
- Timeline diario.

## Sprint 5 - Hardening y release
- Validaciones finales.
- Manejo de errores.
- QA responsive.
- Logs básicos.
- Deploy de producción.

---

## 16. Recomendación final cerrada

Si quieres una implementación MVP realista y mantenible, mi recomendación final es esta:

- **WordPress solo para marketing** en `pawactivity.com`.
- **Monorepo para producto** con `apps/web` + `apps/api`.
- **Next.js** para la plataforma privada en `app.pawactivity.com`.
- **NestJS + PostgreSQL + Prisma** para la API y persistencia.
- **Recharts** para gráficas.
- **JWT + refresh sessions** para autenticación.
- **Despliegue simple** con WordPress por un lado y app/API separados por subdominios.

Esto evita sobreingeniería, acelera el MVP y deja una base correcta para crecer después.

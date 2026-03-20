# PawActivity - Arquitectura recomendada del proyecto

## 1. Recomendación de arquitectura final

### Recomendación principal: **Solución híbrida (Opción C)**

La mejor opción para PawActivity es separar el proyecto en cuatro capas:

- **Sitio público de marketing**.
- **Plataforma privada de usuarios**.
- **Backend/API central**.
- **Base de datos relacional + almacenamiento histórico**.

### Decisión recomendada

#### **WordPress solo para marketing**
Úsalo únicamente para:
- Home.
- Landing pages.
- FAQ.
- Blog/noticias.
- Formularios de contacto/interés.
- Gestión simple de contenido por parte del equipo no técnico.

#### **Aplicación privada y backend hechos a medida**
Crea una app web separada para:
- Login/registro.
- Dashboard de actividad.
- Asociación usuario-mascota-dispositivo.
- Históricos, métricas y sincronización con la app móvil.

### Por qué esta opción es la mejor

#### Ventajas
- **Escalable**: la parte privada no queda limitada por WordPress.
- **Mantenible**: marketing y producto evolucionan por separado.
- **Segura**: el área autenticada no depende del ecosistema de plugins de WordPress.
- **Flexible**: la app móvil puede integrarse directo con una API moderna.
- **Profesional**: permite un dashboard sólido y rápido sin hacks.

#### Por qué no recomiendo hacerlo todo en WordPress
- WordPress no es ideal para dashboards complejos ni sincronización de datos de dispositivos.
- Forzar autenticación, métricas y lógica de negocio dentro de WP suele generar deuda técnica.
- A medio plazo complica permisos, rendimiento, mantenimiento y seguridad.

#### Por qué no recomiendo hacer absolutamente todo custom en el MVP
- Si el hosting ya soporta WordPress, aprovecharlo para marketing reduce tiempo y costo.
- El equipo de negocio podrá editar contenido sin tocar despliegues de producto.
- La parte crítica sigue quedando en una plataforma escalable separada.

---

## 2. Stack tecnológico sugerido

## Opción recomendada para MVP serio y escalable

### Frontend público
**Opción A recomendada:** WordPress + tema custom ligero
- Ideal si el equipo necesita editar textos, FAQ, campañas y páginas fácilmente.
- Puede convivir con dominio principal: `pawactivity.com`

**Alternativa si no quieren WordPress:** Next.js marketing site
- Mejor performance/control técnico.
- Requiere más participación del equipo de desarrollo.

### Frontend privado
**Next.js (React + TypeScript)**
- Excelente para dashboards.
- Buen soporte para SSR/CSR.
- Escalable para panel web y futura expansión.
- Componentización clara y moderna.

### Backend/API
**NestJS o Express con TypeScript**

Recomendación concreta:
- **NestJS** si quieren estructura robusta desde el inicio.
- **Express/Fastify** si quieren un MVP más liviano.

Mi recomendación final: **NestJS + TypeScript**.

### Base de datos
**PostgreSQL**
- Muy buena opción para relaciones entre usuarios, perros y dispositivos.
- Excelente para consultas analíticas simples y escalado inicial.
- Permite crecer a particionamiento o réplicas más adelante.

### ORM
**Prisma**
- Productivo para MVP.
- Tipado fuerte.
- Migraciones limpias.

### Autenticación
- **JWT access token + refresh token**.
- Password hashing con **Argon2** o **bcrypt**.
- Soporte para sesiones por dispositivo.

### Infraestructura complementaria
- **Redis** para cache, rate limiting, colas o sesiones temporales.
- **S3 compatible storage** para imágenes, reportes o assets si aplica.
- **Cloudflare** para CDN/WAF si se escala públicamente.

### Data visualization
- **Recharts** o **Chart.js** para dashboard privado.

### UI
- **Tailwind CSS** + sistema de componentes.
- **shadcn/ui** o librería equivalente para acelerar consistencia visual.

---

## 3. Estructura de carpetas del proyecto

### Recomendación: monorepo desde el inicio

Esto facilita compartir tipos, validaciones y contratos entre frontend y backend.

```txt
pawactivity/
├─ apps/
│  ├─ marketing/               # Sitio público si no usan WordPress
│  ├─ web/                     # Plataforma privada de usuarios
│  ├─ api/                     # Backend/API principal
│  └─ admin/                   # Opcional: panel interno futuro
├─ packages/
│  ├─ ui/                      # Componentes compartidos
│  ├─ config/                  # ESLint, TS, Tailwind, prettier
│  ├─ types/                   # Tipos compartidos
│  ├─ validation/              # Esquemas Zod/DTOs compartidos
│  └─ utils/                   # Helpers comunes
├─ docs/
│  ├─ architecture.md
│  ├─ api-spec.md              # Futuro
│  └─ product-notes.md         # Futuro
├─ infra/
│  ├─ docker/
│  ├─ nginx/
│  └─ deploy/
├─ prisma/
│  ├─ schema.prisma
│  └─ migrations/
├─ scripts/
├─ .github/
│  └─ workflows/
├─ package.json
├─ pnpm-workspace.yaml
├─ turbo.json
└─ README.md
```

### Si usan WordPress para marketing
Entonces la separación operativa recomendada es:

- `pawactivity.com` → WordPress marketing.
- `app.pawactivity.com` → plataforma privada Next.js.
- `api.pawactivity.com` → API NestJS.

---

## 4. Mapa del sitio

## Sitio público

```txt
/
├─ Home
├─ Producto
│  ├─ Cómo funciona
│  ├─ Características
│  ├─ Beneficios
│  └─ Tecnología
├─ App móvil
├─ Para dueños de perros
├─ FAQ
├─ Contacto / Quiero información
├─ Comprar / Reserva
├─ Iniciar sesión
└─ Política / Términos / Privacidad
```

## Plataforma privada

```txt
/app
├─ Login
├─ Registro
├─ Recuperar contraseña
├─ Dashboard
│  ├─ Resumen general
│  ├─ Actividad diaria
│  ├─ Actividad semanal
│  └─ Actividad mensual
├─ Mascotas
│  ├─ Lista de mascotas
│  └─ Perfil de mascota
├─ Dispositivos
│  ├─ Vincular dispositivo
│  └─ Estado/sincronización
├─ Historial
├─ Cuenta
│  ├─ Perfil
│  ├─ Seguridad
│  └─ Preferencias
└─ Soporte
```

---

## 5. Flujo de usuario

## Flujo público
1. El usuario llega a la Home.
2. Entiende la propuesta de valor en pocos segundos.
3. Ve beneficios, capturas y cómo funciona.
4. Decide una acción:
   - Comprar.
   - Dejar sus datos.
   - Crear cuenta.
   - Iniciar sesión.

## Flujo de plataforma privada
1. Usuario se registra o inicia sesión.
2. Completa perfil básico.
3. Registra su mascota.
4. Vincula el dispositivo al perro.
5. La app móvil sincroniza datos con la API.
6. El usuario entra al dashboard y revisa:
   - actividad del día,
   - histórico,
   - nivel de actividad,
   - última sincronización,
   - batería del dispositivo.

## Flujo app móvil → servidor → dashboard
1. El dispositivo envía o transfiere datos a la app móvil.
2. La app móvil agrupa eventos y métricas.
3. La app autentica al usuario o dispositivo ante la API.
4. La API recibe, valida y almacena los eventos.
5. Un proceso calcula agregados diarios/semanales/mensuales.
6. El dashboard consulta datos resumidos e históricos.

---

## 6. Modelo de datos inicial

## Entidades principales

### `users`
- `id`
- `email`
- `password_hash`
- `first_name`
- `last_name`
- `phone` (opcional)
- `status`
- `created_at`
- `updated_at`
- `last_login_at`

### `pets`
- `id`
- `user_id`
- `name`
- `breed`
- `birth_date`
- `weight`
- `sex`
- `photo_url`
- `notes`
- `created_at`
- `updated_at`

### `devices`
- `id`
- `serial_number`
- `firmware_version`
- `model`
- `status`
- `battery_level` (nullable)
- `activated_at`
- `last_seen_at`
- `created_at`
- `updated_at`

### `pet_devices`
Tabla pivote para histórico de asociación.
- `id`
- `pet_id`
- `device_id`
- `assigned_at`
- `unassigned_at` (nullable)
- `is_active`

### `activity_events`
Datos crudos o semi-crudos enviados por la app.
- `id`
- `pet_id`
- `device_id`
- `source`
- `activity_type` (`rest`, `walk`, `run`)
- `started_at`
- `ended_at`
- `duration_seconds`
- `confidence` (opcional)
- `recorded_at`
- `created_at`

### `activity_daily_summaries`
- `id`
- `pet_id`
- `date`
- `rest_seconds`
- `walk_seconds`
- `run_seconds`
- `total_active_seconds`
- `sync_status`
- `created_at`
- `updated_at`

### `sync_logs`
- `id`
- `user_id`
- `device_id`
- `source`
- `synced_at`
- `records_received`
- `status`
- `error_message` (nullable)

### `auth_sessions`
- `id`
- `user_id`
- `refresh_token_hash`
- `device_name`
- `ip_address`
- `user_agent`
- `expires_at`
- `revoked_at` (nullable)
- `created_at`

### `password_resets`
- `id`
- `user_id`
- `token_hash`
- `expires_at`
- `used_at`

---

## 7. Endpoints API sugeridos

## Autenticación

### `POST /v1/auth/register`
Crear usuario.

### `POST /v1/auth/login`
Devuelve access token + refresh token.

### `POST /v1/auth/refresh`
Renueva access token.

### `POST /v1/auth/logout`
Revoca sesión actual.

### `POST /v1/auth/forgot-password`
Solicita recuperación.

### `POST /v1/auth/reset-password`
Aplica nueva contraseña.

### `GET /v1/auth/me`
Obtiene perfil autenticado.

## Usuarios y mascotas

### `GET /v1/pets`
Lista mascotas del usuario.

### `POST /v1/pets`
Crea mascota.

### `GET /v1/pets/:petId`
Detalle de mascota.

### `PATCH /v1/pets/:petId`
Actualiza mascota.

### `GET /v1/pets/:petId/devices`
Lista dispositivos vinculados.

### `POST /v1/pets/:petId/devices/assign`
Asocia dispositivo.

## Dispositivos

### `GET /v1/devices/:deviceId`
Detalle del dispositivo.

### `POST /v1/devices/activate`
Activa dispositivo por serial/código.

### `GET /v1/devices/:deviceId/status`
Última sincronización, batería y estado.

## Actividad y métricas

### `POST /v1/activity/sync`
Endpoint principal para recibir lotes desde la app móvil.

Payload sugerido:

```json
{
  "petId": "uuid",
  "deviceId": "uuid",
  "timezone": "America/Mexico_City",
  "generatedAt": "2026-03-20T10:30:00Z",
  "events": [
    {
      "activityType": "walk",
      "startedAt": "2026-03-20T08:00:00Z",
      "endedAt": "2026-03-20T08:15:00Z",
      "durationSeconds": 900,
      "confidence": 0.94
    }
  ],
  "batteryLevel": 83
}
```

### `GET /v1/pets/:petId/activity/daily?date=YYYY-MM-DD`
Resumen diario.

### `GET /v1/pets/:petId/activity/weekly?startDate=YYYY-MM-DD`
Resumen semanal.

### `GET /v1/pets/:petId/activity/monthly?month=YYYY-MM`
Resumen mensual.

### `GET /v1/pets/:petId/activity/history`
Histórico paginado de eventos.

### `GET /v1/pets/:petId/activity/timeline?date=YYYY-MM-DD`
Timeline por bloques del día.

## Contacto / leads

### `POST /v1/leads`
Formulario comercial desde sitio público.

---

## 8. Recomendación de seguridad

### Autenticación y sesiones
- Access token corto: 15 a 30 minutos.
- Refresh token largo: 7 a 30 días.
- Guardar refresh tokens hasheados.
- Revocación por sesión/dispositivo.

### Protección API
- HTTPS obligatorio.
- Rate limiting en login, reset y sync.
- Validación estricta de payloads.
- Logs de auditoría para login y sincronización.
- Versionado de API (`/v1`).

### Seguridad de contraseñas
- Hash con Argon2 o bcrypt fuerte.
- Política de contraseña razonable.
- Emails de recuperación con expiración corta.

### Seguridad del lado app/dispositivo
- Preferir autenticación de usuario vía app.
- Si el dispositivo comunica directo en el futuro, usar credenciales por dispositivo.
- Firmar requests críticos o usar device secrets si evoluciona a IoT más complejo.

### Seguridad de plataforma
- CSP, headers de seguridad, protección CSRF si aplica cookies.
- Separar secretos por ambiente.
- Backups automáticos de PostgreSQL.
- Monitoreo de errores con Sentry o similar.

---

## 9. Roadmap por fases

## Fase 1: landing pública
Objetivo: validar propuesta y captar interés.

### Alcance
- Home premium responsiva.
- Secciones de producto, beneficios, cómo funciona y FAQ.
- CTA a compra/interés/login.
- Formulario de contacto.
- Analítica básica.

### Resultado
- Presencia comercial sólida.
- Base para campañas y ventas.

## Fase 2: login y plataforma privada
Objetivo: habilitar experiencia para clientes.

### Alcance
- Registro/login/recovery.
- Dashboard base.
- Gestión de perfil.
- Alta de mascotas.
- Asociación mascota-dispositivo.

### Resultado
- Portal usable por clientes reales.

## Fase 3: sincronización con app
Objetivo: conectar operación real del producto.

### Alcance
- API segura de sincronización.
- Persistencia de eventos.
- Estado de última sync.
- Estado de batería si existe.
- Logs y validaciones.

### Resultado
- Pipeline funcional de datos end-to-end.

## Fase 4: métricas y mejoras
Objetivo: mejorar valor percibido y escalabilidad.

### Alcance
- Gráficas diaria/semanal/mensual.
- Insights comparativos.
- Alertas o recomendaciones futuras.
- Optimización de performance.
- Panel administrativo interno opcional.

### Resultado
- Producto más maduro y preparado para crecer.

---

## 10. Mockup textual de pantallas principales

## Home pública

```txt
[HEADER]
Logo | Producto | Cómo funciona | Beneficios | FAQ | Iniciar sesión | CTA Comprar

[HERO]
Título: Entiende la actividad de tu perro, todos los días.
Texto: PawActivity te muestra cuándo descansa, camina y corre para ayudarte a cuidar su bienestar.
CTA primario: Comprar ahora
CTA secundario: Ver cómo funciona
Imagen: perro con collar + dispositivo + preview app

[SECCIÓN BENEFICIO RÁPIDO]
3 cards:
- Monitoreo simple
- Datos claros
- Bienestar diario

[SECCIÓN CÓMO FUNCIONA]
1. Collar con dispositivo
2. Sincronización con la app
3. Dashboard con métricas

[SECCIÓN VISUAL]
Mock gráfico circular + barras de Reposo / Caminar / Correr
Capturas de la app

[SECCIÓN CONFIANZA]
Tecnología simple, segura y pensada para dueños responsables

[FAQ]
Preguntas frecuentes

[CTA FINAL]
Empieza a conocer mejor a tu perro

[FOOTER]
Contacto | Privacidad | Términos | Soporte
```

## Login

```txt
Panel centrado
Logo PawActivity
Título: Bienvenido de nuevo
Campos: email, contraseña
Links: olvidé mi contraseña / crear cuenta
CTA: Iniciar sesión
Imagen lateral opcional con mascota/dispositivo
```

## Dashboard privado

```txt
[SIDEBAR]
Dashboard | Mascotas | Historial | Dispositivos | Cuenta

[TOPBAR]
Selector de mascota | Última sincronización | Estado batería | Usuario

[RESUMEN]
Card 1: Reposo hoy
Card 2: Caminar hoy
Card 3: Correr hoy
Card 4: Nivel de actividad

[GRÁFICOS]
- Donut de distribución diaria
- Barras comparativas últimos 7 días
- Línea mensual de actividad

[TIMELINE]
08:00 Caminar
10:15 Reposo
18:20 Correr

[ESTADO DEL DISPOSITIVO]
Conectado / última sync / batería
```

## Perfil de mascota

```txt
Foto | Nombre | Raza | Edad | Peso | Sexo
Dispositivo vinculado
Última sincronización
Resumen semanal
Botones: Editar perfil / Ver historial
```

---

## 11. Propuesta visual / UI

## Concepto de marca
La interfaz debe comunicar:
- tecnología,
- confianza,
- salud,
- movimiento,
- cercanía emocional con mascotas.

## Estilo visual recomendado
- **Minimalista premium**.
- Mucho espacio en blanco.
- Tarjetas suaves con esquinas medias.
- Sombras ligeras.
- Iconografía clara y amigable.
- Gráficas limpias y fáciles de leer.

## Paleta sugerida
- **Azul petróleo / deep teal** para confianza y tecnología.
- **Verde suave** para salud y bienestar.
- **Coral o naranja suave** para energía/actividad.
- **Neutros claros** para limpieza visual.

Ejemplo:
- Primary: `#0F766E`
- Secondary: `#0EA5A4`
- Accent: `#F97316`
- Success: `#22C55E`
- Background: `#F8FAFC`
- Text dark: `#0F172A`
- Text muted: `#475569`

## Tipografía
- Titulares: **Manrope**, **Inter** o **Plus Jakarta Sans**.
- Cuerpo: **Inter**.

## Estilo de componentes
- Botones sólidos para CTA primarios.
- Botones outline para acciones secundarias.
- Cards con visuales del producto y datos resumidos.
- Dashboard con bloques amplios, respirados y legibles.

## Dirección visual del marketing
- Fotos reales de perros con sus dueños.
- Dispositivo como pieza tecnológica protagonista.
- Mockups de app en móvil.
- Mensajes simples, comerciales y emocionales.

## Tono de copy para marketing
- Claro.
- Cercano.
- Profesional.
- Enfocado en tranquilidad y bienestar.

### Ejemplos de copy
- "Conoce la actividad diaria de tu perro en un vistazo."
- "Reposo, caminatas y carreras, todo en una experiencia simple."
- "Tecnología diseñada para cuidar su bienestar cada día."

## Dirección visual de plataforma privada
- Más funcional que emocional.
- Gráficas limpias.
- Jerarquía muy clara.
- Colores de estados consistentes:
  - Reposo → azul suave
  - Caminar → verde
  - Correr → naranja

---

## Recomendaciones finales claras

### ¿Debo usar WordPress solo para marketing?
**Sí, recomendado**, siempre que:
- el equipo necesite editar contenido sin depender de desarrollo,
- el sitio público sea principalmente comercial,
- la plataforma privada y la API queden separadas.

### ¿Debo crear un repositorio GitHub desde el inicio?
**Sí, absolutamente.**

Desde el día 1 conviene tener:
- control de versiones,
- issues,
- roadmap,
- CI/CD,
- control de ambientes,
- documentación viva.

### ¿Cómo separar correctamente frontend público, frontend privado, backend y base de datos?

#### Separación recomendada
- **Frontend público**: WordPress o Next.js marketing.
- **Frontend privado**: Next.js en subdominio `app.`
- **Backend/API**: NestJS en subdominio `api.`
- **Base de datos**: PostgreSQL privada, sin acceso público.

#### Arquitectura de dominios sugerida
- `pawactivity.com` → marketing.
- `app.pawactivity.com` → plataforma privada.
- `api.pawactivity.com` → API.

#### Regla clave
La app móvil y la web privada deben hablar con **la misma API central**. Así evitas duplicar lógica y mantienes una sola fuente de verdad para usuarios, mascotas, dispositivos y actividad.

---

## Recomendación ejecutiva final

Si buscas una solución **profesional, mantenible, escalable y razonable para MVP**, la mejor decisión es:

1. **WordPress solo para marketing**.
2. **Next.js para la plataforma privada**.
3. **NestJS + PostgreSQL + Prisma para backend y datos**.
4. **Monorepo en GitHub desde el inicio**.
5. **Separación por subdominios** para marketing, app y API.

Con eso tendrás una base sólida para lanzar rápido sin hipotecar el crecimiento futuro.

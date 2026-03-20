# PawActivity Android API Integration

Esta guía deja definido el contrato operativo para que la app Android se conecte a la API actual sin cambiar la arquitectura existente.

## Objetivo del flujo móvil

La app Android actúa como puente entre:

- usuario autenticado
- dispositivo BLE
- API de PawActivity

El dispositivo **no** sincroniza directo a la nube. Android autentica al usuario, identifica mascota/dispositivo y envía lotes de actividad a `POST /v1/activity/sync`.

## Base URL

Producción o staging deberán exponer la API bajo una base equivalente a:

```txt
https://api.pawactivity.com/v1
```

En local, por defecto:

```txt
http://localhost:4000/v1
```

## Autenticación móvil

### Endpoints

- `POST /v1/auth/login`
- `POST /v1/auth/refresh`
- `POST /v1/auth/logout`
- `GET /v1/auth/me`

### Headers recomendados para Android

- `Content-Type: application/json`
- `Authorization: Bearer <accessToken>` en endpoints protegidos
- `X-Device-Name: <modelo-del-teléfono-o-build>` recomendado en `login` y `refresh`

`X-Device-Name` no es obligatorio, pero ayuda a trazabilidad de sesiones.

### Login

#### Request

```http
POST /v1/auth/login
Content-Type: application/json
X-Device-Name: Pixel 8 Pro

{
  "email": "ana@pawactivity.com",
  "password": "password123"
}
```

#### Response 200

```json
{
  "tokenType": "Bearer",
  "accessToken": "<jwt-access>",
  "refreshToken": "<jwt-refresh>",
  "accessTokenExpiresInSeconds": 900,
  "refreshTokenExpiresInSeconds": 604800,
  "session": {
    "sessionId": "0d8e7d61-3a53-4d90-b3f8-9f74e9d32f42",
    "deviceName": "Pixel 8 Pro",
    "expiresAt": "2026-03-27T10:15:30.000Z"
  },
  "user": {
    "id": "0a1b2c3d-1111-2222-3333-444455556666",
    "email": "ana@pawactivity.com",
    "firstName": "Ana",
    "lastName": "Pérez",
    "timezone": "America/Mexico_City",
    "status": "active",
    "createdAt": "2026-03-20T10:15:30.000Z"
  }
}
```

### Refresh

El backend usa **refresh token rotation**:

- cada `POST /auth/refresh` invalida la sesión anterior
- la respuesta entrega un **nuevo** `accessToken`
- la respuesta entrega un **nuevo** `refreshToken`
- Android debe reemplazar ambos inmediatamente

#### Request

```http
POST /v1/auth/refresh
Content-Type: application/json
X-Device-Name: Pixel 8 Pro

{
  "refreshToken": "<jwt-refresh-actual>"
}
```

#### Response 200

La respuesta tiene el mismo shape que `login`.

### Logout

#### Request

```http
POST /v1/auth/logout
Content-Type: application/json

{
  "refreshToken": "<jwt-refresh-actual>"
}
```

#### Response 200

```json
{
  "success": true
}
```

Después de logout, Android debe borrar:

- access token
- refresh token
- mascota activa local
- device/pet seleccionados en caché si dependían de la sesión

### Obtener usuario actual

#### Request

```http
GET /v1/auth/me
Authorization: Bearer <jwt-access>
```

#### Response 200

```json
{
  "id": "0a1b2c3d-1111-2222-3333-444455556666",
  "email": "ana@pawactivity.com",
  "firstName": "Ana",
  "lastName": "Pérez",
  "timezone": "America/Mexico_City",
  "status": "active",
  "createdAt": "2026-03-20T10:15:30.000Z"
}
```

## Estrategia recomendada de tokens en Android

### Recomendación práctica

1. Guardar `accessToken`, `refreshToken`, `session.sessionId` y expiraciones en almacenamiento seguro.
2. Usar `accessToken` para todos los endpoints protegidos.
3. Refrescar la sesión:
   - preventivamente 1-2 minutos antes del vencimiento del access token, o
   - reactivo ante `401`/`403`
4. Si `refresh` responde `401`, considerar la sesión terminada y volver a login.

### Regla operativa

- **Nunca** seguir usando un refresh token anterior después de un `refresh` exitoso.
- Si un refresh exitoso devuelve nuevos tokens, persistirlos antes de continuar requests en cola.
- Si varias requests fallan a la vez por expiración, serializar un único refresh en cliente.

## Endpoints móviles revisados

### Identidad y contexto

- `GET /v1/auth/me`
- `GET /v1/pets`
- `GET /v1/pets/:petId`

`GET /v1/pets` ya devuelve `activeDevice` por mascota, lo cual evita agregar un endpoint extra para “mascota activa” en esta fase.

### Dispositivos

- `GET /v1/devices`
- `GET /v1/devices/:deviceId`
- `GET /v1/devices/:deviceId/status`
- `POST /v1/devices/activate`
- `POST /v1/pets/:petId/devices/assign`

### Actividad

- `POST /v1/activity/sync`

## Respuestas y errores

La API normaliza errores HTTP con este shape:

```json
{
  "statusCode": 401,
  "message": "Invalid refresh token"
}
```

Android debe usar `statusCode` + `message` para mapear UX y logging.

## Reglas de ownership

- Un usuario solo puede leer sus propias mascotas.
- Un usuario solo puede activar dispositivos no pertenecientes a otro usuario.
- Un usuario solo puede consultar o asignar dispositivos de su cuenta.
- `POST /v1/activity/sync` exige:
  - que `petId` pertenezca al usuario autenticado
  - que `deviceId` pertenezca al usuario autenticado
  - que el dispositivo esté **activamente asignado** a esa mascota

## Flujo recomendado Android

1. `POST /auth/login`
2. `GET /auth/me`
3. `GET /pets`
4. elegir mascota activa local
5. usar `pet.activeDevice` si existe; si no, activar/asignar dispositivo
6. enviar lotes a `POST /activity/sync`
7. refrescar tokens cuando corresponda

## Códigos de error esperables

- `400`: payload inválido, timezone inválida, duración inconsistente, etc.
- `401`: access token inválido o refresh token inválido/expirado
- `403`: recurso ajeno o dispositivo no asignado activamente a la mascota
- `404`: mascota o dispositivo inexistente

## Qué queda fuera de esta fase

- staging real
- credenciales reales de producción
- rate limiting/observabilidad móvil avanzada
- colas offline complejas en backend

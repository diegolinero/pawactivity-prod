# PawActivity Mobile Sync Contract

Este documento consolida el contrato final de `POST /v1/activity/sync` para Android.

## Endpoint

```http
POST /v1/activity/sync
Authorization: Bearer <accessToken>
Content-Type: application/json
```

## Payload requerido

```json
{
  "petId": "7d06d8e0-7f4f-4a1e-8f17-75ac1933ff01",
  "deviceId": "9cc9c3f4-b4f1-46f5-a5d5-2f4bc6718f8f",
  "generatedAt": "2026-03-20T14:35:00Z",
  "timezone": "America/Mexico_City",
  "batteryLevel": 82,
  "events": [
    {
      "activityType": "walk",
      "startedAt": "2026-03-20T14:00:00Z",
      "endedAt": "2026-03-20T14:10:00Z",
      "durationSeconds": 600,
      "confidence": 0.94
    },
    {
      "activityType": "rest",
      "startedAt": "2026-03-20T14:10:00Z",
      "endedAt": "2026-03-20T14:25:00Z",
      "durationSeconds": 900
    }
  ]
}
```

## Campos

### Nivel lote

- `petId`: UUID de la mascota destino
- `deviceId`: UUID del dispositivo que generó los eventos
- `generatedAt`: timestamp ISO8601 UTC del momento en que Android consolidó/envió el lote
- `timezone`: timezone IANA usada para agrupar resúmenes diarios, por ejemplo `UTC`, `America/Mexico_City`, `America/Bogota`
- `batteryLevel`: entero opcional entre `0` y `100`
- `events`: arreglo no vacío

### Nivel evento

- `activityType`: `rest` | `walk` | `run`
- `startedAt`: timestamp ISO8601
- `endedAt`: timestamp ISO8601
- `durationSeconds`: entero > 0
- `confidence`: opcional, rango `0..1`

## Validaciones ejecutadas por backend

### Del lote

- `petId` debe ser UUID válido
- `deviceId` debe ser UUID válido
- `generatedAt` debe ser fecha válida
- `timezone` debe ser una timezone IANA válida para `Intl.DateTimeFormat`
- `batteryLevel`, si existe, debe estar entre `0` y `100`
- `events` debe tener al menos 1 elemento

### De ownership y asignación

- la mascota debe pertenecer al usuario autenticado
- el dispositivo debe pertenecer al usuario autenticado
- el dispositivo debe estar **activamente asignado** a esa mascota

Si el dispositivo está activado pero no asignado a la mascota indicada, el backend rechaza la sync.

### De cada evento

- `startedAt` y `endedAt` deben ser fechas válidas
- `endedAt` debe ser mayor a `startedAt`
- `durationSeconds` debe coincidir con la diferencia real entre timestamps con una tolerancia máxima de 5 segundos
- `confidence`, si existe, debe estar entre `0` y `1`

## Respuesta exitosa

```json
{
  "success": true,
  "syncLogId": "8b28f1b7-6732-4d9f-b2a2-1f138f1aaabc",
  "recordsReceived": 2,
  "storedEvents": 2,
  "skippedDuplicates": 0,
  "syncedAt": "2026-03-20T14:35:01.123Z",
  "updatedDates": [
    "2026-03-20"
  ]
}
```

## Significado de la respuesta

- `recordsReceived`: eventos recibidos en el request
- `storedEvents`: eventos nuevos realmente persistidos
- `skippedDuplicates`: eventos ignorados por duplicado exacto
- `updatedDates`: fechas locales afectadas por la sync, calculadas usando `timezone`

## Duplicados

Un evento se considera duplicado exacto si coincide en:

- `petId`
- `deviceId`
- `activityType`
- `startedAt`
- `endedAt`

### Comportamiento

- el backend **no falla** por duplicados exactos
- los eventos duplicados se omiten
- la respuesta informa cuántos fueron omitidos en `skippedDuplicates`
- los resúmenes diarios se recalculan desde los eventos persistidos

### Implicación para Android

Android puede reintentar el mismo lote si no sabe si la request llegó, siempre que preserve exactamente los timestamps y tipos originales.

## Errores esperables

### 400 Bad Request

Ejemplos:

```json
{
  "statusCode": 400,
  "message": "Invalid generatedAt"
}
```

```json
{
  "statusCode": 400,
  "message": "Invalid timezone"
}
```

```json
{
  "statusCode": 400,
  "message": "Event duration does not match timestamps"
}
```

```json
{
  "statusCode": 400,
  "message": "Event confidence must be between 0 and 1"
}
```

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

Acción cliente:

- intentar refresh si el access token expiró
- reenviar sync una sola vez tras refresh exitoso

### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "Device is not actively assigned to this pet"
}
```

o errores de ownership como acceso a mascota/dispositivo ajenos.

Acción cliente:

- no reintentar automáticamente en loop
- refrescar contexto (`GET /pets`, `GET /devices`) y pedir intervención del usuario si aplica

### 404 Not Found

Ejemplos:

- `Pet not found`
- `Device not found`

Acción cliente:

- invalidar selección local de mascota/dispositivo
- volver a sincronizar contexto antes de ofrecer nueva sync

## Retry policy recomendada

### Reintentar automáticamente

- errores de red
- timeouts
- `5xx`
- `401` solo después de un refresh exitoso

### No reintentar automáticamente sin revisar contexto

- `400`
- `403`
- `404`

## Recomendación operativa de batching

- enviar lotes pequeños/medianos y ordenados cronológicamente
- preservar timestamps originales del dispositivo/BLE
- mantener idempotencia reutilizando el mismo lote si se reintenta
- no modificar `generatedAt` si el reintento corresponde al mismo lote lógico ya armado

## Consideraciones de timezone

- `startedAt` y `endedAt` deben enviarse en ISO8601
- `timezone` define cómo se agrupan los resúmenes por día
- si el usuario cambia de timezone, Android debe enviar la timezone vigente al momento de construir el lote

## Resultado esperado en web

Después de una sync exitosa:

- dashboard consume resumen diario/semanal
- historial consume resúmenes diarios
- timeline consume eventos filtrados por fecha y timezone

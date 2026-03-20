# PawActivity Pilot Runbook

## Objetivo del piloto

Validar el flujo real:

```txt
dispositivo -> app Android -> API -> DB -> dashboard web
```

con usuarios reales pero en grupo controlado.

## 1. Logging y observabilidad

### Backend

Ya deben revisarse estos eventos en logs:

- `auth_register_success`
- `auth_login_success`
- `auth_login_failed`
- `auth_refresh_success`
- `auth_refresh_failed`
- `auth_logout`
- `activity_sync_received`
- `activity_sync_success`
- `activity_sync_duplicates_detected`
- `activity_sync_rejected`
- `http_exception`

### Endpoint operativo útil

- `GET /v1/health`
- `GET /v1/health/metrics`

## 2. Métricas básicas definidas

Durante el piloto, seguir como mínimo:

- usuarios con sync real (`activeSyncUsers`)
- sync attempts
- sync success rate
- promedio de respuesta API
- `auth_login_success_total`
- `auth_login_failed_total`
- `auth_refresh_success_total`
- `activity_sync_received_total`
- `activity_sync_success_total`
- `activity_sync_error_total`
- `activity_events_received_total`
- `activity_duplicates_skipped_total`

Estas métricas se exponen en `GET /v1/health/metrics`.

## 3. Problemas reales o potenciales a vigilar

### Sync

- duplicación por reintentos móviles
- lotes enviados fuera de orden
- timezone distinta entre app y usuario
- diferencia entre timeline y resumen diario
- eventos con duración inconsistente

### Dispositivo / BLE

- reconexión BLE con lotes repetidos
- batería baja y sync incompleta
- cambio de dispositivo activo sin reasignación clara

### Sesión

- refresh expirado en mitad de sync
- múltiples refresh seguidos desde Android
- sesiones viejas en varios dispositivos

### UX

- usuario no entiende si el dato es “de hoy” o “de la última sync”
- confusión entre reposo, caminar y correr
- falta de contexto cuando todavía no hay suficiente actividad

## 4. Ajustes aplicados en esta fase

- rate limiting básico ya activo para `register`, `login`, `refresh` y `sync`
- logging estructurado ampliado en auth, sync y errores HTTP
- métricas básicas acumuladas en memoria para observación rápida del piloto
- endpoint `GET /v1/health/metrics`
- release controlado por allowlist

## 5. Perfil de testers recomendado

Primer grupo:

- 2-3 usuarios internos
- 3-5 testers cercanos / early adopters
- idealmente al menos:
  - 1 usuario con uso muy frecuente
  - 1 usuario con sync irregular
  - 1 usuario que cambie entre mascotas/dispositivos

## 6. Cómo recolectar feedback

Canal mínimo recomendado:

- grupo privado de WhatsApp/Slack
- formulario corto de incidencias
- captura obligatoria de:
  - hora aproximada
  - email del usuario
  - mascota afectada
  - acción realizada
  - screenshot si aplica

## 7. Checklist del piloto

- [ ] login real desde Android
- [ ] refresh real desde Android
- [ ] logout real
- [ ] sync real con datos del dispositivo
- [ ] duplicados controlados
- [ ] dashboard web refleja actividad
- [ ] history consistente con dashboard
- [ ] timezone correcta
- [ ] cambio de mascota correcto
- [ ] asignación de dispositivo correcta
- [ ] errores visibles y controlados
- [ ] reconexión BLE no rompe el sistema
- [ ] múltiples sync seguidos no generan inconsistencias graves

## 8. Recomendaciones para escalar después del piloto

- persistir métricas fuera de memoria
- conectar captura externa de errores (Sentry)
- agregar alertas sobre caída de success rate en sync
- mover rate limiting a almacenamiento compartido si hay múltiples instancias
- ampliar validación operativa de timezone y drift de reloj del dispositivo

## 9. Qué cambiar antes de abrir a más público

- monitoreo externo y alertas reales
- dashboards operativos básicos
- revisión de copy/UX con feedback real
- más cobertura de tests sobre edge cases de sync
- estrategia de soporte inicial más formal

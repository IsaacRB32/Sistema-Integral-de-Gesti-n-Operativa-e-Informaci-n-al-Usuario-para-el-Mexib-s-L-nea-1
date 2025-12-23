# Servidor Unificado (MAIN + BRA)

Este servidor consolida las capacidades de:
- **Botonera (Android)**
- **Usuario (Android)**
- **Supervisor (Web)**

## Ejecutar

```bash
cd servidor_unificado
npm install
npm start
```

Variables de entorno (`.env`):
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `PORT` (opcional, default 3000)

## Compatibilidad de endpoints

### Botonera / Usuario (no romper)
- `POST /api/login`
- `POST /api/sim/incidencia`
- `GET /api/sim/incidencias/activas`

### Supervisor (BRA)
Prefijo: `.../api/supervisor/*`
- `GET /api/supervisor/incidencias`
- `PUT /api/supervisor/incidencias/:id` (acepta `observacion` **o** `observaciones`)
- `GET /api/supervisor/unidades`
- `GET/POST/PUT/DELETE /api/supervisor/unidades/catalogo`
- `GET /api/supervisor/conductores`
- `POST /api/supervisor/asignar-conductor`
- `POST /api/supervisor/desasignar-conductor`
- `GET/POST/PUT/DELETE /api/supervisor/operadores`

### Simulación / Socket.IO
- `POST /api/sim/entrar`
- `POST /api/sim/salir`
- `GET  /api/sim/snapshot`
- `POST /api/sim/resolver`

Eventos Socket.IO:
- `actualizar_posiciones`

## Notas de unificación
- Se ejecutan **migraciones idempotentes** al arranque (`db/migrations.js`) para normalizar columnas `activo` y el índice único `uq_usuarios_email`.
- Se mantiene el comportamiento del login de MAIN (incluye `rol` y `unidad_asignada`).

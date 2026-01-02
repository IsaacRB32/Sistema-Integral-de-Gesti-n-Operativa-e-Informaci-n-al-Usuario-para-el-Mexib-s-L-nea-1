-- ===========================================================
--  MEXIBÚS LÍNEA 1 - ESQUEMA COMPLETO (Simulación Circular)
--  Esquema.sql
-- ===========================================================

-- =========================
-- 0) TIPOS / ENUMS
-- =========================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sentido_dir') THEN
    CREATE TYPE sentido_dir AS ENUM ('IDA','REGRESO');
  END IF;
END$$;

-- =========================
-- 1) TABLAS BÁSICAS
-- =========================
CREATE TABLE IF NOT EXISTS Roles (
  id_rol SERIAL PRIMARY KEY,
  rol VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS Usuarios (
  id_usuario SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  primer_apellido VARCHAR(100) NOT NULL,
  segundo_apellido VARCHAR(100),
  contacto VARCHAR(50),
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL DEFAULT '1234',
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  id_rol INT NOT NULL REFERENCES Roles(id_rol)
);

CREATE TABLE IF NOT EXISTS Estaciones (
  id_estacion SERIAL PRIMARY KEY,
  nombre_estacion VARCHAR(100) NOT NULL UNIQUE,
  pos_x INT NOT NULL,
  pos_y INT NOT NULL
);

CREATE TABLE IF NOT EXISTS CatalogoIncidencias (
  id_cincidencia SERIAL PRIMARY KEY,
  nombre_incidencia VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS EstadosIncidencias (
  id_estado SERIAL PRIMARY KEY,
  estado_incidencia VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS Rutas (
  id_ruta SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  es_circular BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS RutaEstaciones (
  id_ruta INT NOT NULL REFERENCES Rutas(id_ruta) ON DELETE CASCADE,
  id_estacion INT NOT NULL REFERENCES Estaciones(id_estacion) ON DELETE CASCADE,
  orden INT NOT NULL,                         -- 0..N-1 (IMPORTANTÍSIMO para la simulación)
  sentido sentido_dir NOT NULL,
  dwell_min_s INT NOT NULL DEFAULT 10,
  dwell_max_s INT NOT NULL DEFAULT 25,
  PRIMARY KEY (id_ruta, orden, sentido)
);

CREATE INDEX IF NOT EXISTS ix_rutaestaciones_ruta_sen_orden
  ON RutaEstaciones(id_ruta, sentido, orden);

-- =========================
-- 2) UNIDADES MEXIBÚS
-- =========================
CREATE TABLE IF NOT EXISTS UnidadesMB (
  id_unidad SERIAL PRIMARY KEY,
  numero_unidad INT UNIQUE, -- opcional: número visible (si usas el mismo que id_unidad, se llena en semilla)
  marca VARCHAR(60),
  modelo VARCHAR(60),

  id_ruta INT REFERENCES Rutas(id_ruta),

  sentido sentido_dir DEFAULT 'IDA',
  en_circuito BOOLEAN NOT NULL DEFAULT FALSE,
  idx_tramo INT NOT NULL DEFAULT 0,
  progreso NUMERIC(6,4) NOT NULL DEFAULT 0,
  velocidad NUMERIC(6,2) NOT NULL DEFAULT 1.50,

  estado_unidad VARCHAR(30) NOT NULL
    CHECK (estado_unidad IN ('EN_RUTA','EN_ESTACION','EN_COLA','INCIDENCIA','FUERA_DE_SERVICIO'))
    DEFAULT 'FUERA_DE_SERVICIO',

  dwell_hasta TIMESTAMP NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS ix_unidades_en_circuito ON UnidadesMB(en_circuito);
CREATE INDEX IF NOT EXISTS ix_unidades_ruta_tramo ON UnidadesMB(id_ruta, idx_tramo);

-- =========================
-- 3) INCIDENCIAS Y EVENTOS
-- =========================
CREATE TABLE IF NOT EXISTS Incidencias (
  id_incidencia SERIAL PRIMARY KEY,
  fecha_inicio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_fin TIMESTAMP,
  descripcion TEXT,

  id_estado INT REFERENCES EstadosIncidencias(id_estado),
  id_estacion INT REFERENCES Estaciones(id_estacion),
  id_cincidencia INT REFERENCES CatalogoIncidencias(id_cincidencia),

  id_usuario_reporta INT REFERENCES Usuarios(id_usuario),
  id_usuario_atiende INT REFERENCES Usuarios(id_usuario),
  id_unidad INT REFERENCES UnidadesMB(id_unidad)
);

CREATE INDEX IF NOT EXISTS ix_incidencias_unidad ON Incidencias(id_unidad);

CREATE TABLE IF NOT EXISTS EventosUnidad (
  id_evento SERIAL PRIMARY KEY,
  ts TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  id_unidad INT NOT NULL REFERENCES UnidadesMB(id_unidad),
  tipo VARCHAR(40) NOT NULL,
  detalle JSONB
);

CREATE INDEX IF NOT EXISTS ix_eventos_unidad_ts ON EventosUnidad(id_unidad, ts DESC);

-- =========================
-- 4) ASIGNACIONES (Operador <-> Unidad)
-- =========================
CREATE TABLE IF NOT EXISTS AsignacionesUnidad (
  id_asignacion SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL REFERENCES Usuarios(id_usuario),
  id_unidad INT NOT NULL REFERENCES UnidadesMB(id_unidad),
  fecha_inicio TIMESTAMP NOT NULL DEFAULT NOW(),
  fecha_fin TIMESTAMP NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE
);

-- Un operador solo puede tener 1 asignación activa
CREATE UNIQUE INDEX IF NOT EXISTS uq_asig_usuario_activa
  ON AsignacionesUnidad(id_usuario)
  WHERE activo = TRUE;

-- Una unidad solo puede tener 1 asignación activa
CREATE UNIQUE INDEX IF NOT EXISTS uq_asig_unidad_activa
  ON AsignacionesUnidad(id_unidad)
  WHERE activo = TRUE;

-- Trigger: impedir baja lógica de operador si tiene asignación activa
DROP TRIGGER IF EXISTS trg_baja_operador_ocupado ON Usuarios;
DROP FUNCTION IF EXISTS bloquear_baja_operador_ocupado();

CREATE OR REPLACE FUNCTION bloquear_baja_operador_ocupado()
RETURNS trigger AS $$
BEGIN
  IF NEW.activo = FALSE AND OLD.activo = TRUE THEN
    IF EXISTS (
      SELECT 1
      FROM AsignacionesUnidad
      WHERE id_usuario = OLD.id_usuario
        AND activo = TRUE
    ) THEN
      RAISE EXCEPTION 'No se puede dar de baja: operador % tiene asignación activa', OLD.id_usuario;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_baja_operador_ocupado
BEFORE UPDATE OF activo ON Usuarios
FOR EACH ROW
EXECUTE FUNCTION bloquear_baja_operador_ocupado();

-- =========================
-- 5) SEMILLA / CATALOGOS
-- =========================
INSERT INTO Roles(rol) VALUES ('OPERADOR'),('SUPERVISOR')
ON CONFLICT (rol) DO NOTHING;

-- Estados (IDs fijos)
INSERT INTO EstadosIncidencias(id_estado, estado_incidencia)
VALUES (1,'ACTIVA'), (2,'RESUELTA')
ON CONFLICT (id_estado) DO UPDATE
SET estado_incidencia = EXCLUDED.estado_incidencia;

-- Catálogo Incidencias (IDs FIJOS 1..8) alineados con la botonera
-- 1 Bloqueo por manifestación
-- 2 Inundación
-- 3 Colisión de unidad
-- 4 Colisión de terceros
-- 5 Fallas técnicas de la unidad
-- 6 Unidad detenida en el carril
-- 7 Incidente en la estación
-- 8 Otro
INSERT INTO CatalogoIncidencias(id_cincidencia, nombre_incidencia)
VALUES
  (1,'Bloqueo por manifestación'),
  (2,'Inundación'),
  (3,'Colisión de unidad'),
  (4,'Colisión de terceros'),
  (5,'Fallas técnicas de la unidad'),
  (6,'Unidad detenida en el carril'),
  (7,'Incidente en la estación'),
  (8,'Otro')
ON CONFLICT (id_cincidencia) DO UPDATE
SET nombre_incidencia = EXCLUDED.nombre_incidencia;

-- Ajuste de secuencia del catálogo (por IDs insertados manualmente)
SELECT setval(
  pg_get_serial_sequence('CatalogoIncidencias','id_cincidencia'),
  (SELECT COALESCE(MAX(id_cincidencia),1) FROM CatalogoIncidencias)
);

-- Ruta principal (ID fijo)
INSERT INTO Rutas(id_ruta, nombre, es_circular)
VALUES (1, 'L1 Central de Abastos ↔ Ciudad Azteca', TRUE)
ON CONFLICT (id_ruta) DO UPDATE
SET nombre = EXCLUDED.nombre, es_circular = EXCLUDED.es_circular;

-- =========================
-- 6) ESTACIONES + RUTAESTACIONES (IDA + REGRESO)
-- =========================
WITH listado(nombre, pos_x, pos_y, ord) AS (
  VALUES
  ('Central de Abastos',  0,100,  1),
  ('19 de Septiembre',    6, 95,  2),
  ('Palomas',            12, 90,  3),
  ('Jardines de Morelos',20, 82,  4),
  ('Aquiles Serdán',     26, 76,  5),
  ('Hospital',           32, 70,  6),
  ('1° de Mayo',         30, 64,  7),
  ('Las Américas',       27, 58,  8),
  ('Valle Ecatepec',     24, 52,  9),
  ('Vocacional 3',       22, 46, 10),
  ('Adolfo López Mateos',20, 41, 11),
  ('Zodiaco',            18, 36, 12),
  ('Alfredo Torres',     16, 31, 13),
  ('UNITEC',             15, 27, 14),
  ('Industrial',         15, 23, 15),
  ('Josefa Ortiz',       15, 19, 16),
  ('Quinto Sol',         15, 15, 17),
  ('Ciudad Azteca',      15, 10, 18)
),
upsert_est AS (
  INSERT INTO Estaciones(nombre_estacion, pos_x, pos_y)
  SELECT nombre, pos_x, pos_y FROM listado
  ON CONFLICT (nombre_estacion)
  DO UPDATE SET pos_x = EXCLUDED.pos_x, pos_y = EXCLUDED.pos_y
  RETURNING id_estacion, nombre_estacion
),
mapeo AS (
  SELECT e.id_estacion, l.ord
  FROM upsert_est e
  JOIN listado l ON l.nombre = e.nombre_estacion
)
-- IDA (Central -> Azteca) orden 0..17
INSERT INTO RutaEstaciones(id_ruta, id_estacion, orden, sentido, dwell_min_s, dwell_max_s)
SELECT 1, id_estacion, ord - 1, 'IDA'::sentido_dir, 12, 22
FROM mapeo
ON CONFLICT (id_ruta, orden, sentido) DO UPDATE
SET id_estacion = EXCLUDED.id_estacion,
    dwell_min_s = EXCLUDED.dwell_min_s,
    dwell_max_s = EXCLUDED.dwell_max_s;

-- REGRESO (Azteca -> Central) orden 0..17
WITH listado2(nombre, ord) AS (
  VALUES
  ('Central de Abastos',  1),
  ('19 de Septiembre',    2),
  ('Palomas',             3),
  ('Jardines de Morelos', 4),
  ('Aquiles Serdán',      5),
  ('Hospital',            6),
  ('1° de Mayo',          7),
  ('Las Américas',        8),
  ('Valle Ecatepec',      9),
  ('Vocacional 3',       10),
  ('Adolfo López Mateos',11),
  ('Zodiaco',            12),
  ('Alfredo Torres',     13),
  ('UNITEC',             14),
  ('Industrial',         15),
  ('Josefa Ortiz',       16),
  ('Quinto Sol',         17),
  ('Ciudad Azteca',      18)
),
mapeo2 AS (
  SELECT e.id_estacion, l.ord
  FROM Estaciones e
  JOIN listado2 l ON e.nombre_estacion = l.nombre
),
reg AS (
  SELECT id_estacion,
         ROW_NUMBER() OVER (ORDER BY ord DESC) - 1 AS orden
  FROM mapeo2
)
INSERT INTO RutaEstaciones(id_ruta, id_estacion, orden, sentido, dwell_min_s, dwell_max_s)
SELECT 1, id_estacion, orden, 'REGRESO'::sentido_dir, 12, 22
FROM reg
ON CONFLICT (id_ruta, orden, sentido) DO UPDATE
SET id_estacion = EXCLUDED.id_estacion,
    dwell_min_s = EXCLUDED.dwell_min_s,
    dwell_max_s = EXCLUDED.dwell_max_s;

-- =========================
-- 7) UNIDADES DE PRUEBA
-- =========================
INSERT INTO UnidadesMB(id_unidad, numero_unidad, id_ruta, sentido, estado_unidad, en_circuito, velocidad, activo)
VALUES
  (1, 1, 1, 'IDA', 'FUERA_DE_SERVICIO', FALSE, 1.50, TRUE),
  (2, 2, 1, 'IDA', 'FUERA_DE_SERVICIO', FALSE, 1.50, TRUE),
  (3, 3, 1, 'IDA', 'FUERA_DE_SERVICIO', FALSE, 1.50, TRUE)
ON CONFLICT (id_unidad) DO UPDATE
SET numero_unidad = EXCLUDED.numero_unidad,
    id_ruta = EXCLUDED.id_ruta,
    sentido = EXCLUDED.sentido,
    estado_unidad = EXCLUDED.estado_unidad,
    en_circuito = EXCLUDED.en_circuito,
    velocidad = EXCLUDED.velocidad,
    activo = EXCLUDED.activo;

SELECT setval(
  pg_get_serial_sequence('UnidadesMB','id_unidad'),
  (SELECT COALESCE(MAX(id_unidad),1) FROM UnidadesMB)
);

-- Usuario supervisor admin
INSERT INTO Usuarios (nombre, primer_apellido, email, password, id_rol, activo)
VALUES ('Admin', 'Supervisor', 'admin@mexibus.com', '1234',
        (SELECT id_rol FROM Roles WHERE rol='SUPERVISOR' LIMIT 1),
        TRUE)
ON CONFLICT (email) DO NOTHING;

-- Operador de prueba
INSERT INTO Usuarios (nombre, primer_apellido, email, password, id_rol, activo)
VALUES ('Juan', 'Pérez', 'juan.operador@mexibus.com', '1234',
        (SELECT id_rol FROM Roles WHERE rol='OPERADOR' LIMIT 1),
        TRUE)
ON CONFLICT (email) DO NOTHING;

-- ===========================================================
-- FIN
-- ===========================================================

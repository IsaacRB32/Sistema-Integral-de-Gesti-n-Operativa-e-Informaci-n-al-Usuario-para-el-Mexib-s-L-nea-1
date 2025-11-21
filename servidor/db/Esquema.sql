-- ===========================================================
--  MEXIBÚS LÍNEA 1 - ESQUEMA COMPLETO (versión simulación circular)
-- ===========================================================

-- =========================
-- 1) TIPOS / ENUMS
-- =========================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sentido_dir') THEN
    CREATE TYPE sentido_dir AS ENUM ('IDA','REGRESO');
  END IF;
END$$;

-- =========================
-- 2) TABLAS BÁSICAS
-- =========================

CREATE TABLE IF NOT EXISTS Roles (
  id_rol SERIAL PRIMARY KEY,
  rol VARCHAR(50) NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_roles_rol ON Roles(rol);

CREATE TABLE IF NOT EXISTS Usuarios (
  id_usuario SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  primer_apellido VARCHAR(100) NOT NULL,
  segundo_apellido VARCHAR(100),
  contacto VARCHAR(50),
  email VARCHAR(100),
  id_rol INT NOT NULL REFERENCES Roles(id_rol)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_usuarios_email ON Usuarios(email);

CREATE TABLE IF NOT EXISTS Estaciones (
  id_estacion SERIAL PRIMARY KEY,
  nombre_estacion VARCHAR(100) NOT NULL,
  pos_x INT NOT NULL,
  pos_y INT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_estaciones_nombre ON Estaciones(nombre_estacion);

CREATE TABLE IF NOT EXISTS CatalogoIncidencias (
  id_cincidencia SERIAL PRIMARY KEY,
  nombre_incidencia VARCHAR(100) NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_catalogo_incidencia_nombre
  ON CatalogoIncidencias(nombre_incidencia);

CREATE TABLE IF NOT EXISTS EstadosIncidencias (
  id_estado SERIAL PRIMARY KEY,
  estado_incidencia VARCHAR(50) NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_estadosincidencias_nombre
  ON EstadosIncidencias(estado_incidencia);

CREATE TABLE IF NOT EXISTS Rutas (
  id_ruta SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  es_circular BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_rutas_nombre ON Rutas(nombre);

CREATE TABLE IF NOT EXISTS RutaEstaciones (
  id_ruta INT NOT NULL REFERENCES Rutas(id_ruta) ON DELETE CASCADE,
  id_estacion INT NOT NULL REFERENCES Estaciones(id_estacion) ON DELETE CASCADE,
  orden INT NOT NULL,
  sentido sentido_dir NOT NULL,
  dwell_min_s INT NOT NULL DEFAULT 10,
  dwell_max_s INT NOT NULL DEFAULT 25,
  PRIMARY KEY (id_ruta, orden, sentido)
);
CREATE INDEX IF NOT EXISTS ix_rutaestaciones_ruta_sen_orden
  ON RutaEstaciones(id_ruta, sentido, orden);

-- =========================
-- 3) UNIDADES MEXIBÚS
-- =========================
CREATE TABLE IF NOT EXISTS UnidadesMB (
  id_unidad SERIAL PRIMARY KEY,
  id_ruta INT REFERENCES Rutas(id_ruta),

  sentido sentido_dir DEFAULT 'IDA',
  en_circuito BOOLEAN NOT NULL DEFAULT FALSE,
  idx_tramo INT DEFAULT 0,
  progreso NUMERIC(6,4) DEFAULT 0,
  velocidad NUMERIC(6,2) DEFAULT 1.50,

  estado_unidad VARCHAR(30)
    CHECK (estado_unidad IN ('EN_RUTA','EN_ESTACION','EN_COLA','INCIDENCIA','FUERA_DE_SERVICIO'))
    DEFAULT 'FUERA_DE_SERVICIO',

  dwell_hasta TIMESTAMP NULL
);
CREATE INDEX IF NOT EXISTS ix_unidades_en_circuito ON UnidadesMB(en_circuito);
CREATE INDEX IF NOT EXISTS ix_unidades_ruta_tramo ON UnidadesMB(id_ruta, idx_tramo);


-- =========================
-- 4) INCIDENCIAS Y EVENTOS
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

ALTER TABLE Usuarios
ADD COLUMN password VARCHAR(100);

ALTER TABLE Usuarios
ALTER COLUMN email SET NOT NULL;

-- ============================================
--  ASIGNACIONES ENTRE OPERADORES Y UNIDADES
-- ============================================

CREATE TABLE IF NOT EXISTS AsignacionesUnidad (
  id_asignacion SERIAL PRIMARY KEY,

  id_usuario INT NOT NULL REFERENCES Usuarios(id_usuario),
  id_unidad INT NOT NULL REFERENCES UnidadesMB(id_unidad),

  fecha_asignacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_fin TIMESTAMP NULL,

  activo BOOLEAN NOT NULL DEFAULT TRUE,

  -- Un operador solo puede tener UNA unidad asignada activa
  CONSTRAINT uq_asign_usuario UNIQUE (id_usuario, activo)
    DEFERRABLE INITIALLY DEFERRED,

  -- Una unidad solo puede estar asignada a UN operador activo
  CONSTRAINT uq_asign_unidad UNIQUE (id_unidad, activo)
    DEFERRABLE INITIALLY DEFERRED
);

ALTER TABLE Usuarios
ADD CONSTRAINT uq_usuarios_email UNIQUE (email);

-- =========================
-- 5) SEMILLA / CATALOGOS
-- =========================
INSERT INTO Roles(rol) VALUES ('OPERADOR'),('SUPERVISOR')
ON CONFLICT (rol) DO NOTHING;

INSERT INTO EstadosIncidencias(id_estado, estado_incidencia)
VALUES (1,'ACTIVA'), (2,'RESUELTA')
ON CONFLICT (id_estado) DO UPDATE
SET estado_incidencia = EXCLUDED.estado_incidencia;

INSERT INTO CatalogoIncidencias(nombre_incidencia)
VALUES ('Bloqueo por manifestación'), ('Inundación'), ('Colisión de unidad'),
       ('Colisión de terceros'), ('Fallas técnicas de la unidad'), ('Unidad detenida en el carril'),
        ('Incidente en la estación'), ('Otro')
ON CONFLICT (nombre_incidencia) DO NOTHING;

INSERT INTO Rutas(id_ruta, nombre, es_circular)
VALUES (1, 'L1 Central de Abastos ↔ Ciudad Azteca', TRUE)
ON CONFLICT (id_ruta) DO UPDATE
SET nombre = EXCLUDED.nombre, es_circular = EXCLUDED.es_circular;

-- =========================
-- 6) ESTACIONES DE LÍNEA 1 (IDA + REGRESO)
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
upsert AS (
  INSERT INTO Estaciones(nombre_estacion, pos_x, pos_y)
  SELECT nombre, pos_x, pos_y FROM listado
  ON CONFLICT (nombre_estacion)
  DO UPDATE SET pos_x = EXCLUDED.pos_x, pos_y = EXCLUDED.pos_y
  RETURNING id_estacion, nombre_estacion
),
mapeo AS (
  SELECT u.id_estacion, u.nombre_estacion, l.ord
  FROM upsert u
  JOIN listado l ON l.nombre = u.nombre_estacion
)
-- IDA (Central → Azteca)
INSERT INTO RutaEstaciones(id_ruta, id_estacion, orden, sentido, dwell_min_s, dwell_max_s)
SELECT 1, id_estacion, ord - 1, 'IDA'::sentido_dir, 12, 22
FROM mapeo
ON CONFLICT (id_ruta, orden, sentido) DO UPDATE
SET id_estacion = EXCLUDED.id_estacion,
    dwell_min_s = EXCLUDED.dwell_min_s,
    dwell_max_s = EXCLUDED.dwell_max_s;

-- REGRESO (Azteca → Central)
WITH listado(nombre, ord) AS (
  VALUES
  ('Central de Abastos', 1), ('19 de Septiembre', 2),
  ('Palomas', 3), ('Jardines de Morelos', 4),
  ('Aquiles Serdán', 5), ('Hospital', 6),
  ('1° de Mayo', 7), ('Las Américas', 8),
  ('Valle Ecatepec', 9), ('Vocacional 3', 10),
  ('Adolfo López Mateos', 11), ('Zodiaco', 12),
  ('Alfredo Torres', 13), ('UNITEC', 14),
  ('Industrial', 15), ('Josefa Ortiz', 16),
  ('Quinto Sol', 17), ('Ciudad Azteca', 18)
),
mapeo AS (
  SELECT e.id_estacion, l.ord
  FROM Estaciones e
  JOIN listado l ON e.nombre_estacion = l.nombre
),
ida AS (
  SELECT id_estacion, ord FROM mapeo
),
reg AS (
  SELECT id_estacion,
         ROW_NUMBER() OVER (ORDER BY ord DESC) - 1 AS orden
  FROM ida
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
INSERT INTO UnidadesMB(id_unidad, id_ruta, sentido, estado_unidad, en_circuito)
VALUES
  (1, 1, 'IDA', 'FUERA_DE_SERVICIO', FALSE),
  (2, 1, 'IDA', 'FUERA_DE_SERVICIO', FALSE),
  (3, 1, 'IDA', 'FUERA_DE_SERVICIO', FALSE)
ON CONFLICT (id_unidad) DO UPDATE
SET id_ruta = EXCLUDED.id_ruta,
    sentido = EXCLUDED.sentido,
    estado_unidad = EXCLUDED.estado_unidad,
    en_circuito = EXCLUDED.en_circuito;

-- INSERT INTO Usuarios (nombre, primer_apellido, email, password, id_rol)
-- VALUES ('Admin', 'Supervisor', 'admin@mexibus.com', '1234', 
--         (SELECT id_rol FROM Roles WHERE rol = 'SUPERVISOR'));

INSERT INTO Usuarios (nombre, primer_apellido, email, password, id_rol)
VALUES ('Admin', 'Supervisor', 'admin@mexibus.com', '1234', 
        (SELECT id_rol FROM Roles WHERE rol = 'SUPERVISOR'))
ON CONFLICT (email) DO NOTHING;


-- ===========================================================
--  FIN DEL ESQUEMA COMPLETO (Simulación Circular)
-- ===========================================================




// db/migrations.js
// Migraciones idempotentes para alinear el esquema entre ramas (main vs BRA).
// Si el usuario de BD no tiene permisos ALTER, fallará de forma segura (sin tumbar el servidor).

import { pool } from "./conexion.js";

const safeExec = async (client, sql) => {
  try {
    await client.query(sql);
  } catch (e) {
    // No lanzamos: queremos que el servidor levante aunque alguna migración no aplique
    console.warn("[migrations] Se omitió migración:", e.message);
  }
};

export async function runMigrations() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Usuarios.activo (lo usan endpoints de supervisor para listar/filtrar operadores)
    await safeExec(
      client,
      `ALTER TABLE Usuarios ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;`
    );

    // UnidadesMB.activo (lo usa el catálogo de unidades)
    await safeExec(
      client,
      `ALTER TABLE UnidadesMB ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;`
    );

    // UnidadesMB.velocidad (usado por simulación y por reingreso)
    await safeExec(
      client,
      `ALTER TABLE UnidadesMB ADD COLUMN IF NOT EXISTS velocidad INTEGER NOT NULL DEFAULT 0;`
    );

    // UnidadesMB.numero_unidad (para capturar el número visible de la unidad)
    await safeExec(
      client,
      `ALTER TABLE UnidadesMB ADD COLUMN IF NOT EXISTS numero_unidad INTEGER;`
    );
    
    // UnidadesMB.marca y UnidadesMB.modelo
    await safeExec(
      client,
      `ALTER TABLE UnidadesMB ADD COLUMN IF NOT EXISTS marca VARCHAR(100);`
    );

    await safeExec(
      client,
      `ALTER TABLE UnidadesMB ADD COLUMN IF NOT EXISTS modelo VARCHAR(100);`
    );

    // (Opcional recomendado) si ya hay unidades viejas y quieres que se muestre el # correctamente
    await safeExec(
      client,
      `UPDATE UnidadesMB SET numero_unidad = id_unidad WHERE numero_unidad IS NULL;`
    );

    // Único (evita duplicados)
    await safeExec(
      client,
      `DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'uq_unidadesmb_numero_unidad') THEN
          CREATE UNIQUE INDEX uq_unidadesmb_numero_unidad
          ON UnidadesMB (numero_unidad)
          WHERE numero_unidad IS NOT NULL;
        END IF;
      END$$;`
    );

    // Password requerido por login (si ya existe, se ignora)
    await safeExec(
      client,
      `ALTER TABLE Usuarios ADD COLUMN IF NOT EXISTS password VARCHAR(255);`
    );

    // Índice único para email (más portable que ADD CONSTRAINT en esquemas ya existentes)
    await safeExec(
      client,
      `DO $$
       BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM pg_indexes
           WHERE schemaname = current_schema()
             AND indexname = 'uq_usuarios_email'
         ) THEN
           CREATE UNIQUE INDEX uq_usuarios_email ON Usuarios(email);
         END IF;
       END$$;`
    );

    await client.query("COMMIT");
    console.log("[migrations] OK");
  } catch (e) {
    await client.query("ROLLBACK");
    console.warn("[migrations] Error general (se continúa):", e.message);
  } finally {
    client.release();
  }
}

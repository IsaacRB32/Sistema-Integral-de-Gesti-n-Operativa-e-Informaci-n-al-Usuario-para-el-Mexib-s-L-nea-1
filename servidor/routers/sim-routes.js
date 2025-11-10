// servidor/routers/sim-routes.js
import express from "express";
import { pool } from "../db/conexion.js";

const router = express.Router();

/**
 * GET /sim/snapshot
 * Devuelve el estado actual de las unidades en circuito (para inspección/debug).
 */
router.get("/sim/snapshot", async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id_unidad, id_ruta, sentido, en_circuito, idx_tramo, progreso,
             estado_unidad, dwell_hasta, velocidad
      FROM UnidadesMB
      WHERE en_circuito = TRUE
      ORDER BY id_unidad ASC
    `);
    res.json(rows);
  } catch (e) {
    console.error("snapshot:", e);
    res.status(500).json({ ok: false, error: "Error al obtener snapshot" });
  }
});

/**
 * POST /sim/entrar
 * body: { id_unidad, id_ruta, sentido:'IDA'|'REGRESO', idx_tramo?:number, estado_inicial?:'EN_RUTA'|'EN_ESTACION', dwell_seg?:number }
 * Comportamiento por defecto: EN_RUTA, progreso=0, dwell_hasta=NULL
 */
router.post("/sim/entrar", async (req, res) => {
  try {
    const { id_unidad, id_ruta, sentido, idx_tramo = 0, estado_inicial, dwell_seg } = req.body || {};

    if (!id_unidad || !id_ruta || !sentido) {
      return res.status(400).json({ ok: false, error: "id_unidad, id_ruta y sentido son obligatorios" });
    }
    const estado = (estado_inicial === "EN_ESTACION" ? "EN_ESTACION" : "EN_RUTA");
    const dwellDate =
      estado === "EN_ESTACION" && Number(dwell_seg) > 0
        ? new Date(Date.now() + Number(dwell_seg) * 1000)
        : null;

    const upd = await pool.query(
      `UPDATE UnidadesMB
         SET id_ruta=$1, sentido=$2, en_circuito=TRUE,
             estado_unidad=$3, idx_tramo=$4, progreso=0, dwell_hasta=$5
       WHERE id_unidad=$6
       RETURNING id_unidad`,
      [id_ruta, sentido, estado, idx_tramo, dwellDate, id_unidad]
    );

    if (upd.rowCount === 0) {
      return res.status(404).json({ ok: false, error: "La unidad no existe" });
    }

    await pool.query(
      `INSERT INTO EventosUnidad (id_unidad, tipo, detalle)
       VALUES ($1, 'ENTRAR', $2::jsonb)`,
      [id_unidad, JSON.stringify({ id_ruta, sentido, idx_tramo, estado_inicial: estado, dwell_hasta: dwellDate })]
    );

    res.json({ ok: true });
  } catch (e) {
    console.error("entrar:", e);
    res.status(500).json({ ok: false, error: "Error al meter unidad al circuito" });
  }
});

/**
 * POST /sim/incidencia
 * body: { id_unidad, descripcion?:string, id_cincidencia?:number }
 * Marca la unidad en INCIDENCIA y crea registro en Incidencias (ACTIVA).
 */
router.post("/sim/incidencia", async (req, res) => {
  const client = await pool.connect();
  try {
    const { id_unidad, descripcion = null, id_cincidencia = null } = req.body || {};
    if (!id_unidad) {
      client.release();
      return res.status(400).json({ ok: false, error: "id_unidad es obligatorio" });
    }

    await client.query("BEGIN");

    // Congelar unidad
    const upd = await client.query(
      `UPDATE UnidadesMB
         SET estado_unidad='INCIDENCIA'
       WHERE id_unidad=$1
       RETURNING id_unidad, id_ruta, idx_tramo, progreso, sentido`,
      [id_unidad]
    );
    if (upd.rowCount === 0) {
      await client.query("ROLLBACK"); client.release();
      return res.status(404).json({ ok: false, error: "La unidad no existe" });
    }

    // Tomar id_cincidencia por defecto "Otro" si no lo mandan
    let catId = id_cincidencia;
    if (!catId) {
      const q = await client.query(
        `SELECT id_cincidencia FROM CatalogoIncidencias WHERE nombre_incidencia='Otro' LIMIT 1`
      );
      catId = q.rows[0]?.id_cincidencia || null;
    }

    const ins = await client.query(
      `INSERT INTO Incidencias (descripcion, id_estado, id_cincidencia, id_unidad)
       VALUES ($1, 1, $2, $3)
       RETURNING id_incidencia`,
      [descripcion, catId, id_unidad]
    );
    const id_incidencia = ins.rows[0].id_incidencia;

    await client.query(
      `INSERT INTO EventosUnidad (id_unidad, tipo, detalle)
       VALUES ($1, 'INCIDENCIA', $2::jsonb)`,
      [id_unidad, JSON.stringify({ id_incidencia, descripcion, id_cincidencia: catId })]
    );

    await client.query("COMMIT");
    client.release();
    res.json({ ok: true, id_incidencia });
  } catch (e) {
    await client.query("ROLLBACK"); client.release();
    console.error("incidencia:", e);
    res.status(500).json({ ok: false, error: "Error al registrar incidencia" });
  }
});

/**
 * POST /sim/resolver
 * body: { id_incidencia?:number, id_unidad?:number }
 * Cierra incidencia (si hay) y vuelve la unidad a EN_RUTA.
 * Si no se pasa id_incidencia, toma la última ACTIVA de esa unidad.
 */
router.post("/sim/resolver", async (req, res) => {
  const client = await pool.connect();
  const io = req.app.get("io"); // ✅ obtiene instancia global de Socket.IO
  try {
    let { id_incidencia, id_unidad } = req.body || {};
    if (!id_incidencia && !id_unidad) {
      client.release();
      return res.status(400).json({ ok: false, error: "id_incidencia o id_unidad requerido" });
    }

    await client.query("BEGIN");

    // Buscar incidencia activa si no se pasa explícitamente
    if (!id_incidencia && id_unidad) {
      const q = await client.query(
        `SELECT id_incidencia
           FROM Incidencias
          WHERE id_unidad=$1 AND id_estado=1
          ORDER BY fecha_inicio DESC
          LIMIT 1`,
        [id_unidad]
      );
      id_incidencia = q.rows[0]?.id_incidencia || null;
    }

    // 1️⃣ Cerrar incidencia si existe
    if (id_incidencia) {
      await client.query(
        `UPDATE Incidencias
            SET id_estado=2, fecha_fin=NOW()
          WHERE id_incidencia=$1`,
        [id_incidencia]
      );
    }

    // 2️⃣ Obtener id_unidad si venía solo id_incidencia
    if (!id_unidad && id_incidencia) {
      const qU = await client.query(
        `SELECT id_unidad FROM Incidencias WHERE id_incidencia=$1`,
        [id_incidencia]
      );
      id_unidad = qU.rows[0]?.id_unidad || null;
    }

    // 3️⃣ Liberar unidad (la reactiva en simulación)
    if (id_unidad) {
      await client.query(`
        UPDATE UnidadesMB
        SET estado_unidad='EN_RUTA',
            dwell_hasta=NULL,
            en_circuito=TRUE,
            progreso = LEAST(progreso + 0.20, 1.0)
        WHERE id_unidad=$1
      `, [id_unidad]);

      // Registrar evento
      await client.query(
        `INSERT INTO EventosUnidad (id_unidad, tipo, detalle)
         VALUES ($1, 'RESOLVER_INCIDENCIA', $2::jsonb)`,
        [id_unidad, JSON.stringify({ id_incidencia })]
      );
    }

    await client.query("COMMIT");

    // 4️⃣ Emitir evento Socket.IO para actualización instantánea
    if (io && id_unidad) {
      const { rows: snapshot } = await client.query(`
        SELECT id_unidad, id_ruta, sentido, idx_tramo, progreso, estado_unidad, en_circuito, dwell_hasta
        FROM UnidadesMB
        WHERE id_unidad=$1
      `, [id_unidad]);
      io.emit("actualizar_posiciones", snapshot);
    }

    client.release();
    res.json({ ok: true });
  } catch (e) {
    await client.query("ROLLBACK");
    client.release();
    console.error("resolver:", e);
    res.status(500).json({ ok: false, error: "Error al resolver incidencia" });
  }
});

/**
 * POST /sim/salir
 * body: { id_unidad }
 * Saca la unidad del circuito y la deja FUERA_DE_SERVICIO.
 */
router.post("/sim/salir", async (req, res) => {
  try {
    const { id_unidad } = req.body || {};
    if (!id_unidad) {
      return res.status(400).json({ ok: false, error: "id_unidad es obligatorio" });
    }

    const upd = await pool.query(
      `UPDATE UnidadesMB
          SET en_circuito=FALSE, estado_unidad='FUERA_DE_SERVICIO',
              progreso=0, dwell_hasta=NULL
        WHERE id_unidad=$1
        RETURNING id_unidad`,
      [id_unidad]
    );

    if (upd.rowCount === 0) {
      return res.status(404).json({ ok: false, error: "La unidad no existe" });
    }

    await pool.query(
      `INSERT INTO EventosUnidad (id_unidad, tipo, detalle)
       VALUES ($1, 'SALIR', '{}'::jsonb)`,
      [id_unidad]
    );

    res.json({ ok: true });
  } catch (e) {
    console.error("salir:", e);
    res.status(500).json({ ok: false, error: "Error al sacar unidad del circuito" });
  }
});

export default router;

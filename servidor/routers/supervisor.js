import express from "express";
import { pool } from "../db/conexion.js";

const router = express.Router();

// ==================================
// Utilidades de validación
// ==================================
const PASSWORD_POLICY = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

function isValidPassword(pw) {
  return PASSWORD_POLICY.test(String(pw ?? ""));
}

function normalizeRol(rol) {
  const r = String(rol ?? "").trim().toUpperCase();
  return (r === "OPERADOR" || r === "SUPERVISOR") ? r : null;
}

async function getRoleId(rol) {
  const result = await pool.query(
    `SELECT id_rol FROM Roles WHERE rol = $1 LIMIT 1`,
    [rol]
  );
  return result.rows[0]?.id_rol ?? null;
}


//   1. Consultar todas las incidencias (GET /api/supervisor/incidencias)

router.get("/incidencias", async (req, res) => {
  try {
    const query = `
      SELECT 
        i.id_incidencia,
        i.fecha_inicio,
        i.descripcion,
        i.id_unidad,
        e.estado_incidencia,
        est.nombre_estacion,
        c.nombre_incidencia,
        u.nombre || ' ' || u.primer_apellido AS operador
      FROM Incidencias i
      LEFT JOIN EstadosIncidencias e ON i.id_estado = e.id_estado
      LEFT JOIN Estaciones est ON i.id_estacion = est.id_estacion
      LEFT JOIN CatalogoIncidencias c ON i.id_cincidencia = c.id_cincidencia
      LEFT JOIN Usuarios u ON i.id_usuario_reporta = u.id_usuario
      ORDER BY i.fecha_inicio DESC;
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error al consultar incidencias:", error);
    res.status(500).json({ error: "Error al obtener incidencias" });
  }
});

//   2. Consultar una incidencia específica (GET /api/supervisor/incidencias/:id)

router.get("/incidencias/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        i.id_incidencia,
        i.fecha_inicio,
        i.fecha_fin,
        i.descripcion,
        e.estado_incidencia,
        est.nombre_estacion,
        c.nombre_incidencia,
        u.nombre || ' ' || u.primer_apellido AS operador,
        s.nombre || ' ' || s.primer_apellido AS supervisor
      FROM Incidencias i
      LEFT JOIN EstadosIncidencias e ON i.id_estado = e.id_estado
      LEFT JOIN Estaciones est ON i.id_estacion = est.id_estacion
      LEFT JOIN CatalogoIncidencias c ON i.id_cincidencia = c.id_cincidencia
      LEFT JOIN Usuarios u ON i.id_usuario_reporta = u.id_usuario
      LEFT JOIN Usuarios s ON i.id_usuario_atiende = s.id_usuario
      WHERE i.id_incidencia = $1;
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0)
      return res.status(404).json({ message: "Incidencia no encontrada" });
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error al consultar incidencia:", error);
    res.status(500).json({ error: "Error al obtener la incidencia" });
  }
});

//   3. Validar / actualizar estado de una incidencia (PUT /api/supervisor/incidencias/:id)

// En supervisor.js - CORREGIR el endpoint PUT
router.put("/incidencias/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { id_estado, id_usuario_atiende } = req.body || {};
    const observacion = (req.body?.observacion ?? req.body?.observaciones ?? null);

    if (!id_estado) {
      return res.status(400).json({ error: "id_estado es obligatorio" });
    }

    // Si se valida o finaliza, se asigna fecha_fin
    const query = `
      UPDATE Incidencias
      SET 
        id_estado = $1,
        id_usuario_atiende = $2,
        fecha_fin = CASE WHEN $1 != 1 THEN CURRENT_TIMESTAMP ELSE fecha_fin END,
        descripcion = descripcion || 
            CASE WHEN $3 IS NOT NULL THEN (' | Obs: ' || $3) ELSE '' END
      WHERE id_incidencia = $4;
    `;
    await pool.query(query, [id_estado, id_usuario_atiende, observacion, id]);
    res.status(200).json({ message: "Incidencia actualizada correctamente" });
  } catch (error) {
    console.error("Error al actualizar incidencia:", error);
    res.status(500).json({ error: "Error al actualizar incidencia" });
  }
});

//   4. Consultar estado de todas las unidades (GET /api/supervisor/unidades)
router.get("/unidades", async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id_unidad,
        u.sentido,
        u.idx_tramo,
        u.progreso,
        u.estado_unidad,
        u.id_ruta,
        u.en_circuito,
        u.velocidad,
        u.dwell_hasta,
        -- Información de estación actual (origen)
        e_orig.nombre_estacion as estacion_origen,
        -- Información de estación siguiente (destino)  
        e_dest.nombre_estacion as estacion_destino,
        -- Información de operador desde AsignacionesUnidad
        op.nombre || ' ' || op.primer_apellido AS operador
      FROM UnidadesMB u
      LEFT JOIN RutaEstaciones re_orig ON u.id_ruta = re_orig.id_ruta 
        AND u.sentido = re_orig.sentido 
        AND u.idx_tramo = re_orig.orden
      LEFT JOIN Estaciones e_orig ON re_orig.id_estacion = e_orig.id_estacion
      LEFT JOIN RutaEstaciones re_dest ON u.id_ruta = re_dest.id_ruta 
        AND u.sentido = re_dest.sentido 
        AND u.idx_tramo + 1 = re_dest.orden
      LEFT JOIN Estaciones e_dest ON re_dest.id_estacion = e_dest.id_estacion
      LEFT JOIN AsignacionesUnidad au ON u.id_unidad = au.id_unidad AND au.activo = true
      LEFT JOIN Usuarios op ON au.id_usuario = op.id_usuario
      WHERE u.en_circuito = true OR u.estado_unidad != 'FUERA_DE_SERVICIO'
      ORDER BY u.id_unidad ASC;
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error al consultar unidades:", error);
    res.status(500).json({ error: "Error al obtener unidades" });
  }
});

//   5. Consultar información de rutas y tramos (GET /api/supervisor/rutas/:id/tramos)
router.get("/rutas/:id/tramos", async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        re.orden,
        re.sentido,
        e_orig.nombre_estacion as estacion_origen,
        e_dest.nombre_estacion as estacion_destino
      FROM RutaEstaciones re
      LEFT JOIN Estaciones e_orig ON re.id_estacion = e_orig.id_estacion
      LEFT JOIN RutaEstaciones re_next ON re.id_ruta = re_next.id_ruta 
        AND re.sentido = re_next.sentido 
        AND re.orden + 1 = re_next.orden
      LEFT JOIN Estaciones e_dest ON re_next.id_estacion = e_dest.id_estacion
      WHERE re.id_ruta = $1
      ORDER BY re.sentido, re.orden;
    `;
    const result = await pool.query(query, [id]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error al consultar tramos de ruta:", error);
    res.status(500).json({ error: "Error al obtener tramos de ruta" });
  }
});

//   6. Consultar todas las unidades (incluyendo fuera de servicio)
router.get("/unidades/todas", async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id_unidad,
        u.sentido,
        u.idx_tramo,
        u.progreso,
        u.estado_unidad,
        u.id_ruta,
        u.en_circuito,
        u.velocidad,
        u.dwell_hasta,
        op.nombre || ' ' || op.primer_apellido AS operador
      FROM UnidadesMB u
      LEFT JOIN AsignacionesUnidad au ON u.id_unidad = au.id_unidad AND au.activo = true
      LEFT JOIN Usuarios op ON au.id_usuario = op.id_usuario
      ORDER BY u.id_unidad ASC;
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error al consultar todas las unidades:", error);
    res.status(500).json({ error: "Error al obtener todas las unidades" });
  }
});

// 6.1 GET catálogo de unidades (con filtros)
router.get("/unidades/catalogo", async (req, res) => {
  try {
    const { activo, q } = req.query;

    const params = [];
    const whereParts = [];

    // Filtro activo (true/false). Si no viene, no filtra.
    if (activo === "true" || activo === "false") {
      params.push(activo === "true");
      whereParts.push(`u.activo = $${params.length}`);
    }

    // Filtro texto (opcional): busca por id_unidad / sentido / estado_unidad
    if (q && String(q).trim() !== "") {
      const term = `%${String(q).trim().toUpperCase()}%`;
      params.push(term);
      whereParts.push(`
        (
          CAST(u.id_unidad AS TEXT) ILIKE $${params.length}
          OR UPPER(u.sentido::text) ILIKE $${params.length}
          OR UPPER(u.estado_unidad) ILIKE $${params.length}
        )
      `);
    }

    const where = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";

    const query = `
      SELECT
        u.id_unidad,
        u.numero_unidad,
        u.marca,
        u.modelo,

        u.id_ruta,
        u.sentido,
        u.estado_unidad,
        u.en_circuito,
        u.velocidad,
        u.idx_tramo,
        u.progreso,
        u.dwell_hasta,
        u.activo,

        COALESCE(
          op.nombre || ' ' || op.primer_apellido || COALESCE(' ' || op.segundo_apellido, ''),
          NULL
        ) AS operador_nombre,
        op.id_usuario AS operador_id,

        CASE WHEN au.id_asignacion IS NOT NULL THEN true ELSE false END AS tiene_operador
      FROM UnidadesMB u
      LEFT JOIN AsignacionesUnidad au
        ON au.id_unidad = u.id_unidad AND au.activo = true
      LEFT JOIN Usuarios op
        ON op.id_usuario = au.id_usuario
      ${where}
      ORDER BY u.id_unidad ASC;
    `;
    
    const result = await pool.query(query, params);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error catálogo unidades:", error);
    return res.status(500).json({ error: "Error al obtener unidades (catálogo)" });
  }
});


// 6.2 POST crear unidad (permitiendo elegir el número/id_unidad)
// POST /api/supervisor/unidades/catalogo
router.post("/unidades/catalogo", async (req, res) => {
  const client = await pool.connect();
  try {
    // 1) Datos (solo 3 obligatorios para alta)
    const numero_unidad = Number(req.body.numero_unidad ?? req.body.id_unidad);
    const marca = String(req.body.marca ?? "").trim();
    const modelo = String(req.body.modelo ?? "").trim();

    // Opcionales (si el front no los manda, se asignan defaults para no romper el motor)
    const id_ruta = Number(req.body.id_ruta ?? 1);
    const sentido = String(req.body.sentido ?? "IDA").trim().toUpperCase();

    // 2) Validaciones
    if (!Number.isInteger(numero_unidad) || numero_unidad <= 0) {
      return res.status(400).json({ error: "numero_unidad debe ser un entero > 0" });
    }
    if (!marca) return res.status(400).json({ error: "marca es obligatoria" });
    if (!modelo) return res.status(400).json({ error: "modelo es obligatorio" });

    if (!Number.isInteger(id_ruta) || id_ruta <= 0) {
      return res.status(400).json({ error: "id_ruta inválido" });
    }
    if (!["IDA", "REGRESO"].includes(sentido)) {
      return res.status(400).json({ error: "sentido inválido (IDA|REGRESO)" });
    }

    await client.query("BEGIN");

    // 3) Evitar duplicado (más claro que dejar que truene por PK)
    const yaExiste = await client.query(
      "SELECT 1 FROM UnidadesMB WHERE id_unidad = $1 LIMIT 1",
      [numero_unidad]
    );
    if (yaExiste.rowCount > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: `Ya existe la unidad ${numero_unidad}` });
    }

    // 4) Insert: id_unidad = numero_unidad, y numero_unidad se setea igual
    const insertSQL = `
      INSERT INTO UnidadesMB (
        id_unidad,
        numero_unidad,
        marca,
        modelo,
        id_ruta,
        sentido,
        estado_unidad,
        en_circuito,
        velocidad,
        idx_tramo,
        progreso,
        activo
      )
      VALUES (
        $1, $1, $2, $3, $4, $5,
        'FUERA_DE_SERVICIO',
        false,
        0,
        0,
        0,
        true
      )
      RETURNING *;
    `;

    const result = await client.query(insertSQL, [
      numero_unidad,
      marca,
      modelo,
      id_ruta,
      sentido,
    ]);

    await client.query("COMMIT");
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    try { await client.query("ROLLBACK"); } catch (_) {}
    console.error("POST /unidades/catalogo error:", err);

    // Si cae por PK/unique, también devolvemos 409
    if (err?.code === "23505") {
      return res.status(409).json({ error: "Unidad ya existe (conflicto de clave/único)" });
    }
    return res.status(500).json({ error: "Error creando unidad" });
  } finally {
    client.release();
  }
});




// 6.3 PUT editar unidad (ruta/sentido) + cambiar activo (baja/reingreso) SIN outer join lock
// PUT /api/supervisor/unidades/catalogo/:id_unidad
router.put("/unidades/catalogo/:id_unidad", async (req, res) => {
  const client = await pool.connect();
  try {
    const id_unidad = Number(req.params.id_unidad);
    if (!Number.isInteger(id_unidad) || id_unidad <= 0) {
      return res.status(400).json({ error: "id_unidad inválido" });
    }

    // Campos opcionales
    const marca =
      (req.body.marca !== undefined && req.body.marca !== null)
        ? String(req.body.marca).trim()
        : undefined;

    const modelo =
      (req.body.modelo !== undefined && req.body.modelo !== null)
        ? String(req.body.modelo).trim()
        : undefined;

    const id_ruta =
      (req.body.id_ruta !== undefined && req.body.id_ruta !== null)
        ? Number(req.body.id_ruta)
        : undefined;

    const sentido =
      (req.body.sentido !== undefined && req.body.sentido !== null)
        ? String(req.body.sentido).trim().toUpperCase()
        : undefined;

    const activo =
      (req.body.activo !== undefined && req.body.activo !== null)
        ? (String(req.body.activo) === "true" || req.body.activo === true)
        : undefined;

    // Validaciones finas
    if (marca !== undefined && !marca) return res.status(400).json({ error: "marca no puede ir vacía" });
    if (modelo !== undefined && !modelo) return res.status(400).json({ error: "modelo no puede ir vacío" });

    if (id_ruta !== undefined && (!Number.isInteger(id_ruta) || id_ruta <= 0)) {
      return res.status(400).json({ error: "id_ruta inválido" });
    }
    if (sentido !== undefined && !["IDA", "REGRESO"].includes(sentido)) {
      return res.status(400).json({ error: "sentido inválido (IDA|REGRESO)" });
    }

    // Armar UPDATE dinámico
    const sets = [];
    const params = [];
    let i = 1;

    if (marca !== undefined) {
      params.push(marca);
      sets.push(`marca = $${i++}`);
    }
    if (modelo !== undefined) {
      params.push(modelo);
      sets.push(`modelo = $${i++}`);
    }
    if (id_ruta !== undefined) {
      params.push(id_ruta);
      sets.push(`id_ruta = $${i++}`);
    }
    if (sentido !== undefined) {
      params.push(sentido);
      sets.push(`sentido = $${i++}`);
    }

    // Si activo cambia, aplicamos reglas seguras para evitar estados inconsistentes
    if (activo !== undefined) {
      params.push(activo);
      sets.push(`activo = $${i++}`);

      if (activo === false) {
        // Baja lógica: forzamos fuera de circuito y reseteo operacional
        sets.push(`en_circuito = false`);
        sets.push(`estado_unidad = 'FUERA_DE_SERVICIO'`);
        sets.push(`velocidad = 0`);
        sets.push(`progreso = 0`);
        sets.push(`idx_tramo = 0`);
        sets.push(`dwell_hasta = NULL`);
      } else {
        // Reingreso: por seguridad lo dejamos fuera de circuito (el supervisor lo mete con /sim/entrar)
        sets.push(`en_circuito = false`);
        sets.push(`estado_unidad = 'FUERA_DE_SERVICIO'`);
      }
    }

    if (sets.length === 0) {
      return res.status(400).json({
        error: "Envía al menos un campo a actualizar: marca, modelo, id_ruta, sentido, activo",
      });
    }

    await client.query("BEGIN");

    const updateSQL = `
      UPDATE UnidadesMB
      SET ${sets.join(", ")}
      WHERE id_unidad = $${i}
      RETURNING *;
    `;
    params.push(id_unidad);

    const result = await client.query(updateSQL, params);

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Unidad no encontrada" });
    }

    await client.query("COMMIT");
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    try { await client.query("ROLLBACK"); } catch (_) {}
    console.error("PUT /unidades/catalogo/:id_unidad error:", err);
    return res.status(500).json({ error: "Error actualizando unidad" });
  } finally {
    client.release();
  }
});



// 6.4 DELETE baja lógica (no permitir si está en circuito o tiene operador asignado)
router.delete("/unidades/catalogo/:id_unidad", async (req, res) => {
  try {
    const { id_unidad } = req.params;

    const q = `
      SELECT
        u.en_circuito,
        EXISTS(
          SELECT 1 FROM AsignacionesUnidad au
          WHERE au.id_unidad = u.id_unidad AND au.activo = true
        ) AS tiene_operador
      FROM UnidadesMB u
      WHERE u.id_unidad = $1 AND u.activo = true;
    `;
    const check = await pool.query(q, [id_unidad]);
    if (check.rowCount === 0) return res.status(404).json({ error: "Unidad no encontrada" });

    const { en_circuito, tiene_operador } = check.rows[0];
    if (en_circuito) return res.status(409).json({ error: "No se puede eliminar: la unidad está en circuito" });
    if (tiene_operador) return res.status(409).json({ error: "No se puede eliminar: tiene operador asignado" });

    const result = await pool.query(
      `UPDATE UnidadesMB
       SET activo = false,
           estado_unidad = 'FUERA_DE_SERVICIO',
           en_circuito = false,
           idx_tramo = 0,
           progreso = 0,
           velocidad = 0,
           dwell_hasta = NULL
       WHERE id_unidad = $1 AND activo = true
       RETURNING id_unidad;`,
      [id_unidad]
    );

    return res.status(200).json({ ok: true, id_unidad: result.rows[0].id_unidad });
  } catch (error) {
    console.error("Error eliminando unidad:", error);
    return res.status(500).json({ error: "Error al eliminar unidad" });
  }
});

// 6.5 DELETE eliminar PERMANENTEMENTE (borrado físico)
// Reglas: solo si NO está en circuito, NO tiene operador activo y la unidad está INACTIVA.
router.delete("/unidades/catalogo/:id_unidad/permanente", async (req, res) => {
  const client = await pool.connect();
  try {
    const { id_unidad } = req.params;

    await client.query("BEGIN");

    // 1) Lock SOLO de la unidad (sin outer join)
    const uQ = `
      SELECT id_unidad, activo, en_circuito
      FROM UnidadesMB
      WHERE id_unidad = $1
      FOR UPDATE;
    `;
    const uRes = await client.query(uQ, [id_unidad]);

    if (uRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Unidad no encontrada" });
    }

    const unidad = uRes.rows[0];

    if (unidad.en_circuito) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "No se puede eliminar permanentemente: la unidad está en circuito" });
    }

    // 2) Verifica operador asignado (sin join)
    const opQ = `
      SELECT 1
      FROM AsignacionesUnidad
      WHERE id_unidad = $1 AND activo = true
      LIMIT 1;
    `;
    const opRes = await client.query(opQ, [id_unidad]);

    if (opRes.rowCount > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "No se puede eliminar permanentemente: tiene operador asignado" });
    }

    // 3) Reglas de seguridad: primero debe estar INACTIVA
    if (unidad.activo === true) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Primero da de baja la unidad (INACTIVA) antes de eliminarla permanentemente" });
    }

    // 4) Borra dependencias para evitar FK
    await client.query("DELETE FROM EventosUnidad WHERE id_unidad = $1;", [id_unidad]);
    await client.query("DELETE FROM Incidencias WHERE id_unidad = $1;", [id_unidad]);
    await client.query("DELETE FROM AsignacionesUnidad WHERE id_unidad = $1;", [id_unidad]);

    // 5) Borra la unidad
    const del = await client.query(
      "DELETE FROM UnidadesMB WHERE id_unidad = $1 RETURNING id_unidad;",
      [id_unidad]
    );

    await client.query("COMMIT");
    return res.status(200).json({ ok: true, id_unidad: del.rows[0].id_unidad });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error eliminando unidad permanentemente:", error);

    // Si llegara a ser FK aún, te lo deja claro
    if (error.code === "23503") {
      return res.status(409).json({ error: "No se puede eliminar: existen registros relacionados (FK). Revisa tablas relacionadas." });
    }

    return res.status(500).json({ error: "Error al eliminar unidad permanentemente" });
  } finally {
    client.release();
  }
});

//   7. NUEVO: Obtener conductores/operadores disponibles
router.get("/conductores", async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id_usuario,
        u.nombre || ' ' || u.primer_apellido || COALESCE(' ' || u.segundo_apellido, '') AS nombre_completo,
        u.email,
        r.rol,
        CASE 
          WHEN au.id_asignacion IS NOT NULL THEN 'OCUPADO'
          ELSE 'DISPONIBLE'
        END AS estado,
        au.id_unidad AS unidad_asignada
      FROM Usuarios u
      INNER JOIN Roles r ON u.id_rol = r.id_rol
      LEFT JOIN AsignacionesUnidad au ON u.id_usuario = au.id_usuario AND au.activo = true
      WHERE r.rol = 'OPERADOR' AND u.activo = true
      ORDER BY u.nombre ASC;
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error al consultar conductores:", error);
    res.status(500).json({ error: "Error al obtener conductores" });
  }
});

//   8. NUEVO: Asignar conductor a unidad
router.post("/asignar-conductor", async (req, res) => {
  const client = await pool.connect();
  try {
    const { id_usuario, id_unidad } = req.body;

    if (!id_usuario || !id_unidad) {
      return res.status(400).json({ error: "id_usuario e id_unidad son obligatorios" });
    }

    await client.query("BEGIN");

    // Verificar que el conductor no tenga otra unidad asignada
    const checkConductor = await client.query(
      `SELECT id_asignacion FROM AsignacionesUnidad 
       WHERE id_usuario = $1 AND activo = true`,
      [id_usuario]
    );

    if (checkConductor.rows.length > 0) {
      await client.query("ROLLBACK");
      client.release();
      return res.status(400).json({ error: "El conductor ya tiene una unidad asignada" });
    }

    // Verificar que la unidad no tenga otro conductor
    const checkUnidad = await client.query(
      `SELECT id_asignacion FROM AsignacionesUnidad 
       WHERE id_unidad = $1 AND activo = true`,
      [id_unidad]
    );

    if (checkUnidad.rows.length > 0) {
      await client.query("ROLLBACK");
      client.release();
      return res.status(400).json({ error: "La unidad ya tiene un conductor asignado" });
    }

    // Crear asignación
    await client.query(
      `INSERT INTO AsignacionesUnidad (id_usuario, id_unidad, activo)
       VALUES ($1, $2, true)`,
      [id_usuario, id_unidad]
    );

    await client.query("COMMIT");
    client.release();

    res.status(200).json({ message: "Conductor asignado correctamente" });
  } catch (error) {
    await client.query("ROLLBACK");
    client.release();
    console.error("Error al asignar conductor:", error);
    res.status(500).json({ error: "Error al asignar conductor" });
  }
});

//   9. NUEVO: Desasignar conductor de unidad
router.post("/desasignar-conductor", async (req, res) => {
  try {
    const { id_unidad } = req.body;

    if (!id_unidad) {
      return res.status(400).json({ error: "id_unidad es obligatorio" });
    }

    await pool.query(
      `UPDATE AsignacionesUnidad 
       SET activo = false, fecha_fin = NOW()
       WHERE id_unidad = $1 AND activo = true`,
      [id_unidad]
    );

    res.status(200).json({ message: "Conductor desasignado correctamente" });
  } catch (error) {
    console.error("Error al desasignar conductor:", error);
    res.status(500).json({ error: "Error al desasignar conductor" });
  }
});

// ===============================
// 10) CRUD de OPERADORES
// ===============================

// Listar operadores
router.get("/operadores", async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id_usuario,
        u.nombre,
        u.primer_apellido,
        u.segundo_apellido,
        u.contacto,
        u.email,
        r.rol,
        CASE 
          WHEN au.id_asignacion IS NOT NULL THEN 'OCUPADO'
          ELSE 'DISPONIBLE'
        END AS estado,
        au.id_unidad AS unidad_asignada
      FROM Usuarios u
      INNER JOIN Roles r ON u.id_rol = r.id_rol
      LEFT JOIN AsignacionesUnidad au 
        ON u.id_usuario = au.id_usuario AND au.activo = true
      WHERE r.rol = 'OPERADOR'
        AND (u.activo IS NULL OR u.activo = true)
      ORDER BY u.nombre ASC;
    `;

    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error al consultar operadores:", error);
    res.status(500).json({ error: "Error al obtener operadores" });
  }
});

// Crear operador
router.post("/operadores", async (req, res) => {
  try {
    const {
      nombre,
      primer_apellido,
      segundo_apellido = null,
      contacto = null,
      email,
      password
    } = req.body;

    if (!nombre || !primer_apellido || !email || !password) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    const rolRes = await pool.query(
      `SELECT id_rol FROM Roles WHERE rol = 'OPERADOR' LIMIT 1`
    );
    if (rolRes.rows.length === 0) {
      return res.status(500).json({ error: "No existe el rol OPERADOR en Roles" });
    }
    const id_rol = rolRes.rows[0].id_rol;

    const insert = `
      INSERT INTO Usuarios (nombre, primer_apellido, segundo_apellido, contacto, email, password, id_rol, activo)
      VALUES ($1,$2,$3,$4,$5,$6,$7,true)
      RETURNING id_usuario, nombre, primer_apellido, segundo_apellido, contacto, email;
    `;

    const result = await pool.query(insert, [
      nombre, primer_apellido, segundo_apellido, contacto, email, password, id_rol
    ]);

    res.status(201).json({ message: "Operador creado", operador: result.rows[0] });
  } catch (error) {
    // Duplicado por unique email
    if (error.code === "23505") {
      return res.status(409).json({ error: "El email ya está registrado" });
    }
    console.error("Error al crear operador:", error);
    res.status(500).json({ error: "Error al crear operador" });
  }
});

// Actualizar operador
router.put("/operadores/:id_usuario", async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const {
      nombre,
      primer_apellido,
      segundo_apellido,
      contacto,
      email,
      password
    } = req.body;

    const sets = [];
    const values = [];
    let i = 1;

    const addSet = (field, value) => {
      sets.push(`${field} = $${i++}`);
      values.push(value);
    };

    if (nombre !== undefined) addSet("nombre", nombre);
    if (primer_apellido !== undefined) addSet("primer_apellido", primer_apellido);
    if (segundo_apellido !== undefined) addSet("segundo_apellido", segundo_apellido);
    if (contacto !== undefined) addSet("contacto", contacto);
    if (email !== undefined) addSet("email", email);

    // Password: solo actualizar si viene y no está vacío
    if (password !== undefined && String(password).trim() !== "") {
      addSet("password", password);
    }

    if (sets.length === 0) {
      return res.status(400).json({ error: "No hay campos para actualizar" });
    }

    values.push(id_usuario);
    const update = `
      UPDATE Usuarios
      SET ${sets.join(", ")}
      WHERE id_usuario = $${i}
        AND id_rol = (SELECT id_rol FROM Roles WHERE rol = 'OPERADOR' LIMIT 1)
      RETURNING id_usuario, nombre, primer_apellido, segundo_apellido, contacto, email;
    `;

    const result = await pool.query(update, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Operador no encontrado" });
    }

    res.status(200).json({ message: "Operador actualizado", operador: result.rows[0] });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "El email ya está registrado" });
    }
    console.error("Error al actualizar operador:", error);
    res.status(500).json({ error: "Error al actualizar operador" });
  }
});

// Eliminar operador (baja lógica)
router.delete("/operadores/:id_usuario", async (req, res) => {
  const client = await pool.connect();
  try {
    const { id_usuario } = req.params;

    // 1) Validar si está OCUPADO (asignación activa)
    const busy = await client.query(
      `SELECT au.id_unidad
       FROM AsignacionesUnidad au
       WHERE au.id_usuario = $1 AND au.activo = true
       LIMIT 1`,
      [id_usuario]
    );

    if (busy.rows.length > 0) {
      return res.status(409).json({
        error: "No se puede eliminar: el operador está OCUPADO",
        unidad_asignada: busy.rows[0].id_unidad
      });
    }

    // 2) Baja lógica (permitida solo si no está ocupado)
    const del = await client.query(
      `UPDATE Usuarios
       SET activo = false
       WHERE id_usuario = $1
         AND id_rol = (SELECT id_rol FROM Roles WHERE rol='OPERADOR' LIMIT 1)
       RETURNING id_usuario`,
      [id_usuario]
    );

    if (del.rows.length === 0) {
      return res.status(404).json({ error: "Operador no encontrado" });
    }

    return res.status(200).json({ message: "Operador eliminado (baja lógica) correctamente" });

  } catch (error) {
    console.error("Error al eliminar operador:", error);
    return res.status(500).json({ error: "Error al eliminar operador" });
  } finally {
    client.release();
  }
});

// =====================================================
// CRUD DE USUARIOS (OPERADOR + SUPERVISOR)
// =====================================================

// GET /api/supervisor/usuarios?rol=OPERADOR|SUPERVISOR
// GET /api/supervisor/usuarios?rol=OPERADOR|SUPERVISOR&activo=true|false
router.get("/usuarios", async (req, res) => {
  try {
    const rolQ = String(req.query.rol ?? "").trim().toUpperCase();
    const activoQ = String(req.query.activo ?? "").trim().toLowerCase();

    // Validar rol (opcional)
    const rol = rolQ ? normalizeRol(rolQ) : null;
    if (rolQ && !rol) {
      return res.status(400).json({ error: "Parámetro rol inválido (usa OPERADOR o SUPERVISOR)" });
    }

    // Validar activo (opcional)
    let filtroActivo = null; // null = sin filtro
    if (activoQ === "true") filtroActivo = true;
    else if (activoQ === "false") filtroActivo = false;
    else if (activoQ !== "") {
      return res.status(400).json({ error: "Parámetro activo inválido (usa true o false)" });
    }

    let sql = `
      SELECT 
        u.id_usuario,
        u.nombre,
        u.primer_apellido,
        u.segundo_apellido,
        u.contacto,
        u.email,
        u.activo,
        r.rol,
        au.id_unidad
      FROM Usuarios u
      JOIN Roles r ON r.id_rol = u.id_rol
      LEFT JOIN AsignacionesUnidad au 
        ON au.id_usuario = u.id_usuario AND au.activo = TRUE
    `;

    const params = [];
    const conditions = [];

    // Filtro por rol
    if (rol) {
      params.push(rol);
      conditions.push(`r.rol = $${params.length}`);
    }

    // Filtro por activo:
    // - activo=true incluye NULL como activo
    // - activo=false solo false
    if (filtroActivo === true) {
      conditions.push(`(u.activo IS NULL OR u.activo = TRUE)`);
    } else if (filtroActivo === false) {
      conditions.push(`u.activo = FALSE`);
    }

    if (conditions.length) {
      sql += ` WHERE ` + conditions.join(" AND ");
    }

    sql += ` ORDER BY u.id_usuario`;

    const result = await pool.query(sql, params);
    res.json(result.rows);

  } catch (err) {
    console.error("Error obteniendo usuarios:", err);
    res.status(500).json({ error: "Error obteniendo usuarios" });
  }
});



// POST /api/supervisor/usuarios
router.post("/usuarios", async (req, res) => {
  try {
    const {
      rol,
      nombre,
      primer_apellido,
      segundo_apellido,
      contacto,
      email,
      password,
      confirm_password
    } = req.body;

    const rolNorm = normalizeRol(rol);
    if (!rolNorm) {
      return res.status(400).json({ error: "Rol inválido" });
    }

    if (!password || !confirm_password) {
      return res.status(400).json({ error: "La contraseña es obligatoria" });
    }

    if (password !== confirm_password) {
      return res.status(400).json({ error: "Las contraseñas no coinciden" });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        error: "La contraseña debe tener mínimo 8 caracteres, letras y números"
      });
    }

    const idRol = await getRoleId(rolNorm);
    if (!idRol) {
      return res.status(400).json({ error: "Rol no encontrado" });
    }

    const result = await pool.query(
      `
      INSERT INTO Usuarios 
        (nombre, primer_apellido, segundo_apellido, contacto, email, password, id_rol, activo)
      VALUES 
        ($1,$2,$3,$4,$5,$6,$7,TRUE)
      RETURNING id_usuario
      `,
      [
        nombre,
        primer_apellido,
        segundo_apellido,
        contacto,
        email,
        password,
        idRol
      ]
    );

    res.status(201).json({
      message: "Usuario creado correctamente",
      id_usuario: result.rows[0].id_usuario
    });

  } catch (err) {
    console.error("Error creando usuario:", err);
    res.status(500).json({ error: "Error creando usuario" });
  }
});


// PUT /api/supervisor/usuarios/:id_usuario
// PUT /api/supervisor/usuarios/:id_usuario
router.put("/usuarios/:id_usuario", async (req, res) => {
  try {
    const { id_usuario } = req.params;

    const {
      rol,
      activo,
      nombre,
      primer_apellido,
      segundo_apellido,
      contacto,
      email,
      password,
      confirm_password
    } = req.body;

    // -----------------------------
    // Rol (opcional)
    // -----------------------------
    let idRol = null;
    if (rol !== undefined && rol !== null && String(rol).trim() !== "") {
      const rolNorm = normalizeRol(rol);
      if (!rolNorm) {
        return res.status(400).json({ error: "Rol inválido" });
      }
      idRol = await getRoleId(rolNorm);
      if (!idRol) {
        return res.status(400).json({ error: "Rol no encontrado" });
      }
    }

    // -----------------------------
    // Activo (opcional)
    // -----------------------------
    let activoBool = null; // null = no modificar
    if (activo !== undefined) {
      if (typeof activo === "boolean") {
        activoBool = activo;
      } else {
        const s = String(activo).trim().toLowerCase();
        if (s === "true") activoBool = true;
        else if (s === "false") activoBool = false;
        else {
          return res.status(400).json({ error: "Campo activo inválido (usa true/false)" });
        }
      }
    }

    // -----------------------------
    // Password (opcional: solo si quieren restablecer)
    // -----------------------------
    const wantsPwChange = (password !== undefined && String(password).trim() !== "") ||
                          (confirm_password !== undefined && String(confirm_password).trim() !== "");

    let passwordToSave = null;

    if (wantsPwChange) {
      if (!password || !confirm_password) {
        return res.status(400).json({ error: "Para cambiar contraseña debes enviar password y confirm_password" });
      }
      if (String(password) !== String(confirm_password)) {
        return res.status(400).json({ error: "Las contraseñas no coinciden" });
      }
      if (!isValidPassword(password)) {
        return res.status(400).json({
          error: "La contraseña debe tener mínimo 8 caracteres, letras y números"
        });
      }
      passwordToSave = password; // texto plano según tu implementación actual
    }

    // -----------------------------
    // UPDATE
    // -----------------------------
    await pool.query(
      `
      UPDATE Usuarios SET
        nombre = COALESCE($1, nombre),
        primer_apellido = COALESCE($2, primer_apellido),
        segundo_apellido = COALESCE($3, segundo_apellido),
        contacto = COALESCE($4, contacto),
        email = COALESCE($5, email),
        password = COALESCE($6, password),
        id_rol = COALESCE($7, id_rol),
        activo = COALESCE($8, activo)
      WHERE id_usuario = $9
      `,
      [
        nombre ?? null,
        primer_apellido ?? null,
        segundo_apellido ?? null,
        contacto ?? null,
        email ?? null,
        passwordToSave,   // null si no quieren cambiar
        idRol,            // null si no quieren cambiar rol
        activoBool,       // null si no quieren cambiar activo
        id_usuario
      ]
    );

    res.json({ message: "Usuario actualizado correctamente" });

  } catch (err) {
    // Email único (si aplica en tu BD con índice unique)
    if (err && err.code === "23505") {
      return res.status(409).json({ error: "Email ya registrado" });
    }

    console.error("Error actualizando usuario:", err);
    res.status(500).json({ error: "Error actualizando usuario" });
  }
});



// DELETE /api/supervisor/usuarios/:id_usuario
router.delete("/usuarios/:id_usuario", async (req, res) => {
  try {
    const { id_usuario } = req.params;

    const check = await pool.query(
      `
      SELECT r.rol
      FROM Usuarios u
      JOIN Roles r ON r.id_rol = u.id_rol
      WHERE u.id_usuario = $1
      `,
      [id_usuario]
    );

    if (!check.rows.length) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (check.rows[0].rol === "OPERADOR") {
      const ocupado = await pool.query(
        `
        SELECT 1
        FROM AsignacionesUnidad
        WHERE id_usuario = $1 AND activo = TRUE
        LIMIT 1
        `,
        [id_usuario]
      );

      if (ocupado.rows.length) {
        return res.status(409).json({
          error: "No se puede eliminar un operador OCUPADO"
        });
      }
    }

    await pool.query(
      `UPDATE Usuarios SET activo = FALSE WHERE id_usuario = $1`,
      [id_usuario]
    );

    res.json({ message: "Usuario dado de baja correctamente" });

  } catch (err) {
    console.error("Error eliminando usuario:", err);
    res.status(500).json({ error: "Error eliminando usuario" });
  }
});

export default router;
import express from "express";
import { pool } from "../db/conexion.js";

const router = express.Router();

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

//6.1  Catálogo de unidades (todas las registradas)
router.get("/unidades/catalogo", async (req, res) => {
  try {
    const query = `
      SELECT
        u.id_unidad,
        u.id_ruta,
        u.sentido,
        u.estado_unidad,
        u.en_circuito,
        u.velocidad,
        u.idx_tramo,
        u.progreso,
        -- operador asignado (si existe asignación activa)
        COALESCE(
          op.nombre || ' ' || op.primer_apellido || COALESCE(' ' || op.segundo_apellido, ''),
          NULL
        ) AS operador_nombre,
        op.id_usuario AS operador_id
      FROM UnidadesMB u
      LEFT JOIN AsignacionesUnidad au
        ON au.id_unidad = u.id_unidad AND au.activo = true
      LEFT JOIN Usuarios op
        ON op.id_usuario = au.id_usuario
      WHERE u.activo = true
      ORDER BY u.id_unidad ASC;
    `;
    const result = await pool.query(query);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error catálogo unidades:", error);
    return res.status(500).json({ error: "Error al obtener unidades (catálogo)" });
  }
});

//  6.2 POST crear unidad
router.post("/unidades/catalogo", async (req, res) => {
  try {
    const { id_ruta, sentido } = req.body;

    if (!id_ruta || !sentido) {
      return res.status(400).json({ error: "id_ruta y sentido son obligatorios" });
    }
    if (!["IDA", "REGRESO"].includes(sentido)) {
      return res.status(400).json({ error: "sentido inválido (IDA | REGRESO)" });
    }

    const query = `
      INSERT INTO UnidadesMB (id_ruta, sentido, estado_unidad, en_circuito, velocidad, idx_tramo, progreso, activo)
      VALUES ($1, $2, 'FUERA_DE_SERVICIO', false, 0, 0, 0, true)
      RETURNING *;
    `;
    const result = await pool.query(query, [id_ruta, sentido]);
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creando unidad:", error);
    return res.status(500).json({ error: "Error al crear unidad" });
  }
});

//  6.3 PUT editar unidad
router.put("/unidades/catalogo/:id_unidad", async (req, res) => {
  try {
    const { id_unidad } = req.params;
    const { id_ruta, sentido } = req.body;

    if (!id_ruta || !sentido) {
      return res.status(400).json({ error: "id_ruta y sentido son obligatorios" });
    }
    if (!["IDA", "REGRESO"].includes(sentido)) {
      return res.status(400).json({ error: "sentido inválido (IDA | REGRESO)" });
    }

    // Regla: no editar si está en circuito
    const check = await pool.query(
      "SELECT en_circuito FROM UnidadesMB WHERE id_unidad = $1 AND activo = true",
      [id_unidad]
    );
    if (check.rowCount === 0) return res.status(404).json({ error: "Unidad no encontrada" });
    if (check.rows[0].en_circuito) {
      return res.status(409).json({ error: "No se puede editar: la unidad está en circuito" });
    }

    const query = `
      UPDATE UnidadesMB
      SET id_ruta = $1, sentido = $2
      WHERE id_unidad = $3 AND activo = true
      RETURNING *;
    `;
    const result = await pool.query(query, [id_ruta, sentido, id_unidad]);
    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error editando unidad:", error);
    return res.status(500).json({ error: "Error al editar unidad" });
  }
});

//  6.4 DELETE baja lógica (no permitir si está en circuito o tiene operador asignado)
router.delete("/unidades/catalogo/:id_unidad", async (req, res) => {
  try {
    const { id_unidad } = req.params;

    const q = `
      SELECT
        u.en_circuito,
        CASE WHEN au.id_asignacion IS NOT NULL THEN true ELSE false END AS tiene_operador
      FROM UnidadesMB u
      LEFT JOIN AsignacionesUnidad au
        ON au.id_unidad = u.id_unidad AND au.activo = true
      WHERE u.id_unidad = $1 AND u.activo = true;
    `;
    const check = await pool.query(q, [id_unidad]);
    if (check.rowCount === 0) return res.status(404).json({ error: "Unidad no encontrada" });

    const { en_circuito, tiene_operador } = check.rows[0];
    if (en_circuito) return res.status(409).json({ error: "No se puede eliminar: la unidad está en circuito" });
    if (tiene_operador) return res.status(409).json({ error: "No se puede eliminar: tiene operador asignado" });

    const result = await pool.query(
      "UPDATE UnidadesMB SET activo = false WHERE id_unidad = $1 AND activo = true RETURNING id_unidad",
      [id_unidad]
    );
    return res.status(200).json({ ok: true, id_unidad: result.rows[0].id_unidad });
  } catch (error) {
    console.error("Error eliminando unidad:", error);
    return res.status(500).json({ error: "Error al eliminar unidad" });
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


export default router;
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
    const { id_estado, id_usuario_atiende, observacion } = req.body;

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
      WHERE r.rol = 'OPERADOR'
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

export default router;
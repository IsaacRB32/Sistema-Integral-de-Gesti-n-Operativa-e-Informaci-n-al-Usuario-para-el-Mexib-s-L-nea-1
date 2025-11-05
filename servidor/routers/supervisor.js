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
        u.pos_x,
        u.pos_y,
        u.estado_unidad,
        e.nombre_estacion,
        op.nombre || ' ' || op.primer_apellido AS operador
      FROM UnidadesMB u
      LEFT JOIN Estaciones e ON u.id_estacion = e.id_estacion
      LEFT JOIN Usuarios op ON u.id_usuario = op.id_usuario
      ORDER BY u.id_unidad ASC;
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error al consultar unidades:", error);
    res.status(500).json({ error: "Error al obtener unidades" });
  }
});

export default router;

import express from "express";
import { pool } from "../db/conexion.js";

const router = express.Router();

//   1. Registrar nueva incidencia (POST /api/operador/incidencias)
router.post("/incidencias", async (req, res) => {
  try {
    const { descripcion, id_cincidencia, id_estacion, id_usuario_reporta } = req.body;

    // Estado inicial: 1 = Pendiente (asumiendo que existe en EstadosIncidencias)
    const id_estado = 1;

    const query = `
      INSERT INTO Incidencias (
        descripcion, id_estado, id_estacion, id_cincidencia, id_usuario_reporta
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id_incidencia;
    `;

    const values = [descripcion, id_estado, id_estacion, id_cincidencia, id_usuario_reporta];
    const result = await pool.query(query, values);

    res.status(201).json({
      message: "Incidencia registrada correctamente",
      id_incidencia: result.rows[0].id_incidencia,
    });

  } catch (error) {
    console.error("Error al registrar incidencia:", error);
    res.status(500).json({ error: "Error al registrar incidencia" });
  }
});

//   2. Actualizar posición y estado de la unidad (PUT /api/operador/unidades/:id)
router.put("/unidades/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { pos_x, pos_y, estado_unidad } = req.body;

    const query = `
      UPDATE UnidadesMB
      SET pos_x = $1, pos_y = $2, estado_unidad = $3
      WHERE id_unidad = $4;
    `;

    await pool.query(query, [pos_x, pos_y, estado_unidad, id]);
    res.status(200).json({ message: "Unidad actualizada correctamente" });

  } catch (error) {
    console.error("Error al actualizar unidad:", error);
    res.status(500).json({ error: "Error al actualizar unidad" });
  }
});

//   3. Consultar estado actual de la unidad (GET /api/operador/unidades/:id)
router.get("/unidades/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT u.id_unidad, u.pos_x, u.pos_y, u.estado_unidad, e.nombre_estacion
      FROM UnidadesMB u
      LEFT JOIN Estaciones e ON u.id_estacion = e.id_estacion
      WHERE u.id_unidad = $1;
    `;

    const result = await pool.query(query, [id]);
    if (result.rows.length === 0)
      return res.status(404).json({ message: "Unidad no encontrada" });

    res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error("Error al consultar unidad:", error);
    res.status(500).json({ error: "Error al consultar unidad" });
  }
});

export default router;
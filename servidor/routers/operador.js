import express from "express";
import { pool } from "../db/conexion.js";

const router = express.Router();

// ===============================
// Registrar incidencia + congelar unidad
// POST /api/operador/incidencias
// ===============================
router.post("/incidencias", async (req, res) => {
  console.log("Incidencia recibida desde la botonera");
  console.log("BODY:", req.body);

  const client = await pool.connect();

  try {
    const {
      descripcion,
      id_cincidencia,
      id_estacion,
      id_usuario_reporta,
      id_unidad
    } = req.body;

    if (!id_unidad) {
      return res.status(400).json({ error: "id_unidad es obligatorio" });
    }

    await client.query("BEGIN");

    // Registrar la incidencia
    const id_estado = 1; // Pendiente

    const insertIncidencia = `
      INSERT INTO Incidencias (
        descripcion,
        id_estado,
        id_estacion,
        id_cincidencia,
        id_usuario_reporta
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id_incidencia;
    `;

    const incRes = await client.query(insertIncidencia, [
      descripcion,
      id_estado,
      id_estacion,
      id_cincidencia,
      id_usuario_reporta
    ]);

    // Congelar la unidad EXACTAMENTE donde va
    // NO se toca idx_tramo ni progreso
    const freezeUnidad = `
      UPDATE UnidadesMB
      SET estado_unidad = 'INCIDENCIA'
      WHERE id_unidad = $1
        AND en_circuito = TRUE;
    `;

    await client.query(freezeUnidad, [id_unidad]);

    await client.query("COMMIT");

    console.log(`Unidad ${id_unidad} congelada en INCIDENCIA`);

    res.status(201).json({
      message: "Incidencia registrada y unidad congelada",
      id_incidencia: incRes.rows[0].id_incidencia,
      id_unidad
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al registrar incidencia:", error);
    res.status(500).json({ error: "Error al registrar incidencia" });
  } finally {
    client.release();
  }
});

export default router;
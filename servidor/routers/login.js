import { Router } from "express";
import { pool } from "../db/conexion.js";

const router = Router();

// LOGIN simple (sin JWT por ahora)
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Faltan datos" });
        }

        const sql = `
            SELECT id_usuario, nombre, primer_apellido, segundo_apellido, email
            FROM usuarios
            WHERE email = $1 AND password = $2
        `;

        const result = await pool.query(sql, [email, password]);

        if (result.rows.length === 0) {
            return res.status(401).json({ message: "Credenciales incorrectas" });
        }

        res.json({
            message: "Login exitoso",
            usuario: result.rows[0]
        });

    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
});

export default router;

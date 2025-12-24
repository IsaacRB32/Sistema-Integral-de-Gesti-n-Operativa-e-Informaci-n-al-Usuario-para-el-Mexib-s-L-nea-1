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
            SELECT 
                u.id_usuario,
                u.nombre,
                u.primer_apellido,
                u.segundo_apellido,
                u.email,
                r.rol,
                au.id_unidad AS unidad_asignada
            FROM usuarios u
            INNER JOIN roles r ON r.id_rol = u.id_rol
            LEFT JOIN asignacionesunidad au 
                ON au.id_usuario = u.id_usuario
                AND au.activo = TRUE
            WHERE u.email = $1 
              AND u.password = $2
              AND (u.activo IS NULL OR u.activo = TRUE);
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

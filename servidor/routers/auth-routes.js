// servidor/routers/auth-routes.js
import express from "express";
import { pool } from "../db/conexion.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ ok: false, mensaje: "Faltan email o password" });
    }

    // Buscar usuario en la base de datos
    const { rows } = await pool.query(
      `SELECT id_usuario, nombre, primer_apellido, segundo_apellido, contacto, email, id_rol, password
         FROM Usuarios
        WHERE email=$1
        LIMIT 1`,
      [email]
    );

    const usuario = rows[0];

    if (!usuario || usuario.password !== password) {
      return res.status(401).json({ ok: false, mensaje: "Credenciales incorrectas" });
    }

    // No devolver la contraseña
    delete usuario.password;

    res.json({ ok: true, usuario });
  } catch (e) {
    console.error("login:", e);
    res.status(500).json({ ok: false, mensaje: "Error al iniciar sesión" });
  }
});

export default router;
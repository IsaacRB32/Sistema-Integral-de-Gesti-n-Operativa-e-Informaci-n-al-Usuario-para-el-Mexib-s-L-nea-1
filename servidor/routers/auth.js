import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { pool } from "../db/conexion.js";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "mexibus_secret_key_2025";
const JWT_EXPIRES_IN = "8h";

/**
 * POST /api/login
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        ok: false, 
        error: "Email y contraseña son requeridos" 
      });
    }

    const query = `
      SELECT u.id_usuario, u.nombre, u.primer_apellido, u.segundo_apellido, 
             u.email, u.contacto, u.password_hash, r.rol
      FROM Usuarios u
      INNER JOIN Roles r ON u.id_rol = r.id_rol
      WHERE u.email = $1
    `;
    
    const result = await pool.query(query, [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        ok: false, 
        error: "Credenciales inválidas" 
      });
    }

    const usuario = result.rows[0];

    if (!usuario.password_hash) {
      return res.status(401).json({ 
        ok: false, 
        error: "Usuario sin contraseña configurada" 
      });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    
    if (!passwordValida) {
      return res.status(401).json({ 
        ok: false, 
        error: "Credenciales inválidas" 
      });
    }

    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        email: usuario.email,
        rol: usuario.rol,
        nombre_completo: `${usuario.nombre} ${usuario.primer_apellido}`
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      ok: true,
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        primer_apellido: usuario.primer_apellido,
        segundo_apellido: usuario.segundo_apellido,
        email: usuario.email,
        rol: usuario.rol
      }
    });

  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ 
      ok: false, 
      error: "Error en el servidor" 
    });
  }
});

/**
 * GET /api/verify
 */
router.get("/verify", verificarToken, (req, res) => {
  res.json({ 
    ok: true, 
    usuario: req.usuario 
  });
});

/**
 * Middleware: Verificar Token JWT
 */
export function verificarToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      ok: false, 
      error: "Token no proporcionado" 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      ok: false, 
      error: "Token inválido o expirado" 
    });
  }
}

export default router;
import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

import loginRoutes from "./routers/login.js";
import authRoutes from "./routers/auth-routes.js";
import operadorRoutes from "./routers/operador.js";
import supervisorRoutes from "./routers/supervisor.js";
import simRoutes from "./routers/sim-routes.js";

import { iniciarSimulacion } from "./routers/simulacion_simple.js";
import { runMigrations } from "./db/migrations.js";

dotenv.config();

const PORT = Number(process.env.PORT || 3000);

const app = express();

// Middleware base
app.use(cors({ 
  origin: true,
  credentials: true 
}));

app.use(express.json({ limit: "1mb" }));

// Healthcheck
app.get("/health", (_req, res) => res.status(200).json({ ok: true }));

// =====================
// RUTAS (compatibles)
// =====================
// Nota: mantenemos /api/login y /api/sim/* tal como en MAIN
app.use("/api", simRoutes);
app.use("/api", loginRoutes);

// Compatibilidad extra (si algún cliente usa /api/auth/login)
app.use("/api/auth", authRoutes);

// Operador legacy (no lo usa la botonera actual, pero se conserva)
app.use("/api/operador", operadorRoutes);

// Supervisor (funcionalidad BRA)
app.use("/api/supervisor", supervisorRoutes);

// =====================
// ESTÁTICOS
// =====================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supervisor web (si existe en el repo: ../supervisor)
app.use("/supervisor", express.static(path.join(__dirname, "../supervisor")));

// Frontend genérico (si existe en el repo: servidor/frontend)
app.use(express.static(path.join(__dirname, "frontend")));

// =====================
// SOCKET.IO
// =====================
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
app.set("io", io);

io.on("connection", (socket) => {
  console.log("Cliente conectado al socket:", socket.id);
});

// =====================
// BOOT
// =====================
(async () => {
  await runMigrations();

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor unificado corriendo en http://0.0.0.0:${PORT}`);
    iniciarSimulacion(io);
  });
})();

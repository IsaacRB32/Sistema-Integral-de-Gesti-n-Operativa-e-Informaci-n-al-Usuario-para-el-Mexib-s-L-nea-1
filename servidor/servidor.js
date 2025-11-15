import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

import { iniciarSimulacion, detenerSimulacion } from "./routers/simulacion_simple.js";
import simRoutes from "./routers/sim-routes.js";
import authRoutes from "./routers/auth.js";
import supervisorRoutes from "./routers/supervisor.js";
import operadorRoutes from "./routers/operador.js";

const app = express();
app.use(express.json());

// Rutas de API
app.use("/api", authRoutes);
app.use("/api", simRoutes);
app.use("/api/supervisor", supervisorRoutes);
app.use("/api/operador", operadorRoutes);

// Servir archivos estáticos del frontend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Frontend simulación (público)
app.use(express.static(path.join(__dirname, "frontend")));

// Panel del supervisor (carpeta externa al proyecto servidor)
const supervisorPath = path.join(__dirname, "..", "supervisor");
app.use("/supervisor", express.static(supervisorPath));

// Ruta raíz
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
app.set("io", io); // Para acceder dentro de los endpoints

io.on("connection", (socket) => {
  console.log("Cliente conectado al socket");
  
  socket.on("disconnect", () => {
    console.log("Cliente desconectado");
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log(`Simulación: http://localhost:${PORT}`);
  console.log(`Supervisor: http://localhost:${PORT}/supervisor`);
  iniciarSimulacion(io);
});

// Manejo de cierre graceful
process.on('SIGINT', () => {
  console.log('\nDeteniendo simulación...');
  detenerSimulacion();
  server.close(() => {
    console.log('Servidor cerrado');
    process.exit(0);
  });
});
import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

import { iniciarSimulacion, detenerSimulacion } from "./routers/simulacion_simple.js";
import simRoutes from "./routers/sim-routes.js";

const app = express();
app.use(express.json());
app.use("/api", simRoutes);

// 👉 Servir archivos estáticos del frontend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "frontend")));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log("🟢 Cliente conectado al socket");
});

server.listen(3000, () => {
  console.log("Servidor corriendo en puerto 3000");
  iniciarSimulacion(io);
});

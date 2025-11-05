import pkg from "pg";
import dotenv from "dotenv";
import { ClientRequest } from "http";

dotenv.config();

const{ Pool } = pkg;

export const pool = new Pool ({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
})

pool.connect().then(
    client => {
        client.release();
        console.log("Conexion exitosa");
    }
).catch(
    err => {
        console.log("Error al conectarse: ", err.message);
    }
)

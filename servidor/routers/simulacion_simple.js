// simulacion_simple.js
import { pool } from "../db/conexion.js";

let intervaloSim = null;

// ===== Parámetros de simulación (simple) =====
const TICK_MS = 1000;             // 1s por tick
//const SPEED_SEG = 20;           // avanza 25% del tramo por tick (4 ticks por tramo)
const SEG_DUR_S = 20;             // NUEVO: 1 tramo tarda 20 s (ajústalo)
const HEADWAY = 0.15;             // separación mínima de progreso (mismo tramo)
const EPS = 1e-6;

const logU = (tag, uo, extra={}) => {
  console.log(`[${tag}] u=${uo.id_unidad} sent=${uo.sentido} idx=${uo.idx_tramo} prog=${Number(uo.progreso).toFixed(3)} est=${uo.estado_unidad}`, extra);
};

// Estados
const S = {
  RUTA: 'EN_RUTA',
  EST: 'EN_ESTACION',
  COLA: 'EN_COLA',
  INC: 'INCIDENCIA',
};

// Carga estaciones (SOLO orden y dwell) separadas por sentido
async function cargarRutaPorSentido(id_ruta) {
  const sql = `
    SELECT re.orden, re.sentido, re.dwell_min_s, re.dwell_max_s, re.id_estacion
    FROM RutaEstaciones re
    WHERE re.id_ruta = $1 AND re.sentido = $2
    ORDER BY re.orden ASC
  `;
  const [ida, regreso] = await Promise.all([
    pool.query(sql, [id_ruta, 'IDA']),
    pool.query(sql, [id_ruta, 'REGRESO'])
  ]);

  const map = r => ({
    orden: Number(r.orden),
    id_estacion: Number(r.id_estacion),
    dwellMin: Number(r.dwell_min_s || 5),
    dwellMax: Number(r.dwell_max_s || 15),
  });

  return {
    ida: ida.rows.map(map),
    regreso: regreso.rows.map(map),
  };
}

// Dwell aleatorio según el tramo de llegada (índice local dentro del sentido)
function dwellRand(puntos, localIdx) {
  const st = puntos[localIdx];
  const min = st?.dwellMin ?? 5;
  const max = st?.dwellMax ?? 15;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Avance local para ordenar (tramo + progreso) circular
function avanceLocal(idx, prog, len) {
  return ((idx % len) + prog + len) % len;
}

// ====== SIMULACIÓN PRINCIPAL (simple por “colas” por sentido) ======
export const iniciarSimulacion = (io) => {
  if (intervaloSim) clearInterval(intervaloSim);
  console.log("Simulación SIMPLE iniciada…");

  intervaloSim = setInterval(async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // 1) Unidades en circuito
      const { rows: unidades } = await client.query(`
        SELECT id_unidad, id_ruta, sentido, en_circuito, idx_tramo, progreso,
               estado_unidad, dwell_hasta, velocidad
        FROM UnidadesMB
        WHERE en_circuito = TRUE
        ORDER BY id_unidad ASC
      `);
      // Forzar sincronización de estado: si alguna unidad fue reactivada fuera del ciclo (resolver incidencia)
      for (const u of unidades) {
        if (u.estado_unidad === 'INCIDENCIA') {
          const q = await client.query(`
            SELECT estado_unidad, progreso, dwell_hasta
            FROM UnidadesMB
            WHERE id_unidad = $1
          `, [u.id_unidad]);
          Object.assign(u, q.rows[0]); // actualiza en memoria
        }
      }

      if (unidades.length === 0) {
        await client.query('COMMIT');
        io.emit("actualizar_posiciones", []);
        return;
      }

      // 2) Agrupar por ruta y sentido
      const rutasCache = new Map(); // id_ruta -> {ida, regreso}
      const porRuta = new Map();    // id_ruta -> { IDA:[], REGRESO:[] }
      for (const u of unidades) {
        if (!porRuta.has(u.id_ruta)) porRuta.set(u.id_ruta, { IDA: [], REGRESO: [] });
        porRuta.get(u.id_ruta)[u.sentido].push(u);
      }

      const ahora = new Date();

      // 3) Procesar ruta x sentido como colas independientes
      for (const [id_ruta, grupos] of porRuta.entries()) {
        if (!rutasCache.has(id_ruta)) {
          rutasCache.set(id_ruta, await cargarRutaPorSentido(id_ruta));
        }
        const { ida, regreso } = rutasCache.get(id_ruta);

        for (let sentido of ['IDA', 'REGRESO']) {
          const puntos = sentido === 'IDA' ? ida : regreso;
          const len = puntos.length;
          if (len === 0) continue;

          // CONSTRUCCIÓN DEL MAPA 'ahead' Y SIMULACIÓN POR SENTIDO 

          // 1-. Ordenamos las unidades del sentido actual por avance local
          const ordenadas = grupos[sentido]
            .map(u => ({
              u,
              aLoc: avanceLocal(Number(u.idx_tramo || 0), Number(u.progreso || 0), len)
            }))
            .sort((A, B) => B.aLoc - A.aLoc) // la mayor aLoc va más adelante
            .map(x => x.u);

          // 2-. Construimos el mapa 'ahead': quién va adelante de quién
          const ahead = new Map();
          for (let i = 0; i < ordenadas.length; i++) {
            const actual = ordenadas[i];
            // El “frente” real es el que está justo antes en el arreglo ordenado.
            // Para el líder (i === 0) NO hay frente.
            const frente = (i === 0) ? null : ordenadas[i - 1];
            ahead.set(actual.id_unidad, frente);
          }

          // 3-. Simulamos desde el más adelantado hacia atrás
          for (const u of ordenadas) {
            logU('BEFORE',   u);
            let estado = u.estado_unidad;
            let idx = Number(u.idx_tramo || 0);
            let prog = Number(u.progreso || 0);
            let dwellHasta = u.dwell_hasta ? new Date(u.dwell_hasta) : null;

            if (estado === S.INC) {
              //Unidad en incidencia: se mantiene detenida
            } else if (estado === S.EST) {
              //Espera en estación hasta que termine dwell
              if (dwellHasta && ahora >= dwellHasta) {
                estado = S.RUTA;
                dwellHasta = null;
              } else {
                prog = 0;
              }
            } else if (estado === S.COLA) {
              //En cola: revisar continuamente si el frente ya avanzó o liberó el tramo
              const f = ahead.get(u.id_unidad);
              if (f) {
                const mismoTramo = (Number(f.idx_tramo || 0) === idx);
                const fBloquea = [S.INC, S.EST, S.COLA].includes(f.estado_unidad);
                const fProg = Number(f.progreso || 0);
                const hayHueco = !mismoTramo || (fProg - prog > HEADWAY + 0.02);
                const DELAY_COLA_BASE = 20000; // 20 segundos
                // Si el frente ya no bloquea y hay espacio, retomar movimiento
                if (!fBloquea && hayHueco) {
                  console.log(`🚀 Unidad ${u.id_unidad} sale de COLA — frente ${f.id_unidad} liberó tramo`);

                  // Liberación escalonada: retrasar arranque según posición en cola
                  const posCola = ordenadas.findIndex(o => o.id_unidad === u.id_unidad); // posición en lista
                  const delay = posCola * DELAY_COLA_BASE;

                  console.log(`🕒 Unidad ${u.id_unidad} esperará ${delay / 1000}s antes de salir de COLA`);

                  // mantenerla en COLA mientras espera
                  estado = S.COLA;

                  // Programar el cambio a EN_RUTA tras el delay
                  setTimeout(async () => {
                    try {
                      await pool.query(`
                        UPDATE UnidadesMB
                        SET estado_unidad='EN_RUTA'
                        WHERE id_unidad=$1
                      `, [u.id_unidad]);
                      console.log(`✅ Unidad ${u.id_unidad} ahora EN_RUTA (tras ${delay / 1000}s)`);
                    } catch (err) {
                      console.error("Error al liberar unidad con delay:", err);
                    }
                  }, delay);
                } else {
                  // Mantener en cola si aún está bloqueado o muy cerca
                  estado = S.COLA;
                }
              } else {
                // Si no hay frente, avanzar
                estado = S.RUTA;
              }
            }
            // BLOQUE DE AVANCE Y DETECCIÓN DE BLOQUEO 
            if (estado === S.RUTA) {
              const dt = TICK_MS / 1000;
              const vel = Number(u.velocidad || 1);
              const step = (vel * dt) / SEG_DUR_S;

              const aNow = avanceLocal(idx, prog, len);
              let aNext = (aNow + step) % len;

              const f = ahead.get(u.id_unidad);

              if (f) {
                const fIdx = Number(f.idx_tramo || 0);
                const fProg = Number(f.progreso || 0);
                const fA = avanceLocal(fIdx, fProg, len);
                const fEstado = f.estado_unidad;
                const fBloquea = [S.INC, S.EST, S.COLA].includes(fEstado);
                const mismoTramo = (idx === fIdx);

                let gap = (fA - aNow + len) % len;
                if (gap < EPS) gap = 0;

                console.log(`🟨 Frente detectado para u=${u.id_unidad}: f=${f.id_unidad} estado=${fEstado} gap=${gap.toFixed(3)} tramoU=${aNow.toFixed(3)} tramoF=${fA.toFixed(3)}`);

                if (fBloquea && gap < HEADWAY) {
                  console.log(`[COLISION PREVENIDA] u=${u.id_unidad} detrás de u=${f.id_unidad} gap=${gap.toFixed(3)} estado_frente=${fEstado}`);
                  aNext = aNow;
                  estado = S.COLA;
                }
              }

              const newIdx = Math.floor(aNext);
              const newProg = aNext - newIdx;
              const cruzoEstacion = (newIdx !== idx) && (estado !== S.COLA);

              idx = newIdx;
              prog = newProg;

              if (cruzoEstacion) {
                const d = dwellRand(puntos, idx);
                dwellHasta = new Date(Date.now() + d * 1000);
                estado = S.EST;

                const enUltima = (idx === 0 && aNext < aNow);
                if (enUltima) {
                  const nuevoSentido = (sentido === 'IDA') ? 'REGRESO' : 'IDA';
                  await pool.query(`UPDATE UnidadesMB SET sentido=$1 WHERE id_unidad=$2`, [nuevoSentido, u.id_unidad]);
                  sentido = nuevoSentido;
                }
              }
            }

            // Propagación del estado EN_COLA hacia atrás (efecto cadena)
            const f = ahead.get(u.id_unidad);
            if (f) {
              const fEstado = f.estado_unidad;
              const fTramo = Number(f.idx_tramo || 0);
              const fProg = Number(f.progreso || 0);
              const mismoTramo = (fTramo === idx);
              const distTramos = (fTramo - idx);
              const distancia = mismoTramo ? (fProg - prog) : distTramos + (1 - prog);

              if ([S.COLA, S.INC].includes(fEstado) && distancia < 0.4) {
                estado = S.COLA;
                prog = Math.max(0, Math.min(fProg - HEADWAY, prog));
              }
            }

            // Guardamos los nuevos valores
            u.idx_tramo = idx;
            u.progreso = prog;
            u.estado_unidad = estado;
            u.dwell_hasta = dwellHasta;
            u.sentido = sentido;

            logU('AFTER', u, { idx, prog: prog.toFixed(3), estado });

            await pool.query(`
              UPDATE UnidadesMB
              SET idx_tramo=$1, progreso=$2, estado_unidad=$3, dwell_hasta=$4
              WHERE id_unidad=$5
            `, [idx, prog, estado, dwellHasta, u.id_unidad]);
          }
          
        }
      }

      await client.query('COMMIT');

      // 4) Emitir snapshot (sin coordenadas)
      const { rows: snapshot } = await pool.query(`
        SELECT id_unidad, id_ruta, sentido, idx_tramo, progreso, estado_unidad, en_circuito, dwell_hasta
        FROM UnidadesMB
        WHERE en_circuito = TRUE
        ORDER BY id_unidad ASC
      `);
      io.emit("actualizar_posiciones", snapshot);

    } catch (e) {
      await client.query('ROLLBACK');
      console.error("Error simulación simple:", e);
    } finally {
      client.release();
    }
  }, TICK_MS);
};

export const detenerSimulacion = () => {
  if (intervaloSim) clearInterval(intervaloSim);
  console.log("Simulación SIMPLE detenida.");
};

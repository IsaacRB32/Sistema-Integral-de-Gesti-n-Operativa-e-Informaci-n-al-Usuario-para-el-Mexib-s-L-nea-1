// simulacion_simple.js
import { pool } from "../db/conexion.js";

let intervaloSim = null;

// ===== Parámetros de simulación (simple) =====
const TICK_MS = 1000;             // 1s por tick
const SPEED_SEG = 0.25;           // avanza 25% del tramo por tick (4 ticks por tramo)
const HEADWAY = 0.15;             // separación mínima de progreso (mismo tramo)
const EPS = 1e-6;

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
               estado_unidad, dwell_hasta
        FROM UnidadesMB
        WHERE en_circuito = TRUE
        ORDER BY id_unidad ASC
      `);

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

          // Ordenamos por “avance local” para saber quién va adelante
          const ordenadas = grupos[sentido]
            .map(u => ({
              u,
              aLoc: avanceLocal(Number(u.idx_tramo||0), Number(u.progreso||0), len)
            }))
            .sort((A,B) => B.aLoc - A.aLoc) // mayor aLoc va más adelante
            .map(x => x.u);

          // Mapa: quién va adelante
          const ahead = new Map();
          for (let i = 0; i < ordenadas.length; i++) {
          const actual = ordenadas[i];
          // ⚠️ Si solo hay una unidad, no tiene "frente"
          const frente = ordenadas.length > 1
            ? ordenadas[(i - 1 + ordenadas.length) % ordenadas.length]?.u
            : null;
          ahead.set(actual.id_unidad, frente);
        }

          // Simular desde el más adelantado hacia atrás
          for (const u of ordenadas) {
            let estado = u.estado_unidad;
            let idx = Number(u.idx_tramo || 0);    // índice local 0..len-1
            let prog = Number(u.progreso || 0);    // 0..1
            let dwellHasta = u.dwell_hasta ? new Date(u.dwell_hasta) : null;

            if (estado === S.INC) {
              // Se queda quieto (no cambia idx/prog)
            } else if (estado === S.EST) {
              // Espera en estación hasta dwell
              if (dwellHasta && ahora >= dwellHasta) {
                estado = S.RUTA;
                dwellHasta = null;
              } else {
                prog = 0; // en estación siempre prog=0
              }
            } else if (estado === S.COLA) {
              // Sólo salgo si el frente avanza y hay hueco
              const f = ahead.get(u.id_unidad);
              if (f) {
                const mismoTramo = (Number(f.idx_tramo||0) === idx);
                const fBloquea = [S.INC, S.EST, S.COLA].includes(f.estado_unidad);
                const hayHueco = !mismoTramo || (Number(f.progreso||0) - prog > HEADWAY + 0.02);
                if (!fBloquea && hayHueco) {
                  estado = S.RUTA;
                } // si no, me quedo en COLA
              } else {
                estado = S.RUTA;
              }
            }

            if (estado === S.RUTA) {
              // Avanza dentro del tramo actual
              prog += SPEED_SEG;

              // No rebasar al de adelante dentro del mismo tramo
              const f = ahead.get(u.id_unidad);
              if (f && Number(f.idx_tramo||0) === idx) {
                const fProg = Number(f.progreso||0);
                if (fProg - prog < HEADWAY || [S.INC, S.EST, S.COLA].includes(f.estado_unidad)) {
                  // Colocarme detrás con headway
                  prog = Math.max(0, Math.min(fProg - HEADWAY, prog));
                  estado = S.COLA;
                }
              }

              // ¿Llegó a estación siguiente?
              if (prog >= 1 - EPS) {
                prog = 0;

                // ¿Llegó al final del sentido actual?
                const enUltima = (idx + 1 >= len);

                if (enUltima) {
                  // Cambiar de sentido
                  if (sentido === 'IDA') {
                    sentido = 'REGRESO';
                    idx = 0; // inicio del regreso
                  } else {
                    sentido = 'IDA';
                    idx = 0; // inicio del ida nuevamente
                  }
                } else {
                  idx = (idx + 1);
                }

                const d = dwellRand(puntos, idx);
                dwellHasta = new Date(Date.now() + d * 1000);
                estado = S.EST;

                // Actualizar sentido en BD también
                await pool.query(
                  `UPDATE UnidadesMB
                  SET sentido=$1
                  WHERE id_unidad=$2`,
                  [sentido, u.id_unidad]
                );
              }
            }

            // Persistir
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

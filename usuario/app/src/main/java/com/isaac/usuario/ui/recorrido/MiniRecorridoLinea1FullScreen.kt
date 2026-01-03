package com.isaac.usuario.ui.recorrido

import android.graphics.Paint
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.CenterFocusStrong
import androidx.compose.material.icons.filled.DirectionsBus
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.isaac.usuario.data.model.UnidadMB
import kotlin.math.hypot

@Composable
fun MiniRecorridoLinea1FullScreen(
    unidades: List<UnidadMB>,
    modifier: Modifier = Modifier,
    estaciones: List<EstacionLinea> = estacionesLinea1
) {
    // Ordenamos estaciones para que queden: Central -> ... -> Ciudad (como en supervisor)
    val estacionesOrdenadas = remember(estaciones) { ordenarCentralACiudad(estaciones) }

    // Si tu linea1PathFull está definida como: Cd. Azteca (abajo) -> Central (arriba)
    // entonces el path está "invertido" respecto al orden Central->Ciudad.
    val pathEstaDeCiudadACentral = true

    val density = LocalDensity.current
    val topReservePx = with(density) { 92.dp.toPx() }     // espacio para header flotante
    val bottomReservePx = with(density) { 120.dp.toPx() } // espacio para leyenda flotante

    // Interacción (pan/zoom)
    var zoom by remember { mutableFloatStateOf(1.25f) }
    var pan by remember { mutableStateOf(Offset.Zero) }

    // Para centrar (recalcular cuando cambia tamaño)
    var lastCanvasSize by remember { mutableStateOf(Offset(0f, 0f)) }

    fun resetView() {
        zoom = 1.25f
        pan = Offset.Zero
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFFF5F7FA))
    ) {
        Canvas(
            modifier = Modifier
                .fillMaxSize()
                .pointerInput(Unit) {
                    detectTransformGestures { _, panChange, zoomChange, _ ->
                        val newZoom = (zoom * zoomChange).coerceIn(1f, 3.2f)
                        zoom = newZoom
                        pan += panChange
                    }
                }
        ) {
            lastCanvasSize = Offset(size.width, size.height)

            val w = size.width
            val h = size.height
            val usableH = (h - topReservePx - bottomReservePx).coerceAtLeast(1f)

            fun mapNormalized(p: Offset): Offset {
                return Offset(
                    x = p.x * w,
                    y = topReservePx + (p.y * usableH)
                )
            }

            // Puntos del path (en px)
            val pathPx = linea1PathFull.map { mapNormalized(it) }
            if (pathPx.size < 2 || estacionesOrdenadas.size < 2) return@Canvas

            val center = Offset(w / 2f, topReservePx + usableH / 2f)

            // Helpers de polilínea (para punto en t)
            val segLen = FloatArray(pathPx.size - 1)
            var totalLen = 0f
            for (i in 0 until pathPx.size - 1) {
                val a = pathPx[i]
                val b = pathPx[i + 1]
                val d = hypot(b.x - a.x, b.y - a.y)
                segLen[i] = d
                totalLen += d
            }

            fun pointOnPolyline(tRaw: Float): Offset {
                val t = tRaw.coerceIn(0f, 1f)
                val target = totalLen * t
                var acc = 0f
                for (i in segLen.indices) {
                    val next = acc + segLen[i]
                    if (target <= next || i == segLen.lastIndex) {
                        val local = if (segLen[i] == 0f) 0f else (target - acc) / segLen[i]
                        val a = pathPx[i]
                        val b = pathPx[i + 1]
                        return Offset(
                            x = a.x + (b.x - a.x) * local,
                            y = a.y + (b.y - a.y) * local
                        )
                    }
                    acc = next
                }
                return pathPx.last()
            }

            fun tangentOnPolyline(tRaw: Float): Offset {
                // Derivada numérica estable
                val dt = 0.0045f
                val t1 = (tRaw - dt).coerceIn(0f, 1f)
                val t2 = (tRaw + dt).coerceIn(0f, 1f)
                val p1 = pointOnPolyline(t1)
                val p2 = pointOnPolyline(t2)
                val dx = p2.x - p1.x
                val dy = p2.y - p1.y
                val len = hypot(dx, dy)
                return if (len == 0f) Offset(1f, 0f) else Offset(dx / len, dy / len)
            }

            fun tPathDesdeTOrdenCentralCiudad(tOrden: Float): Float {
                // tOrden: 0 = Central, 1 = Ciudad
                return if (pathEstaDeCiudadACentral) 1f - tOrden else tOrden
            }

            // Transform global (pan/zoom)
            withTransform({
                translate(center.x + pan.x, center.y + pan.y)
                scale(scaleX = zoom, scaleY = zoom)
                translate(-center.x, -center.y)
            }) {
                // ====== DIBUJO RUTA ======
                drawLineStrip(pathPx, color = Color(0xFFCDEFB7), stroke = 18f, cap = StrokeCap.Round)
                drawLineStrip(pathPx, color = Color(0xFF7ED957), stroke = 10f, cap = StrokeCap.Round)

                // ====== DIBUJO ESTACIONES ======
                val n = estacionesOrdenadas.size
                val maxIdx = (n - 1).coerceAtLeast(1)

                val paintStation = Paint().apply {
                    isAntiAlias = true
                    color = android.graphics.Color.DKGRAY
                    typeface = android.graphics.Typeface.create(
                        android.graphics.Typeface.DEFAULT,
                        android.graphics.Typeface.BOLD
                    )
                }

                estacionesOrdenadas.forEachIndexed { i, est ->
                    val tOrden = i.toFloat() / maxIdx.toFloat()          // 0..1 (Central->Ciudad)
                    val tDraw = tPathDesdeTOrdenCentralCiudad(tOrden)     // ajustado al path
                    val p = pointOnPolyline(tDraw)

                    drawCircle(Color(0xFF111827), radius = 11f, center = p)
                    drawCircle(Color.White, radius = 6f, center = p)

                    val esTerminal = (i == 0 || i == n - 1)
                    val mostrar = esTerminal || zoom >= 1.6f || (i % 2 == 0 && zoom >= 1.25f)

                    if (mostrar) {
                        paintStation.textSize = (30f / zoom).coerceIn(16f, 30f)
                        drawContext.canvas.nativeCanvas.drawText(
                            est.nombre,
                            p.x + 18f,
                            p.y + (10f / zoom),
                            paintStation
                        )
                    }
                }

                // ====== DIBUJO UNIDADES (DIFERENCIAR IDA/REGRESO) ======
                val paintUnit = Paint().apply {
                    isAntiAlias = true
                    color = android.graphics.Color.BLACK
                    typeface = android.graphics.Typeface.DEFAULT_BOLD
                }

                fun drawArrow(at: Offset, dir: Offset, color: Color) {
                    val arrowLen = (30f / zoom).coerceIn(16f, 30f)
                    val strokeW = (4f / zoom).coerceIn(2f, 4f)
                    val head = (8f / zoom).coerceIn(5f, 8f)

                    val end = Offset(at.x + dir.x * arrowLen, at.y + dir.y * arrowLen)
                    val back = Offset(end.x - dir.x * head, end.y - dir.y * head)
                    val perp = Offset(-dir.y, dir.x)
                    val left = Offset(back.x + perp.x * (head * 0.65f), back.y + perp.y * (head * 0.65f))
                    val right = Offset(back.x - perp.x * (head * 0.65f), back.y - perp.y * (head * 0.65f))

                    // flecha (línea)
                    drawLine(
                        color = color.copy(alpha = 0.95f),
                        start = at,
                        end = end,
                        strokeWidth = strokeW,
                        cap = StrokeCap.Round
                    )

                    // cabeza (triángulo)
                    val tri = Path().apply {
                        moveTo(end.x, end.y)
                        lineTo(left.x, left.y)
                        lineTo(right.x, right.y)
                        close()
                    }
                    drawPath(tri, color = color.copy(alpha = 0.95f))
                }

                unidades.forEach { u ->
                    val isRegreso = esRegreso(u.sentido)
                    val idx = u.idx_tramo.coerceIn(0, maxIdx)
                    val prog = u.progreso.coerceIn(0f, 1f)

                    // Igual idea que supervisor:
                    val base = if (isRegreso) (maxIdx - idx) else idx
                    val tOrden = if (isRegreso) {
                        (base.toFloat() - prog) / maxIdx.toFloat()
                    } else {
                        (base.toFloat() + prog) / maxIdx.toFloat()
                    }.coerceIn(0f, 1f)

                    val tDraw = tPathDesdeTOrdenCentralCiudad(tOrden)
                    val pCenter = pointOnPolyline(tDraw)

                    // Tangente del path (dirección “geométrica”)
                    val tan = tangentOnPolyline(tDraw)

                    // ✅ Correcto para tu path (Cd. Azteca -> Central):
                    // REGRESO = tan (va en el sentido natural del path)
                    // IDA = -tan (va en sentido contrario)
                    val travelDir = if (isRegreso) tan else Offset(-tan.x, -tan.y)


                    // Normal a la izquierda del sentido de viaje (para separar carriles)
                    val normal = Offset(-travelDir.y, travelDir.x)
                    val laneOffset = (18f / zoom).coerceIn(10f, 22f)

                    // Carril: IDA y REGRESO quedan en lados opuestos por invertir travelDir
                    val pLane = Offset(
                        x = pCenter.x + normal.x * laneOffset,
                        y = pCenter.y + normal.y * laneOffset
                    )

                    val estadoColor = colorPorEstado(u.estado_unidad)

                    // Tamaños casi constantes en pantalla
                    val r = (13f / zoom).coerceIn(8f, 13f)
                    val innerR = (5f / zoom).coerceIn(3f, 6f)
                    val ringW = (2.2f / zoom).coerceIn(1.4f, 2.2f)

                    // Marker base (estado)
                    drawCircle(color = estadoColor, radius = r, center = pLane)
                    drawCircle(color = Color.White, radius = innerR, center = pLane)

                    // DIFERENCIADOR DE SENTIDO:
                    // - IDA: anillo BLANCO
                    // - REGRESO: anillo NEGRO semitransparente + flecha inversa ya aplicada
                    val ringColor = if (isRegreso) Color.Black.copy(alpha = 0.55f) else Color.White.copy(alpha = 0.85f)
                    drawCircle(
                        color = ringColor,
                        radius = r + ringW,
                        center = pLane,
                        style = Stroke(width = ringW)
                    )

                    // Flecha de sentido (sobre el marker)
                    drawArrow(
                        at = pLane,
                        dir = travelDir,
                        color = if (isRegreso) Color(0xFF374151) else Color(0xFF111827)
                    )

                    // Texto id (centrado mejor)
                    paintUnit.textSize = (28f / zoom).coerceIn(14f, 28f)
                    val txt = u.id_unidad.toString()
                    val tw = paintUnit.measureText(txt)
                    drawContext.canvas.nativeCanvas.drawText(
                        txt,
                        pLane.x - (tw / 2f),
                        pLane.y - (18f / zoom),
                        paintUnit
                    )
                }
            }
        }

        // ====== HEADER COMPACTO ======
        Surface(
            modifier = Modifier
                .align(Alignment.TopCenter)
                .padding(top = 14.dp, start = 14.dp, end = 14.dp),
            color = Color(0xFF00A1D3),
            shape = RoundedCornerShape(22.dp),
            shadowElevation = 10.dp
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    color = Color.White.copy(alpha = 0.18f),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.DirectionsBus,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.padding(10.dp).size(22.dp)
                    )
                }

                Spacer(Modifier.width(12.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Mexibús",
                        color = Color.White,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Línea 1 · Central de Abastos – Ciudad Azteca",
                        color = Color.White.copy(alpha = 0.95f),
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Text(
                        text = "Zoom ${String.format("%.1f", zoom)}×",
                        color = Color.White.copy(alpha = 0.9f),
                        style = MaterialTheme.typography.bodySmall
                    )
                }

                FilledTonalIconButton(
                    onClick = { resetView() },
                    colors = IconButtonDefaults.filledTonalIconButtonColors(
                        containerColor = Color.White.copy(alpha = 0.20f),
                        contentColor = Color.White
                    )
                ) {
                    Icon(Icons.Default.CenterFocusStrong, contentDescription = "Centrar")
                }
            }
        }

        // ====== LEYENDA / HUD INFERIOR ======
        Surface(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(start = 14.dp, end = 14.dp, bottom = 14.dp)
                .navigationBarsPadding(),
            color = Color.White,
            shape = RoundedCornerShape(20.dp),
            shadowElevation = 10.dp
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    modifier = Modifier
                        .weight(1f)
                        .horizontalScroll(rememberScrollState()),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    LegendItem("En ruta", Color(0xFF9BE645))
                    Spacer(Modifier.width(12.dp))
                    LegendItem("En estación", Color(0xFFFFA500))
                    Spacer(Modifier.width(12.dp))
                    LegendItem("En cola", Color(0xFF0796C2))
                    Spacer(Modifier.width(12.dp))
                    LegendItem("Incidencia", Color(0xFFFF4444))
                    Spacer(Modifier.width(18.dp))

                    // === Dirección ===
                    DirectionItem("IDA", Icons.Default.ArrowForward)
                    Spacer(Modifier.width(10.dp))
                    DirectionItem("REGRESO", Icons.Default.ArrowBack)
                }

                Spacer(Modifier.width(12.dp))

                Surface(
                    color = Color(0xFFF3F4F6),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Text(
                        text = "Unidades: ${unidades.size}",
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                        color = Color(0xFF111827),
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        }
    }
}

/* =========================
   Helpers
   ========================= */

@Composable
private fun LegendItem(label: String, color: Color) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Surface(color = color, shape = RoundedCornerShape(50)) {
            Spacer(Modifier.size(10.dp))
        }
        Spacer(Modifier.width(8.dp))
        Text(label, style = MaterialTheme.typography.bodyMedium, color = Color(0xFF111827))
    }
}

@Composable
private fun DirectionItem(label: String, icon: androidx.compose.ui.graphics.vector.ImageVector) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Surface(
            color = Color(0xFFF3F4F6),
            shape = RoundedCornerShape(12.dp)
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(icon, contentDescription = null, tint = Color(0xFF111827), modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(6.dp))
                Text(label, style = MaterialTheme.typography.labelLarge, color = Color(0xFF111827))
            }
        }
    }
}

private fun ordenarCentralACiudad(estaciones: List<EstacionLinea>): List<EstacionLinea> {
    val iCentral = estaciones.indexOfFirst { it.nombre.contains("Central", ignoreCase = true) }
    val iCiudad = estaciones.indexOfFirst { it.nombre.contains("Ciudad", ignoreCase = true) }
    return if (iCentral != -1 && iCiudad != -1 && iCentral > iCiudad) estaciones.reversed() else estaciones
}

private fun esRegreso(sentido: String): Boolean {
    return sentido.equals("REGRESO", true) || sentido.equals("VUELTA", true)
}

private fun colorPorEstado(estado: String): Color {
    return when (estado.uppercase()) {
        "EN_RUTA" -> Color(0xFF9BE645)
        "EN_ESTACION" -> Color(0xFFFFA500)
        "EN_COLA" -> Color(0xFF0796C2)
        "INCIDENCIA" -> Color(0xFFFF4444)
        "FUERA_DE_SERVICIO" -> Color(0xFF9CA3AF)
        else -> Color(0xFF00A1D3)
    }
}

private fun androidx.compose.ui.graphics.drawscope.DrawScope.drawLineStrip(
    pts: List<Offset>,
    color: Color,
    stroke: Float,
    cap: StrokeCap
) {
    for (i in 0 until pts.size - 1) {
        drawLine(
            color = color,
            start = pts[i],
            end = pts[i + 1],
            strokeWidth = stroke,
            cap = cap
        )
    }
}

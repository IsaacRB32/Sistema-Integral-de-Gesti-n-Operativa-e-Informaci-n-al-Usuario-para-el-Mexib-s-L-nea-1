package com.isaac.usuario.ui.recorrido

import android.graphics.Paint
import android.graphics.Typeface
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CenterFocusStrong
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material3.FilledTonalIconButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.IconButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import com.isaac.usuario.data.model.UnidadMB
import kotlinx.coroutines.launch
import kotlin.math.abs
import kotlin.math.max

@Composable
fun MiniRecorridoLinea1(
    unidades: List<UnidadMB>,
    modifier: Modifier = Modifier
) {
    val scope = rememberCoroutineScope()

    // ====== Estilo base ======
    val bg = Color(0xFFF8FAFC)
    val border = Color(0xFFE5E7EB)
    val textPrimary = Color(0xFF111827)

    val lineOuter = Color(0xFFB7E28A)
    val lineInner = Color(0xFF8BC34A)

    // ====== Helpers de estado/sentido ======
    fun colorPorEstado(estado: String): Color = when (estado.trim().uppercase()) {
        "EN_RUTA" -> Color(0xFF8BC34A)
        "EN_ESTACION" -> Color(0xFFFFA000)
        "EN_COLA" -> Color(0xFF0288D1)
        "INCIDENCIA" -> Color(0xFFE53935)
        "FUERA_DE_SERVICIO" -> Color(0xFF9CA3AF)
        else -> Color(0xFF757575)
    }

    fun normalizaSentido(s: String?): String {
        val u = (s ?: "").trim().uppercase()
        return when (u) {
            "IDA" -> "IDA"
            "REGRESO" -> "REGRESO"
            "VUELTA" -> "REGRESO"
            else -> u
        }
    }

    fun esIncidencia(u: UnidadMB): Boolean =
        u.estado_unidad.trim().uppercase() == "INCIDENCIA"

    // Segmentos del recorrido (según estaciones)
    val segments = remember { max(1, estacionesLinea1.size - 1) }

    /**
     * Convierte idx_tramo/progreso a un t global 0..1
     * Manteniendo la lógica con la que ya te quedó el orden correcto:
     * - IDA se invierte
     * - REGRESO se deja igual
     */
    fun tFromUnidad(u: UnidadMB): Float {
        val sentido = normalizaSentido(u.sentido)
        val idx = u.idx_tramo.coerceIn(0, segments - 1)
        val prog = u.progreso.coerceIn(0f, 1f)
        val rawT = (idx.toFloat() + prog) / segments.toFloat()
        return if (sentido == "IDA") (1f - rawT) else rawT
    }

    // ====== Incidencias + navegación ======
    val incidencias = remember(unidades) { unidades.filter { esIncidencia(it) } }
    var incIdx by remember { mutableIntStateOf(0) }

    LaunchedEffect(incidencias.size) {
        incIdx = if (incidencias.isEmpty()) 0 else incIdx.coerceIn(0, incidencias.lastIndex)
    }

    // ====== “Zoom” por ventana (evita descalibración de pan/zoom) ======
    val zoomAnim = remember { Animatable(1f) }      // 1 = vista completa
    val centerTAnim = remember { Animatable(0.5f) } // centro del viewport (0..1)

    fun resetView() {
        scope.launch {
            launch { zoomAnim.animateTo(1f, tween(220)) }
            launch { centerTAnim.animateTo(0.5f, tween(220)) }
        }
    }

    fun focusOnIncidencia(index: Int) {
        if (incidencias.isEmpty()) return
        val idx = index.coerceIn(0, incidencias.lastIndex)
        val targetT = tFromUnidad(incidencias[idx]).coerceIn(0f, 1f)

        // Zoom moderado para mini-mapa (no debe “reventar”)
        val targetZoom = 5.0f

        scope.launch {
            launch { zoomAnim.animateTo(targetZoom, tween(260)) }
            launch { centerTAnim.animateTo(targetT, tween(260)) }
        }
    }

    // Auto-focus cuando hay incidencias; si desaparecen, regresa suave
    LaunchedEffect(incidencias, incIdx) {
        if (incidencias.isEmpty()) {
            resetView()
        } else {
            focusOnIncidencia(incIdx)
        }
    }

    // Tamaño del Canvas (por si luego quieres lógica extra)
    var canvasSize by remember { mutableStateOf(IntSize.Zero) }

    // ====== UI contenedor ======
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .defaultMinSize(minHeight = 220.dp)
            .then(modifier)
            .clip(RoundedCornerShape(22.dp))
            .background(bg)
            .border(1.dp, border, RoundedCornerShape(22.dp))
    ) {
        Canvas(
            modifier = Modifier
                .fillMaxSize()
                .onSizeChanged { canvasSize = it }
        ) {
            val w = size.width
            val h = size.height

            // Reservas internas
            val padX = 14.dp.toPx()
            val padTop = 14.dp.toPx()

            // Reserva inferior para HUD (botones + chips)
            val hudH = 72.dp.toPx()

            val topY = padTop + 10.dp.toPx()
            val bottomY = (h - padTop - hudH).coerceAtLeast(topY + 1f)

            // Layout 3 columnas: IDA | estaciones | REGRESO
            val trackX = w * 0.50f
            val laneLeftX = (w * 0.25f).coerceIn(padX + 22.dp.toPx(), trackX - 22.dp.toPx())
            val laneRightX = (w * 0.75f).coerceIn(trackX + 22.dp.toPx(), w - padX - 22.dp.toPx())

            // ====== Viewport por ventana en t ======
            val zoom = zoomAnim.value.coerceIn(1f, 5.0f)
            val centerT = centerTAnim.value.coerceIn(0f, 1f)

            val window = (1f / zoom).coerceIn(0.15f, 1f)
            var tMin = centerT - window / 2f
            var tMax = centerT + window / 2f

            // Clamp ventana dentro de 0..1 manteniendo tamaño
            if (tMin < 0f) {
                tMax -= tMin
                tMin = 0f
            }
            if (tMax > 1f) {
                val over = tMax - 1f
                tMin = (tMin - over).coerceAtLeast(0f)
                tMax = 1f
            }

            fun yFromT(t: Float): Float {
                val denom = (tMax - tMin).coerceAtLeast(0.0001f)
                val local = ((t - tMin) / denom).coerceIn(0f, 1f)
                return bottomY - local * (bottomY - topY)
            }

            // ====== Sizes ======
            val trackOuter = 10.dp.toPx()
            val trackInner = 6.dp.toPx()

            val stationR = 4.dp.toPx()
            val unitR = 6.dp.toPx()

            // ====== Paints ======
            val paintStation = Paint().apply {
                isAntiAlias = true
                textSize = 11.dp.toPx()
                typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
                color = android.graphics.Color.rgb(17, 24, 39)
            }
            val paintDir = Paint().apply {
                isAntiAlias = true
                textSize = 12.dp.toPx()
                typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
                color = android.graphics.Color.rgb(55, 65, 81) // gris
            }
            val paintUnit = Paint().apply {
                isAntiAlias = true
                textSize = 10.dp.toPx()
                typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
                color = android.graphics.Color.rgb(17, 24, 39)
            }

            // ====== Guías de carriles (suaves) ======
            drawLine(
                color = Color(0xFF94A3B8).copy(alpha = 0.18f),
                start = Offset(laneLeftX, bottomY),
                end = Offset(laneLeftX, topY),
                strokeWidth = 3.dp.toPx(),
                cap = StrokeCap.Round
            )
            drawLine(
                color = Color(0xFF94A3B8).copy(alpha = 0.18f),
                start = Offset(laneRightX, bottomY),
                end = Offset(laneRightX, topY),
                strokeWidth = 3.dp.toPx(),
                cap = StrokeCap.Round
            )

            // ====== Track (columna central) ======
            // sombra
            drawLine(
                color = Color.Black.copy(alpha = 0.06f),
                start = Offset(trackX + 1.2f, bottomY + 1.2f),
                end = Offset(trackX + 1.2f, topY + 1.2f),
                strokeWidth = trackOuter,
                cap = StrokeCap.Round
            )
            // outer
            drawLine(
                color = lineOuter,
                start = Offset(trackX, bottomY),
                end = Offset(trackX, topY),
                strokeWidth = trackOuter,
                cap = StrokeCap.Round
            )
            // inner
            drawLine(
                color = lineInner,
                start = Offset(trackX, bottomY),
                end = Offset(trackX, topY),
                strokeWidth = trackInner,
                cap = StrokeCap.Round
            )

            // ====== Labels “IDA / REGRESO” (arriba) ======
            drawIntoCanvas { c ->
                c.nativeCanvas.drawText("IDA", laneLeftX - 12.dp.toPx(), topY - 6.dp.toPx(), paintDir)
                c.nativeCanvas.drawText("REGRESO", laneRightX - 22.dp.toPx(), topY - 6.dp.toPx(), paintDir)
            }

            // ====== Estaciones (solo las que caen en la ventana) ======
            val estaciones = estacionesLinea1
            val lastIdx = estaciones.lastIndex

            val showAllStations = zoom >= 1.4f   // ajusta el umbral a tu gusto (1.4–1.8 suele ir bien)

            val labelEvery = when {
                showAllStations -> 1
                zoom >= 1.9f -> 2
                zoom >= 1.4f -> 3
                else -> 4
            }


            estaciones.forEachIndexed { i, est ->
                val t = est.position.coerceIn(0f, 1f)
                // Si no entra en viewport, no dibujar (reduce “ruido”)
                if (t < tMin - 0.002f || t > tMax + 0.002f) return@forEachIndexed

                val y = yFromT(t)
                val p = Offset(trackX, y)

                // Nodo estación
                drawCircle(
                    color = Color.White,
                    radius = stationR + 2.dp.toPx(),
                    center = p
                )
                drawCircle(
                    color = Color(0xFF111827),
                    radius = stationR,
                    center = p,
                    style = Stroke(width = 2.dp.toPx())
                )

                val showLabel = showAllStations || (i == 0) || (i == lastIdx) || (i % labelEvery == 0)

                if (showLabel) {
                    val txt = est.nombre
                    val tw = paintStation.measureText(txt)

                    // En mini mapa: etiqueta a la derecha del track, pero sin invadir carril derecho
                    val xIdeal = trackX + 12.dp.toPx()
                    val xMax = (laneRightX - 10.dp.toPx() - tw).coerceAtLeast(xIdeal)
                    val x = xIdeal.coerceIn(padX, (w - padX - tw).coerceAtLeast(padX))

                    drawIntoCanvas { cnv ->
                        cnv.nativeCanvas.drawText(
                            txt,
                            minOf(x, xMax),
                            y + (paintStation.textSize / 3f),
                            paintStation
                        )
                    }
                }
            }

            // ====== Unidades ======
            unidades.forEach { u ->
                val sentido = normalizaSentido(u.sentido)
                val t = tFromUnidad(u).coerceIn(0f, 1f)

                // Si no entra en viewport, no dibujar
                if (t < tMin - 0.02f || t > tMax + 0.02f) return@forEach

                val y = yFromT(t)

                val laneX = when (sentido) {
                    "IDA" -> laneLeftX
                    "REGRESO" -> laneRightX
                    else -> trackX
                }

                // jitter muy leve para que no se encimen (sin “chuequear”)
                val jy = (((u.id_unidad % 3) - 1) * 4.dp.toPx())
                val p = Offset(laneX, (y + jy).coerceIn(topY, bottomY))

                val c = colorPorEstado(u.estado_unidad)

                // Highlight de incidencia (aro)
                if (esIncidencia(u)) {
                    drawCircle(
                        color = c.copy(alpha = 0.22f),
                        radius = unitR + 10.dp.toPx(),
                        center = p
                    )
                }

                // Sombra
                drawCircle(
                    color = Color.Black.copy(alpha = 0.10f),
                    radius = unitR + 2.dp.toPx(),
                    center = Offset(p.x + 1.1f, p.y + 1.1f)
                )

                // Punto principal
                drawCircle(color = Color.White, radius = unitR + 2.5f, center = p)
                drawCircle(color = c, radius = unitR, center = p)

                // ===== Label ID unidad =====
                // REGLA:
                // 1) IDA -> número a la IZQUIERDA
                // 2) REGRESO -> número a la DERECHA
                val txt = u.id_unidad.toString()
                val tw = paintUnit.measureText(txt)

                val pillPadX = 6.dp.toPx()
                val pillPadY = 3.dp.toPx()
                val pillW = tw + pillPadX * 2
                val pillH = paintUnit.textSize + pillPadY * 2

                val gap = 8.dp.toPx()

                val pillLeft = if (sentido == "IDA") {
                    // izquierda: el pill termina antes del punto
                    (p.x - gap - pillW).coerceAtLeast(padX)
                } else {
                    // derecha
                    (p.x + gap).coerceAtMost(w - padX - pillW)
                }

                val pillTop = (p.y - pillH / 2f).coerceIn(topY, bottomY - pillH)

                drawRoundRect(
                    color = Color.White.copy(alpha = 0.94f),
                    topLeft = Offset(pillLeft, pillTop),
                    size = Size(pillW, pillH),
                    cornerRadius = CornerRadius(pillH / 2f, pillH / 2f)
                )
                drawRoundRect(
                    color = Color(0xFFCBD5E1),
                    topLeft = Offset(pillLeft, pillTop),
                    size = Size(pillW, pillH),
                    cornerRadius = CornerRadius(pillH / 2f, pillH / 2f),
                    style = Stroke(width = 1.dp.toPx())
                )

                drawIntoCanvas { canvas ->
                    canvas.nativeCanvas.drawText(
                        txt,
                        pillLeft + pillPadX,
                        pillTop + pillPadY + paintUnit.textSize,
                        paintUnit
                    )
                }
            }
        }

        // ===== HUD inferior: incidencias + centrar + conteo =====
        Row(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .padding(horizontal = 10.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (incidencias.isNotEmpty()) {
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = Color.White.copy(alpha = 0.92f),
                    tonalElevation = 2.dp,
                    shadowElevation = 6.dp,
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE5E7EB))
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(
                            onClick = {
                                incIdx = if (incIdx <= 0) incidencias.lastIndex else incIdx - 1
                                focusOnIncidencia(incIdx)
                            },
                            modifier = Modifier.size(34.dp)
                        ) {
                            Icon(Icons.Default.ChevronLeft, contentDescription = "Anterior")
                        }

                        Text(
                            text = "Incidencia ${incIdx + 1}/${incidencias.size}",
                            color = textPrimary,
                            style = MaterialTheme.typography.labelLarge
                        )

                        IconButton(
                            onClick = {
                                incIdx = if (incIdx >= incidencias.lastIndex) 0 else incIdx + 1
                                focusOnIncidencia(incIdx)
                            },
                            modifier = Modifier.size(34.dp)
                        ) {
                            Icon(Icons.Default.ChevronRight, contentDescription = "Siguiente")
                        }

                        Spacer(Modifier.width(6.dp))

                        FilledTonalIconButton(
                            onClick = { focusOnIncidencia(incIdx) },
                            modifier = Modifier.size(36.dp),
                            colors = IconButtonDefaults.filledTonalIconButtonColors(
                                containerColor = Color(0xFFF3F4F6),
                                contentColor = Color(0xFF111827)
                            )
                        ) {
                            Icon(Icons.Default.CenterFocusStrong, contentDescription = "Centrar incidencia")
                        }
                    }
                }

                Spacer(Modifier.width(10.dp))
            } else {
                Spacer(Modifier.weight(1f))
            }

            Spacer(Modifier.weight(1f))

            Surface(
                shape = RoundedCornerShape(16.dp),
                color = Color.White.copy(alpha = 0.92f),
                tonalElevation = 2.dp,
                shadowElevation = 6.dp,
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE5E7EB))
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Unidades: ${unidades.size}",
                        color = textPrimary,
                        style = MaterialTheme.typography.labelLarge
                    )
                    Spacer(Modifier.width(8.dp))
                    FilledTonalIconButton(
                        onClick = { resetView() },
                        modifier = Modifier.size(34.dp),
                        colors = IconButtonDefaults.filledTonalIconButtonColors(
                            containerColor = Color(0xFFF3F4F6),
                            contentColor = Color(0xFF111827)
                        )
                    ) {
                        Icon(Icons.Default.CenterFocusStrong, contentDescription = "Reset")
                    }
                }
            }
        }
    }
}

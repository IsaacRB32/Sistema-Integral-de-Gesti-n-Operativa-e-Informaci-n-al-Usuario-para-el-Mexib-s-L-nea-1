package com.isaac.usuario.ui.recorrido

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import com.isaac.usuario.data.model.UnidadMB

@Composable
fun MiniRecorridoLinea1(
    estaciones: List<EstacionLineaFull> = estacionesLinea1Full,
    unidades: List<UnidadMB>,
    modifier: Modifier = Modifier
) {
    val density = LocalDensity.current
    val mapHeightPx = with(density) { 280.dp.toPx() }

    // 1. ZOOM INICIAL
    var scale by remember { mutableFloatStateOf(2.3f) }

    // 2. OFFSET INICIAL
    var offset by remember {
        mutableStateOf(Offset(0f, -mapHeightPx * 0.02f))
    }

    // Ruta Recta
    val pathRecto = remember {
        List(estaciones.size) { i ->
            val t = i.toFloat() / (estaciones.size - 1)
            Offset(0.7f, 0.9f - 0.8f * t)
        }
    }

    Canvas(
        modifier = modifier
            .fillMaxWidth()
            .height(280.dp)
            .clip(RoundedCornerShape(24.dp))
            .background(Color.White)
            .pointerInput(Unit) {
                detectTransformGestures { _, pan, zoom, _ ->
                    scale = (scale * zoom).coerceIn(1f, 4f)
                    if (scale < 1.1f) {
                        scale = 2.3f
                        offset = Offset(0f, -mapHeightPx * 0.62f)
                    } else {
                        offset += pan
                    }
                }
            }
    ) {
        val w = size.width
        val h = size.height
        val baseScale = 0.85f
        val center = Offset(w / 2f, h / 2f)

        fun map(p: Offset): Offset {
            return Offset(p.x * w, p.y * h)
        }

        withTransform({
            translate(center.x + offset.x, center.y + offset.y)
            scale(scale * baseScale)
            translate(-center.x, -center.y)
        }) {

            // --- 1. LÍNEAS ---
            val strokeW = 16f
            for (i in 0 until pathRecto.size - 1) {
                val start = map(pathRecto[i])
                val end = map(pathRecto[i + 1])

                drawLine(
                    color = ColorOrdinaria,
                    start = start,
                    end = end,
                    strokeWidth = strokeW,
                    cap = androidx.compose.ui.graphics.StrokeCap.Round
                )
            }

            // --- 2. ESTACIONES ---
            var totalLength = 0f
            val segmentLengths = FloatArray(pathRecto.size - 1)
            for (i in 0 until pathRecto.size - 1) {
                val dx = pathRecto[i+1].x - pathRecto[i].x
                val dy = pathRecto[i+1].y - pathRecto[i].y
                val dist = kotlin.math.sqrt(dx * dx + dy * dy)
                segmentLengths[i] = dist
                totalLength += dist
            }

            estaciones.forEachIndexed { index, est ->
                val tGlobal = index.toFloat() / (estaciones.size - 1)
                val distanceTarget = tGlobal * totalLength
                var currentDist = 0f
                var segmentIndex = 0
                var tSegment = 0f

                for (i in segmentLengths.indices) {
                    if (currentDist + segmentLengths[i] >= distanceTarget) {
                        segmentIndex = i
                        val distInSegment = distanceTarget - currentDist
                        tSegment = distInSegment / segmentLengths[i]
                        break
                    }
                    currentDist += segmentLengths[i]
                }
                if (tGlobal == 1f) {
                    segmentIndex = segmentLengths.lastIndex
                    tSegment = 1f
                }

                val p1 = pathRecto[segmentIndex]
                val p2 = pathRecto[segmentIndex + 1]
                val rawPos = Offset(
                    p1.x + (p2.x - p1.x) * tSegment,
                    p1.y + (p2.y - p1.y) * tSegment
                )
                val pos = map(rawPos)

                drawCircle(Color.DarkGray, radius = 10f, center = pos)
                drawCircle(Color.White, radius = 5f, center = pos)

                drawContext.canvas.nativeCanvas.drawText(
                    est.nombre,
                    pos.x + 20f,
                    pos.y + 8f,
                    android.graphics.Paint().apply {
                        textSize = 34f / (scale * 0.7f)
                        isAntiAlias = true
                        color = android.graphics.Color.DKGRAY
                        typeface = android.graphics.Typeface.create(android.graphics.Typeface.DEFAULT, android.graphics.Typeface.BOLD)
                    }
                )
            }

            // --- 3. UNIDADES ---
            unidades.forEach { unidad ->
                if (unidad.idx_tramo < 0 || unidad.idx_tramo >= pathRecto.size - 1) return@forEach
                val p1 = pathRecto[unidad.idx_tramo]
                val p2 = pathRecto[unidad.idx_tramo + 1]
                val rawPos = Offset(
                    p1.x + (p2.x - p1.x) * unidad.progreso,
                    p1.y + (p2.y - p1.y) * unidad.progreso
                )
                val pos = map(rawPos)

                when (unidad.estado_unidad) {
                    "INCIDENCIA" -> {
                        drawCircle(Color.Red, radius = 12f, center = pos)
                        drawCircle(Color.White, radius = 4f, center = pos)
                    }

                    /*El dibujo de las unidades es para realizar las pruebas de funcionamiento.
                    En el funcionamiento final no se deben mostrar las unidades.
                    */
                    /*
                    // UNIDADES EN RUTA O EN COLA
                    "EN_RUTA", "EN_COLA" -> {
                        drawCircle(
                            color = Color(0xFF00a1d3),
                            radius = 10f,
                            center = pos
                        )
                        drawCircle(
                            color = Color(0xFF00a1d3),
                            radius = 5f,
                            center = pos
                        )
                    }
                    */
                }
            }
        }

        //Esta parte se utiliza para ver en el mapa cuántas unidades hay en recorrido
        /*
        drawContext.canvas.nativeCanvas.drawText(
            "Unidades: ${unidades.size}",
            20f,
            40f,
            android.graphics.Paint().apply {
                textSize = 40f
                color = android.graphics.Color.RED
            }
        )
        */

        // --- CAPA 2: LEYENDA FIJA (HUD) ---
        val legendMargin = 20f
        val legendBoxW = 190f
        val legendBoxH = 60f

        // Fondo semitransparente
        drawRoundRect(
            color = Color.White.copy(alpha = 0.9f),
            topLeft = Offset(legendMargin, legendMargin),
            size = Size(legendBoxW, legendBoxH),
            cornerRadius = CornerRadius(10f, 10f)
        )

        // Punto Rojo
        drawCircle(
            color = Color.Red,
            radius = 10f,
            center = Offset(legendMargin + 25f, legendMargin + 30f)
        )
        drawCircle(
            color = Color.White,
            radius = 3f,
            center = Offset(legendMargin + 25f, legendMargin + 30f)
        )

        // Texto explicativo
        drawContext.canvas.nativeCanvas.drawText(
            "Incidente",
            legendMargin + 50f,
            legendMargin + 40f,
            android.graphics.Paint().apply {
                textSize = 32f
                color = android.graphics.Color.DKGRAY
                isAntiAlias = true
                typeface = android.graphics.Typeface.create(android.graphics.Typeface.DEFAULT, android.graphics.Typeface.BOLD)
            }
        )
    }
}
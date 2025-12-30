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
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp

@Composable
fun MiniRecorridoLinea1(
    estaciones: List<EstacionLineaFull> = estacionesLinea1Full,
    modifier: Modifier = Modifier
) {
    // Obtenemos la altura en pixeles para calcular el centro exacto
    val density = LocalDensity.current
    val mapHeightPx = with(density) { 280.dp.toPx() }

    // 1. ZOOM: Mantenemos el zoom mediano que te gustó
    var scale by remember { mutableFloatStateOf(2.3f) }

    // 2. OFFSET (POSICIÓN): AQUÍ ESTÁ LA MAGIA
    // Ciudad Azteca está en la posición Y=0.9 (90% abajo).
    // Queremos que se vea en la posición Y=0.8 (80% de la pantalla, cerca del borde inferior).
    // Fórmula: Desplazamiento = (PosiciónDeseada - Centro) - (PosiciónOriginal - Centro) * Zoom
    // Cálculo: (0.8 - 0.5) - (0.9 - 0.5) * 2.3  =>  0.3 - (0.4 * 2.3)  =>  0.3 - 0.92 = -0.62
    // Resultado: Tenemos que subir el mapa un 62% de su altura.
    var offset by remember {
        mutableStateOf(Offset(0f, -mapHeightPx * 0.02f))
    }

    val linea1PathFull = listOf(
        Offset(0.55f, 0.75f),
        Offset(0.55f, 0.40f),
        Offset(0.25f, 0.20f),
        Offset(0.60f, 0.05f)
    )

    Canvas(
        modifier = modifier
            .fillMaxWidth()
            .height(280.dp)
            .clip(RoundedCornerShape(24.dp))
            .background(Color.White)
            .pointerInput(Unit) {
                detectTransformGestures { _, pan, zoom, _ ->
                    scale = (scale * zoom).coerceIn(1f, 4f)

                    // Si el usuario aleja mucho el mapa (zoom out), regresamos a la posición inicial (Azteca)
                    if (scale < 1.1f) {
                        scale = 2.3f // Reset al zoom original
                        offset = Offset(0f, -mapHeightPx * 0.62f) // Reset a la posición original
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

            // --- 1. LÍNEAS RECTAS ---
            val strokeW = 16f
            val separation = 9f

            for (i in 0 until linea1PathFull.size - 1) {
                val start = map(linea1PathFull[i])
                val end = map(linea1PathFull[i + 1])

                // Línea Express (Izquierda)
                drawLine(
                    color = ColorExpress,
                    start = Offset(start.x - separation, start.y),
                    end = Offset(end.x - separation, end.y),
                    strokeWidth = strokeW,
                    cap = androidx.compose.ui.graphics.StrokeCap.Round
                )

                // Línea Ordinaria (Derecha)
                drawLine(
                    color = ColorOrdinaria,
                    start = Offset(start.x + separation, start.y),
                    end = Offset(end.x + separation, end.y),
                    strokeWidth = strokeW,
                    cap = androidx.compose.ui.graphics.StrokeCap.Round
                )
            }

            // --- 2. ESTACIONES ---
            var totalLength = 0f
            val segmentLengths = FloatArray(linea1PathFull.size - 1)
            for (i in 0 until linea1PathFull.size - 1) {
                val dist = (linea1PathFull[i+1] - linea1PathFull[i]).getDistance()
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

                val p1 = linea1PathFull[segmentIndex]
                val p2 = linea1PathFull[segmentIndex + 1]

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
                        // Texto responsivo al zoom
                        textSize = 34f / (scale * 0.7f)
                        isAntiAlias = true
                        color = android.graphics.Color.DKGRAY
                        typeface = android.graphics.Typeface.create(android.graphics.Typeface.DEFAULT, android.graphics.Typeface.BOLD)
                    }
                )
            }
        }
    }
}
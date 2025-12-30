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
import androidx.compose.ui.unit.dp

@Composable
fun MiniRecorridoLinea1(
    estaciones: List<EstacionLinea>,
    modifier: Modifier = Modifier
) {
    var scale by remember { mutableStateOf(1f) }
    var offset by remember { mutableStateOf(Offset.Zero) }

    Canvas(
        modifier = modifier
            .fillMaxWidth()
            .height(280.dp)
            .clip(RoundedCornerShape(24.dp))
            .background(Color.White)
            .pointerInput(Unit) {
                detectTransformGestures { centroid, pan, zoom, _ ->
                    scale = (scale * zoom).coerceIn(1f, 3f)
                    offset += pan
                }
            }
    ) {
        val w = size.width
        val h = size.height

        val baseScale = 0.85f
        val center = Offset(w / 2f, h / 2f)

        val verticalStretch = 1.8f  //+1 cm visual (ajustable)

        fun map(p: Offset): Offset {
            val yCentered = (p.y - 0.5f) * verticalStretch + 0.5f
            return Offset(
                p.x * w,
                yCentered * h
            )
        }

        withTransform({
            translate(center.x + offset.x, center.y + offset.y)
            scale(scale * baseScale)
            translate(-center.x, -center.y)
        }) {

            // DIBUJO DE LA RUTA
            for (i in 0 until linea1Path.size - 1) {
                drawLine(
                    color = Color(0xFF9BE645),
                    start = map(linea1Path[i]),
                    end = map(linea1Path[i + 1]),
                    strokeWidth = 20f
                )
            }

            // ESTACIONES
            estaciones.forEachIndexed { index, est ->
                val tGlobal = index.toFloat() / (estaciones.size - 1)
                val idx = tGlobal * (linea1Path.size - 1)
                val i = idx.toInt().coerceAtMost(linea1Path.size - 2)
                val t = idx - i

                val p1 = linea1Path[i]
                val p2 = linea1Path[i + 1]

                val interp = Offset(
                    p1.x + (p2.x - p1.x) * t,
                    p1.y + (p2.y - p1.y) * t
                )

                val pos = map(interp)

                drawCircle(
                    color = Color.DarkGray,
                    radius = 12f,
                    center = pos
                )

                drawContext.canvas.nativeCanvas.drawText(
                    est.nombre,
                    pos.x + 18f,
                    pos.y + 10f,
                    android.graphics.Paint().apply {
                        textSize = 32f
                        isAntiAlias = true
                        color = android.graphics.Color.DKGRAY
                    }
                )
            }
        }
    }
}
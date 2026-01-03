package com.isaac.usuario.ui.recorrido

import android.graphics.Paint
import android.graphics.Typeface
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import com.isaac.usuario.data.model.UnidadMB
import kotlin.math.max

@Composable
fun MiniRecorridoLinea1(
    unidades: List<UnidadMB>,
    modifier: Modifier = Modifier
) {
    val density = LocalDensity.current

    val bg = Color(0xFFF8FAFC)          // fondo suave
    val border = Color(0xFFE5E7EB)      // borde sutil
    val textPrimary = Color(0xFF111827)
    val textSecondary = Color(0xFF6B7280)

    val lineOuter = Color(0xFFB7E28A)   // verde claro
    val lineInner = Color(0xFF8BC34A)   // verde fuerte

    // Estados (coinciden con tu backend)
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

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .defaultMinSize(minHeight = 240.dp) // evita Canvas 0x0
            .then(modifier)
            .clip(RoundedCornerShape(22.dp))
            .background(bg)
            .border(1.dp, border, RoundedCornerShape(22.dp))
    ) {
        // ===== CANVAS =====
        androidx.compose.foundation.Canvas(
            modifier = Modifier
                .matchParentSize()
                .padding(horizontal = 16.dp, vertical = 14.dp)
        ) {
            val w = size.width
            val h = size.height

            // Reservas internas (para que no se pegue a bordes)
            val topY = h * 0.06f
            val bottomY = h * 0.88f

            // Track centrado para permitir etiquetas alternadas
            val trackX = w * 0.50f

            val trackStrokeOuter = with(density) { 12.dp.toPx() }
            val trackStrokeInner = with(density) { 7.dp.toPx() }

            val stationR = with(density) { 5.dp.toPx() }
            val unitR = with(density) { 8.dp.toPx() }
            val laneDx = max(with(density) { 12.dp.toPx() }, w * 0.05f)

            // Línea (con “sombrilla” suave)
            drawLine(
                color = Color.Black.copy(alpha = 0.06f),
                start = Offset(trackX + 1.2f, bottomY + 1.2f),
                end = Offset(trackX + 1.2f, topY + 1.2f),
                strokeWidth = trackStrokeOuter,
                cap = androidx.compose.ui.graphics.StrokeCap.Round
            )
            drawLine(
                color = lineOuter,
                start = Offset(trackX, bottomY),
                end = Offset(trackX, topY),
                strokeWidth = trackStrokeOuter,
                cap = androidx.compose.ui.graphics.StrokeCap.Round
            )
            drawLine(
                color = lineInner,
                start = Offset(trackX, bottomY),
                end = Offset(trackX, topY),
                strokeWidth = trackStrokeInner,
                cap = androidx.compose.ui.graphics.StrokeCap.Round
            )

            // Transformación estación -> Y
            fun yFromPosition(pos: Float): Float {
                val p = pos.coerceIn(0f, 1f)
                return bottomY - p * (bottomY - topY)
            }

            // Paints
            val paintStation = Paint().apply {
                isAntiAlias = true
                textSize = with(density) { 11.dp.toPx() }
                typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
                color = android.graphics.Color.rgb(17, 24, 39) // #111827
            }
            val paintUnit = Paint().apply {
                isAntiAlias = true
                textSize = with(density) { 10.dp.toPx() }
                typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
                color = android.graphics.Color.rgb(17, 24, 39)
            }

            // Mostrar menos etiquetas para no saturar (con 18 estaciones)
            val estaciones = estacionesLinea1
            val lastIdx = estaciones.lastIndex
            val labelEvery = if (estaciones.size >= 16) 2 else 1

            // Estaciones
            estaciones.forEachIndexed { i, est ->
                val y = yFromPosition(est.position)

                // Punto estación (anillo)
                drawCircle(
                    color = Color.White,
                    radius = stationR + with(density) { 2.dp.toPx() },
                    center = Offset(trackX, y)
                )
                drawCircle(
                    color = Color(0xFF111827),
                    radius = stationR,
                    center = Offset(trackX, y),
                    style = Stroke(width = with(density) { 2.dp.toPx() })
                )

                val showLabel = (i == 0) || (i == lastIdx) || (i % labelEvery == 0)
                if (showLabel) {
                    val txt = est.nombre
                    val tw = paintStation.measureText(txt)

                    // Alternar izquierda / derecha para legibilidad
                    val preferRight = (i % 2 == 0)
                    val pad = with(density) { 12.dp.toPx() }

                    var x = if (preferRight) trackX + with(density) { 14.dp.toPx() }
                    else trackX - with(density) { 14.dp.toPx() } - tw

                    // Clamp a pantalla
                    x = x.coerceIn(pad, w - pad - tw)

                    drawIntoCanvas { c ->
                        c.nativeCanvas.drawText(
                            txt,
                            x,
                            y + (paintStation.textSize / 3f),
                            paintStation
                        )
                    }
                }
            }

            // Unidades: idx_tramo/progreso -> t global (0..1)
            val segments = max(1, estaciones.size - 1)

            fun yFromT(t: Float): Float {
                val tt = t.coerceIn(0f, 1f)
                return bottomY - tt * (bottomY - topY)
            }

            unidades.forEach { u ->
                val sentido = normalizaSentido(u.sentido)

                val idx = u.idx_tramo.coerceIn(0, segments - 1)
                val prog = u.progreso.coerceIn(0f, 1f)
                val rawT = (idx.toFloat() + prog) / segments.toFloat()

                // CLAVE: para que coincida con servidor/supervisor:
                // - IDA se invierte
                // - REGRESO se deja igual
                val t = if (sentido == "IDA") (1f - rawT) else rawT

                val baseX = when (sentido) {
                    "IDA" -> trackX - laneDx
                    "REGRESO" -> trackX + laneDx
                    else -> trackX
                }

                // jitter leve para que no se encimen si van pegadas
                val jitter = (((u.id_unidad % 3) - 1) * with(density) { 4.dp.toPx() })
                val x = (baseX + jitter).coerceIn(with(density) { 10.dp.toPx() }, w - with(density) { 10.dp.toPx() })
                val y = yFromT(t)

                val c = colorPorEstado(u.estado_unidad)

                // sombra suave
                drawCircle(
                    color = Color.Black.copy(alpha = 0.10f),
                    radius = unitR + with(density) { 2.dp.toPx() },
                    center = Offset(x + 1.2f, y + 1.2f)
                )

                // punto con borde blanco
                drawCircle(color = Color.White, radius = unitR + with(density) { 3.dp.toPx() }, center = Offset(x, y))
                drawCircle(color = c, radius = unitR, center = Offset(x, y))

                // etiqueta tipo “pill”
                val txt = u.id_unidad.toString()
                val tw = paintUnit.measureText(txt)
                val pillPadX = with(density) { 6.dp.toPx() }
                val pillPadY = with(density) { 3.dp.toPx() }
                val pillW = tw + pillPadX * 2
                val pillH = paintUnit.textSize + pillPadY * 2

                val pillTop = (y - unitR - pillH - with(density) { 6.dp.toPx() }).coerceAtLeast(with(density) { 2.dp.toPx() })
                val pillLeft = (x - pillW / 2f).coerceIn(0f, w - pillW)

                drawRoundRect(
                    color = Color.White.copy(alpha = 0.92f),
                    topLeft = Offset(pillLeft, pillTop),
                    size = Size(pillW, pillH),
                    cornerRadius = CornerRadius(pillH / 2f, pillH / 2f)
                )
                drawRoundRect(
                    color = Color(0xFFCBD5E1),
                    topLeft = Offset(pillLeft, pillTop),
                    size = Size(pillW, pillH),
                    cornerRadius = CornerRadius(pillH / 2f, pillH / 2f),
                    style = Stroke(width = with(density) { 1.dp.toPx() })
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


        // ===== CHIP conteo =====
        Surface(
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(end = 12.dp, bottom = 10.dp),
            shape = RoundedCornerShape(14.dp),
            color = Color.White.copy(alpha = 0.92f),
            tonalElevation = 2.dp,
            shadowElevation = 6.dp,
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE5E7EB))
        ) {
            Text(
                text = "Unidades: ${unidades.size}",
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                color = textPrimary
            )
        }
    }
}

@Composable
private fun LegendDot(color: Color) {
    Box(
        modifier = Modifier
            .padding(end = 6.dp)
            .size(10.dp)
            .clip(CircleShape)
            .background(color)
            .border(1.dp, Color.White, CircleShape)
    )
}

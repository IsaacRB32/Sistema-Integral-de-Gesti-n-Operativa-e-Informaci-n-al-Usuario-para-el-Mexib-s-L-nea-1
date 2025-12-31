package com.isaac.usuario.ui.recorrido

import android.graphics.BitmapFactory
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
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import com.isaac.usuario.R

// --- DEFINICIÓN DE DATOS ---

data class EstacionLineaFull(val nombre: String)

// 2. Colores Oficiales
val ColorExpress = Color(0xFF387008)
val ColorOrdinaria = Color(0xFF9BE645)
val ColorLeyendaFondo = Color(0xFF00a1d3)

// 3. LA RUTA TRAZADA (Tu versión modificada)
val linea1PathFull = listOf(
    Offset(0.55f, 0.75f), // Inicio: Cd. Azteca (Abajo)
    Offset(0.55f, 0.40f), // Recto
    Offset(0.25f, 0.20f), // Diagonal Izq
    Offset(0.60f, 0.05f)  // Diagonal Der (Arriba)
)

// 4. LISTA DE ESTACIONES
val estacionesLinea1Full = listOf(
    EstacionLineaFull("Cd. Azteca"),
    EstacionLineaFull("Quinto Sol"),
    EstacionLineaFull("Josefa Ortiz"),
    EstacionLineaFull("Industrial"),
    EstacionLineaFull("UNITEC"),
    EstacionLineaFull("Alfredo Torres"),
    EstacionLineaFull("Zodiaco"),
    EstacionLineaFull("Adolfo L. Mateos"),
    EstacionLineaFull("Vocacional 3"),
    EstacionLineaFull("Valle de Ecatepec"),
    EstacionLineaFull("Las Américas"),
    EstacionLineaFull("1º de Mayo"),
    EstacionLineaFull("Hospital"),
    EstacionLineaFull("Aquiles Serdán"),
    EstacionLineaFull("Jardines de Morelos"),
    EstacionLineaFull("Palomas"),
    EstacionLineaFull("19 de Septiembre"),
    EstacionLineaFull("Central de Abastos")
)

// --- COMPONENTE VISUAL ---

@Composable
fun MiniRecorridoLinea1FullScreen(
    estaciones: List<EstacionLineaFull> = estacionesLinea1Full,
    modifier: Modifier = Modifier
) {
    var scale by remember { mutableFloatStateOf(1f) }
    var offset by remember { mutableStateOf(Offset.Zero) }

    // Cargar la imagen del logo
    val context = LocalContext.current
    val logoBitmap = remember(context) {
        BitmapFactory.decodeResource(context.resources, R.drawable.mexibusicon)
    }

    Canvas(
        modifier = modifier
            .fillMaxWidth()
            .height(400.dp)
            .clip(RoundedCornerShape(24.dp))
            .background(Color.White)
            .pointerInput(Unit) {
                detectTransformGestures { _, pan, zoom, _ ->
                    scale = (scale * zoom).coerceIn(1f, 5f)
                    val newOffset = if (scale == 1f) Offset.Zero else offset + pan
                    offset = newOffset
                }
            }
    ) {
        val w = size.width
        val h = size.height
        val baseScale = 0.9f
        val center = Offset(w / 2f, h / 2f)
        val margin = 30f // Definimos el margen aquí para usarlo en cálculos

        // --- CÁLCULO PARA CENTRAR Y BAJAR EL MAPA ---
        val centeringShiftX = -w * 0.075f

        // CAMBIO 1: Desplazamiento vertical inicial para bajar el mapa
        // Lo bajamos unos 150 pixeles para que no quede debajo del cuadro azul
        val mapVerticalShift = 150f

        fun map(p: Offset): Offset {
            return Offset(p.x * w, p.y * h)
        }

        // --- CAPA 1: EL MAPA (Zoomable) ---
        withTransform({
            // Aplicamos: Centro + Offset Usuario + Ajuste X + Ajuste Y (Bajada)
            translate(
                left = center.x + offset.x + centeringShiftX,
                top = center.y + offset.y + mapVerticalShift // <--- Aquí bajamos el mapa
            )
            scale(scale * baseScale)
            translate(-center.x, -center.y)
        }) {

            // A) LÍNEAS
            val strokeW = 18f
            val separation = 10f

            for (i in 0 until linea1PathFull.size - 1) {
                val start = map(linea1PathFull[i])
                val end = map(linea1PathFull[i + 1])

                // Línea Ordinaria
                drawLine(
                    color = ColorOrdinaria,
                    start = Offset(start.x, start.y),
                    end = Offset(end.x, end.y),
                    strokeWidth = strokeW,
                    cap = androidx.compose.ui.graphics.StrokeCap.Round
                )
            }

            // B) ESTACIONES
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

                drawCircle(Color.DarkGray, radius = 14f, center = pos)
                drawCircle(Color.White, radius = 8f, center = pos)

                drawContext.canvas.nativeCanvas.drawText(
                    est.nombre,
                    pos.x + 25f,
                    pos.y + 10f,
                    android.graphics.Paint().apply {
                        textSize = 34f / scale
                        color = android.graphics.Color.DKGRAY
                        isAntiAlias = true
                        typeface = android.graphics.Typeface.create(android.graphics.Typeface.DEFAULT, android.graphics.Typeface.BOLD)
                    }
                )
            }
        }

        // --- CAPA 2: LEYENDA FIJA (HUD) ---

        // CAMBIO 2: Ancho dinámico (Ancho de pantalla - márgenes)
        val boxW = size.width - (margin * 2)
        val boxH = 220f

        // Fondo Azul
        drawRoundRect(
            color = ColorLeyendaFondo,
            topLeft = Offset(margin, margin),
            size = Size(boxW, boxH),
            cornerRadius = CornerRadius(20f, 20f)
        )

        val textPaint = android.graphics.Paint().apply {
            textSize = 36f
            color = android.graphics.Color.WHITE
            isAntiAlias = true
            typeface = android.graphics.Typeface.create(android.graphics.Typeface.DEFAULT, android.graphics.Typeface.BOLD)
        }

        // --- ENCABEZADO: LOGO + TITULO ---
        if (logoBitmap != null) {
            drawImage(
                image = logoBitmap.asImageBitmap(),
                dstOffset = IntOffset((margin + 20).toInt(), (margin + 20).toInt()),
                dstSize = IntSize(60, 60)
            )
        }

        drawContext.canvas.nativeCanvas.drawText(
            "Mexibús",
            margin + 100f,
            margin + 65f,
            textPaint.apply { textSize = 40f }
        )

        // --- RENGLONES DE RUTAS ---
        val rowStartY = margin + 110f

        // Renglón 1
        drawContext.canvas.nativeCanvas.drawText(
            "Línea 1",
            margin + 80f,
            rowStartY + 12f,
            textPaint.apply { textSize = 32f }
        )

        // Renglón 2
        drawContext.canvas.nativeCanvas.drawText(
            "Ciudad Azteca - Central de Abastos",
            margin + 80f,
            rowStartY + 62f,
            textPaint
        )
    }
}
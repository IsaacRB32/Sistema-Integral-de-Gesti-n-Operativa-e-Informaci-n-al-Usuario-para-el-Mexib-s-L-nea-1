package com.isaac.usuario.ui.recorrido

import android.graphics.Paint
import android.graphics.Typeface
import androidx.compose.animation.Animatable
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
import androidx.compose.material3.*
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
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import com.isaac.usuario.data.model.UnidadMB
import kotlinx.coroutines.launch
import kotlin.math.max
import androidx.compose.animation.core.AnimationVector2D
import androidx.compose.animation.core.TwoWayConverter

private val OffsetAnimConverter: TwoWayConverter<Offset, AnimationVector2D> =
    TwoWayConverter(
        convertToVector = { AnimationVector2D(it.x, it.y) },
        convertFromVector = { Offset(it.v1, it.v2) }
    )


@Composable
fun MiniRecorridoLinea1(
    unidades: List<UnidadMB>,
    modifier: Modifier = Modifier
) {
    val density = LocalDensity.current
    val scope = rememberCoroutineScope()

    // ===== Estilo base =====
    val bg = Color(0xFFF8FAFC)
    val border = Color(0xFFE5E7EB)
    val textPrimary = Color(0xFF111827)

    val lineOuter = Color(0xFFB7E28A)
    val lineInner = Color(0xFF8BC34A)

    // ===== Helpers estado/sentido =====
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

    // ===== Incidencias + navegación =====
    val incidencias = remember(unidades) {
        unidades.filter { it.estado_unidad.trim().equals("INCIDENCIA", ignoreCase = true) }
    }
    var incIdx by remember { mutableIntStateOf(0) }
    LaunchedEffect(incidencias.size) {
        incIdx = if (incidencias.isEmpty()) 0 else incIdx.coerceIn(0, incidencias.lastIndex)
    }

    // ===== Animación zoom/pan =====
    val zoomAnim = remember { Animatable(1f) }
    val panAnim = remember { Animatable<Offset, AnimationVector2D>(Offset.Zero, OffsetAnimConverter) }


    fun resetView() {
        scope.launch {
            launch { zoomAnim.animateTo(1f, tween(220)) }
            launch { panAnim.animateTo(Offset.Zero, tween(220)) }
        }
    }

    // ===== Geometría =====
    data class Geo(
        val size: IntSize,
        val w: Float,
        val h: Float,
        val padX: Float,
        val padY: Float,
        val hudH: Float,
        val topY: Float,
        val bottomY: Float,
        val trackX: Float,
        val laneDx: Float,
        val center: Offset,
        val segments: Int,
        val unitR: Float,
        val stationR: Float,
        val trackOuter: Float,
        val trackInner: Float,
        val jitterStep: Float
    )

    fun buildGeo(canvasSize: IntSize): Geo? {
        if (canvasSize.width <= 0 || canvasSize.height <= 0) return null

        val w = canvasSize.width.toFloat()
        val h = canvasSize.height.toFloat()

        val padX = with(density) { 14.dp.toPx() }
        val padY = with(density) { 14.dp.toPx() }

        // HUD inferior (botones + chips) para que no tape el dibujo
        val hudH = with(density) { 62.dp.toPx() }

        val topY = padY
        val bottomY = (h - padY - hudH).coerceAtLeast(topY + 1f)

        // Track ligeramente a la izquierda para dar aire a labels/pills
        val trackX = (w * 0.38f).coerceIn(padX + 28f, w - padX - 28f)

        val laneDxMin = with(density) { 16.dp.toPx() }
        val laneDxMax = with(density) { 54.dp.toPx() }
        val laneDx = (w * 0.18f).coerceIn(laneDxMin, laneDxMax)

        val center = Offset(w / 2f, (topY + bottomY) / 2f)
        val segments = max(1, estacionesLinea1.size - 1)

        val unitR = with(density) { 6.dp.toPx() }
        val stationR = with(density) { 4.dp.toPx() }

        val trackOuter = with(density) { 10.dp.toPx() }
        val trackInner = with(density) { 6.dp.toPx() }

        val jitterStep = with(density) { 2.dp.toPx() }

        return Geo(
            size = canvasSize,
            w = w, h = h,
            padX = padX, padY = padY,
            hudH = hudH,
            topY = topY, bottomY = bottomY,
            trackX = trackX,
            laneDx = laneDx,
            center = center,
            segments = segments,
            unitR = unitR,
            stationR = stationR,
            trackOuter = trackOuter,
            trackInner = trackInner,
            jitterStep = jitterStep
        )
    }

    fun yFromPosition(pos: Float, geo: Geo): Float {
        val p = pos.coerceIn(0f, 1f)
        return geo.bottomY - p * (geo.bottomY - geo.topY)
    }

    fun yFromT(t: Float, geo: Geo): Float {
        val tt = t.coerceIn(0f, 1f)
        return geo.bottomY - tt * (geo.bottomY - geo.topY)
    }

    fun unitPointWorld(u: UnidadMB, geo: Geo): Offset {
        val sentido = normalizaSentido(u.sentido)
        val idx = u.idx_tramo.coerceIn(0, geo.segments - 1)
        val prog = u.progreso.coerceIn(0f, 1f)
        val rawT = (idx.toFloat() + prog) / geo.segments.toFloat()

        // Misma lógica que te dejó el orden correcto:
        // IDA invertido, REGRESO normal
        val t = if (sentido == "IDA") (1f - rawT) else rawT

        val baseX = when (sentido) {
            "IDA" -> geo.trackX - geo.laneDx
            "REGRESO" -> geo.trackX + geo.laneDx
            else -> geo.trackX
        }

        val jitter = (((u.id_unidad % 5) - 2) * geo.jitterStep)
        val x = (baseX + jitter).coerceIn(geo.padX, geo.w - geo.padX)
        val y = yFromT(t, geo)

        return Offset(x, y)
    }

    // Guardamos size real y geo para usar exactamente lo mismo en foco/dibujo
    var canvasSize by remember { mutableStateOf(IntSize.Zero) }
    var lastGeo by remember { mutableStateOf<Geo?>(null) }

    fun clampPan(p: Offset, geo: Geo, zoom: Float): Offset {
        val z = zoom.coerceAtLeast(1f)
        val maxX = (z - 1f) * (geo.w * 0.50f)
        val maxY = (z - 1f) * ((geo.bottomY - geo.topY) * 0.50f)
        return Offset(
            x = p.x.coerceIn(-maxX, maxX),
            y = p.y.coerceIn(-maxY, maxY)
        )
    }

    fun focusOnIncidencia(index: Int) {
        val geo = lastGeo ?: buildGeo(canvasSize) ?: return
        if (incidencias.isEmpty()) return

        val idx = index.coerceIn(0, incidencias.lastIndex)
        val target = incidencias[idx]
        val pWorld = unitPointWorld(target, geo)

        val targetZoom = 2.0f

        // Como NO usamos withTransform, proyectamos así:
        // screen = (world - center) * zoom + center + pan
        // Para centrar target: pan = (center - world) * zoom
        val panTarget = Offset(
            (geo.center.x - pWorld.x) * targetZoom,
            (geo.center.y - pWorld.y) * targetZoom
        )

        val panClamped = clampPan(panTarget, geo, targetZoom)

        scope.launch {
            launch { zoomAnim.animateTo(targetZoom, tween(260)) }
            launch { panAnim.animateTo(panClamped, tween(260)) }
        }
    }

    // Auto-zoom cuando hay incidencias
    LaunchedEffect(incidencias, incIdx, canvasSize) {
        if (canvasSize.width <= 0 || canvasSize.height <= 0) return@LaunchedEffect
        if (incidencias.isEmpty()) {
            resetView()
        } else {
            focusOnIncidencia(incIdx)
        }
    }

    // ===== UI contenedor =====
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .defaultMinSize(minHeight = 210.dp)
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
            val geo = buildGeo(canvasSize) ?: return@Canvas
            lastGeo = geo

            val zoom = zoomAnim.value
            val pan = panAnim.value

            fun project(pWorld: Offset): Offset {
                return Offset(
                    x = (pWorld.x - geo.center.x) * zoom + geo.center.x + pan.x,
                    y = (pWorld.y - geo.center.y) * zoom + geo.center.y + pan.y
                )
            }

            // Paints (constantes en pantalla)
            val paintStation = Paint().apply {
                isAntiAlias = true
                textSize = with(density) { 11.dp.toPx() }
                typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
                color = android.graphics.Color.rgb(17, 24, 39)
            }
            val paintUnit = Paint().apply {
                isAntiAlias = true
                textSize = with(density) { 10.dp.toPx() }
                typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
                color = android.graphics.Color.rgb(17, 24, 39)
            }

            // ===== Track =====
            val start = project(Offset(geo.trackX, geo.bottomY))
            val end = project(Offset(geo.trackX, geo.topY))

            // sombra
            drawLine(
                color = Color.Black.copy(alpha = 0.06f),
                start = start + Offset(1.2f, 1.2f),
                end = end + Offset(1.2f, 1.2f),
                strokeWidth = geo.trackOuter,
                cap = StrokeCap.Round
            )
            drawLine(
                color = lineOuter,
                start = start,
                end = end,
                strokeWidth = geo.trackOuter,
                cap = StrokeCap.Round
            )
            drawLine(
                color = lineInner,
                start = start,
                end = end,
                strokeWidth = geo.trackInner,
                cap = StrokeCap.Round
            )

            // ===== Estaciones (compactas) =====
            val estaciones = estacionesLinea1
            val lastIdx = estaciones.lastIndex

            // Menos etiquetas por defecto; con zoom se muestran más
            val labelEvery = when {
                zoom >= 1.8f -> 2
                zoom >= 1.35f -> 3
                else -> 4
            }

            estaciones.forEachIndexed { i, est ->
                val yWorld = yFromPosition(est.position, geo)
                val pWorld = Offset(geo.trackX, yWorld)
                val p = project(pWorld)

                // nodo estación
                drawCircle(
                    color = Color.White,
                    radius = geo.stationR + 2.0f,
                    center = p
                )
                drawCircle(
                    color = Color(0xFF111827),
                    radius = geo.stationR,
                    center = p,
                    style = Stroke(width = 2.0f)
                )

                val showLabel = (i == 0) || (i == lastIdx) || (i % labelEvery == 0)
                if (showLabel) {
                    val txt = est.nombre
                    val tw = paintStation.measureText(txt)

                    val x = (p.x + with(density) { 12.dp.toPx() })
                        .coerceIn(geo.padX, geo.w - geo.padX - tw)

                    drawIntoCanvas { c ->
                        c.nativeCanvas.drawText(
                            txt,
                            x,
                            p.y + (paintStation.textSize / 3f),
                            paintStation
                        )
                    }
                }
            }

            // ===== Unidades =====
            unidades.forEach { u ->
                val sentido = normalizaSentido(u.sentido)
                val pWorld = unitPointWorld(u, geo)
                val p = project(pWorld)

                val c = colorPorEstado(u.estado_unidad)

                // sombra
                drawCircle(
                    color = Color.Black.copy(alpha = 0.10f),
                    radius = geo.unitR + 2.0f,
                    center = p + Offset(1.2f, 1.2f)
                )
                // punto
                drawCircle(color = Color.White, radius = geo.unitR + 2.5f, center = p)
                drawCircle(color = c, radius = geo.unitR, center = p)

                // ===== Número (pill) =====
                // REGLA PEDIDA:
                // IDA -> número a la IZQUIERDA
                // REGRESO -> número a la DERECHA
                val txt = u.id_unidad.toString()
                val tw = paintUnit.measureText(txt)

                val pillPadX = with(density) { 6.dp.toPx() }
                val pillPadY = with(density) { 3.dp.toPx() }
                val pillW = tw + pillPadX * 2
                val pillH = paintUnit.textSize + pillPadY * 2

                val gap = with(density) { 8.dp.toPx() }

                val pillLeft = if (sentido == "IDA") {
                    // izquierda del punto
                    (p.x - geo.unitR - gap - pillW).coerceAtLeast(geo.padX)
                } else {
                    // derecha del punto
                    (p.x + geo.unitR + gap).coerceAtMost(geo.w - geo.padX - pillW)
                }

                val pillTop = (p.y - pillH / 2f).coerceIn(geo.topY, geo.bottomY - pillH)

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

        // ===== HUD inferior =====
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

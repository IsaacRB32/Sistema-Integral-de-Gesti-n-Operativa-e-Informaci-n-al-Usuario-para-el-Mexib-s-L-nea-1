package com.isaac.usuario.ui.recorrido

import androidx.compose.ui.geometry.Offset

/**
 * Path esquemático oficial Línea 1 Mexibús
 * Normalizado (0f..1f)
 */
val linea1Path = listOf(
    // Ciudad Azteca → Zodiaco (recto)
    Offset(0.5f, 0.00f),
    Offset(0.5f, 0.08f),
    Offset(0.5f, 0.16f),
    Offset(0.5f, 0.24f),
    Offset(0.5f, 0.32f),
    Offset(0.5f, 0.40f),

    // Zodiaco → Primero de Mayo (diagonal izquierda)
    Offset(0.45f, 0.48f),
    Offset(0.40f, 0.56f),
    Offset(0.35f, 0.64f),

    // Primero de Mayo → Central de Abastos (diagonal derecha)
    Offset(0.40f, 0.72f),
    Offset(0.45f, 0.80f),

    // Central de Abastos → Ojo de Agua (recto)
    Offset(0.45f, 0.88f),
    Offset(0.45f, 0.96f)
)

package com.isaac.usuario.ui.recorrido

import androidx.compose.ui.geometry.Offset

// Polilínea base del mapa fullscreen (Cd. Azteca abajo -> Central arriba)
val linea1PathFull = listOf(
    Offset(0.55f, 0.85f), // Cd. Azteca (abajo)
    Offset(0.55f, 0.55f), // Recto
    Offset(0.28f, 0.35f), // Diagonal izq
    Offset(0.62f, 0.15f)  // Central (arriba)
)

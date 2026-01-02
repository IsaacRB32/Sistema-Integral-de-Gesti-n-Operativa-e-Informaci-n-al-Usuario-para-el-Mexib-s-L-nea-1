package com.isaac.usuario.data.model

data class UnidadMB(
    val id_unidad: Int,
    val id_ruta: Int,
    val idx_tramo: Int,
    val progreso: Float,   // 0.0 .. 1.0
    val sentido: String,   // "IDA" o "VUELTA"
    val estado_unidad: String // "EN_RUTA", "INCIDENCIA", etc.
)
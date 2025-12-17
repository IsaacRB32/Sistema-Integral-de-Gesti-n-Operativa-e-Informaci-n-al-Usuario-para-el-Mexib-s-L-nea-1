package com.isaac.usuario.data.model

data class IncidenciaDto(
    val id_incidencia: Int,
    val fecha_inicio: String,
    val descripcion: String,
    val nombre_incidencia: String,
    val estado_incidencia: String,
    val nombre_estacion: String?,
    val id_unidad: Int
)

data class IncidenciasResponse(
    val ok: Boolean,
    val total: Int,
    val incidencias: List<IncidenciaDto>
)
package com.isaac.usuario.data.repository

import android.content.Context
import com.android.volley.Request
import com.android.volley.toolbox.JsonObjectRequest
import com.android.volley.toolbox.Volley
import com.isaac.usuario.data.model.IncidenciaDto

class IncidenciasRepository {

    fun obtenerUltimaIncidencia(
        context: Context,
        onSuccess: (IncidenciaDto?) -> Unit,
        onError: (String) -> Unit
    ) {
        //----------------------------------------------------------------
        // Zona de cambio de IPs
        //----------------------------------------------------------------
        //IP de Fernando Aranda
        //val url = "http://192.168.100.207:3000/api/sim/incidencias/activas"
        // IP de Isaac Rojas
        val url = "http://192.168.0.97:3000/api/sim/incidencias/activas"

        val request = JsonObjectRequest(
            Request.Method.GET,
            url,
            null,
            { response ->
                try {
                    val incidenciasArray = response.getJSONArray("incidencias")

                    var incidenciaMasReciente: IncidenciaDto? = null

                    for (i in 0 until incidenciasArray.length()) {
                        val obj = incidenciasArray.getJSONObject(i)

                        val incidenciaActual = IncidenciaDto(
                            id_incidencia = obj.getInt("id_incidencia"),
                            fecha_inicio = obj.getString("fecha_inicio"),
                            descripcion = obj.getString("descripcion"),
                            nombre_incidencia = obj.getString("nombre_incidencia"),
                            estado_incidencia = obj.getString("estado_incidencia"),
                            nombre_estacion = obj.optString("nombre_estacion", null),
                            id_unidad = obj.getInt("id_unidad")
                        )

                        if (
                            incidenciaMasReciente == null ||
                            incidenciaActual.fecha_inicio > incidenciaMasReciente!!.fecha_inicio
                        ) {
                            incidenciaMasReciente = incidenciaActual
                        }
                    }

                    onSuccess(incidenciaMasReciente)

                } catch (e: Exception) {
                    onError("Error al procesar la respuesta")
                }
            },
            { error ->
                onError(error.message ?: "Error de red")
            }
        )
        Volley.newRequestQueue(context).add(request)
    }

    fun obtenerIncidencias(
        context: Context,
        onSuccess: (List<IncidenciaDto>) -> Unit,
        onError: (String) -> Unit
    ) {

        //val url = "http://192.168.100.207:3000/api/sim/incidencias/activas"
        //IP de Isaac Rojas Barron
        val url = "http://192.168.0.97:3000/api/sim/incidencias/activas"
        val request = JsonObjectRequest(
            Request.Method.GET,
            url,
            null,
            { response ->
                try {
                    val incidenciasArray = response.getJSONArray("incidencias")
                    val lista = mutableListOf<IncidenciaDto>()

                    for (i in 0 until incidenciasArray.length()) {
                        val obj = incidenciasArray.getJSONObject(i)

                        lista.add(
                            IncidenciaDto(
                                id_incidencia = obj.getInt("id_incidencia"),
                                fecha_inicio = obj.getString("fecha_inicio"),
                                descripcion = obj.getString("descripcion"),
                                nombre_incidencia = obj.getString("nombre_incidencia"),
                                estado_incidencia = obj.getString("estado_incidencia"),
                                nombre_estacion = obj.optString("nombre_estacion", null),
                                id_unidad = obj.getInt("id_unidad")
                            )
                        )
                    }

                    // Ordenar de la incidencia más reciente a la más antigua
                    val ordenadas = lista.sortedByDescending { it.fecha_inicio }

                    onSuccess(ordenadas)

                } catch (e: Exception) {
                    onError("Error al procesar incidencias")
                }
            },
            { error ->
                onError(error.message ?: "Error de red")
            }
        )

        Volley.newRequestQueue(context).add(request)
    }
}
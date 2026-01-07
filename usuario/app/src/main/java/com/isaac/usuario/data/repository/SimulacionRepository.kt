package com.isaac.usuario.data.repository

import android.content.Context
import com.android.volley.Request
import com.android.volley.toolbox.JsonArrayRequest
import com.android.volley.toolbox.Volley
import com.isaac.usuario.data.model.UnidadMB

class SimulacionRepository {
    fun obtenerSnapshot(
        context: Context,
        onSuccess: (List<UnidadMB>) -> Unit,
        onError: () -> Unit
    ) {
        //val url = "http://192.168.100.207:3000/api/sim/snapshot"
        // IP de Isaac Rojas
        //val url = "http://192.168.0.97:3000/api/sim/snapshot"
        //IP de Hotspot de Cel
        val url = "http://10.119.215.30:3000/api/sim/snapshot"
        val request = JsonArrayRequest(
            Request.Method.GET,
            url,
            null,
            { response ->
                val unidades = mutableListOf<UnidadMB>()

                for (i in 0 until response.length()) {
                    val o = response.getJSONObject(i)
                    unidades.add(
                        UnidadMB(
                            id_unidad = o.getInt("id_unidad"),
                            id_ruta = o.getInt("id_ruta"),
                            idx_tramo = o.getInt("idx_tramo"),
                            progreso = o.getDouble("progreso").toFloat(),
                            sentido = o.getString("sentido"),
                            estado_unidad = o.getString("estado_unidad")
                        )
                    )
                }

                onSuccess(unidades)
            },
            {
                onError()
            }
        )

        Volley.newRequestQueue(context).add(request)
    }
}
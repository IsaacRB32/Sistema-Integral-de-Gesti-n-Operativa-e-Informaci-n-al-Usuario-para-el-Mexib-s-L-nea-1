package com.example.botoneraoperador.data.repository

import android.content.Context
import com.android.volley.Request
import com.android.volley.toolbox.JsonObjectRequest
import com.android.volley.toolbox.Volley
import com.example.botoneraoperador.data.network.ApiIncidencias
import org.json.JSONObject

class IncidenciasRepository(private val context: Context) : ApiIncidencias {

    override fun reportarIncidencia(
        url: String,
        data: JSONObject,
        onSuccess: (String) -> Unit,
        onError: (String) -> Unit
    ) {
        val queue = Volley.newRequestQueue(context)

        val request = JsonObjectRequest(
            Request.Method.POST,
            url,
            data,
            { response ->
                onSuccess(response.toString())
            },
            { error ->
                onError(error.message ?: "Error desconocido")
            }
        )

        queue.add(request)
    }
}
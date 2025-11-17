package com.example.botoneraoperador.data.repository

import android.content.Context
import com.android.volley.Request
import com.android.volley.toolbox.JsonObjectRequest
import com.android.volley.toolbox.Volley
import com.example.botoneraoperador.data.model.Usuario
import org.json.JSONObject

class LoginRepository {

    fun login(
        context: Context,
        email: String,
        password: String,
        onSuccess: (Usuario) -> Unit,
        onError: (String) -> Unit
    ) {
        val queue = Volley.newRequestQueue(context)
        val url = "http://192.168.100.207:3000/api/login"

        val body = JSONObject().apply {
            put("email", email)
            put("password", password)
        }

        val request = JsonObjectRequest(
            Request.Method.POST,
            url,
            body,
            { response ->
                try {
                    val usuarioJson = response.getJSONObject("usuario")
                    val usuario = Usuario(
                        id = usuarioJson.getInt("id_usuario"),
                        nombre = usuarioJson.getString("nombre"),
                        primerApellido = usuarioJson.getString("primer_apellido"),
                        segundoApellido = usuarioJson.optString("segundo_apellido", null),
                        email = usuarioJson.getString("email")
                    )
                    onSuccess(usuario)
                } catch (e: Exception) {
                    onError("Error al procesar la respuesta")
                }
            },
            { error ->
                val response = error.networkResponse
                if (response != null && response.statusCode == 401) {
                    val body = String(response.data)
                    try {
                        val json = JSONObject(body)
                        val mensaje = json.optString("message", "error desconocido")
                        onError(mensaje)
                    } catch (e: Exception) {
                        onError("Error desconocido")
                    }
                } else {
                    onError(error.message ?: "Error de red")
                }
            }
        )

        queue.add(request)
    }
}
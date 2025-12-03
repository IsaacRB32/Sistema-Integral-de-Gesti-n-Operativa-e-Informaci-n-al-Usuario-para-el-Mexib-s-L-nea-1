package com.example.botoneraoperador.ui.incidencias

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.android.volley.Request
import com.android.volley.toolbox.JsonObjectRequest
import com.android.volley.toolbox.Volley
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import org.json.JSONObject
class IncidenciasViewModel : ViewModel() {
    private val _loading = MutableStateFlow(false)
    val loading: StateFlow<Boolean> = _loading
    private val _mensaje = MutableStateFlow<String?>(null)
    val mensaje: StateFlow<String?> = _mensaje

    //Enviar incidencia al servidor (al archivo sim-routes.js)
    fun reportarIncidencia(
        context: Context,
        idUnidad: Int,
        tipoIncidencia: String,
        descripcion: String,
        obtenerIdIncidencia: (String) -> Int?,
        onSuccess: () -> Unit
    ) {
        viewModelScope.launch {
            _loading.value = true
            val queue = Volley.newRequestQueue(context)
            // JSON correcto según la API
            val data = JSONObject().apply {
                put("id_unidad", idUnidad)
                if (descripcion.isNotEmpty()) {
                    put("descripcion", descripcion)
                }
                val idCatalogo = obtenerIdIncidencia(tipoIncidencia)
                if (idCatalogo != null) {
                    put("id_cincidencia", idCatalogo)
                }
            }

            val url = "http://192.168.100.207:3000/api/sim/incidencia"
            val request = JsonObjectRequest(
                Request.Method.POST,
                url,
                data,
                { response ->
                    _loading.value = false

                    if (response.optBoolean("ok")) {
                        _mensaje.value = "Incidencia registrada correctamente."
                        onSuccess()
                    } else {
                        _mensaje.value = response.optString("error", "Se ha producido un error. Intente más tarde")
                    }
                },
                { error ->
                    _loading.value = false
                    _mensaje.value = "Error al conectar con el servidor. Intente más tarde."
                }
            )
            queue.add(request)
        }
    }
    fun limpiarMensaje(){
        _mensaje.value=null
    }
}
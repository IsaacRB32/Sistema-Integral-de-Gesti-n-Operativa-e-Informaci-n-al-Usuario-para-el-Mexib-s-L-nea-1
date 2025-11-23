package com.example.botoneraoperador.data.network

import org.json.JSONObject
interface ApiIncidencias {
    fun reportarIncidencia(
        url: String,
        data: JSONObject,
        onSuccess: (String) -> Unit,
        onError: (String) -> Unit
    )
}
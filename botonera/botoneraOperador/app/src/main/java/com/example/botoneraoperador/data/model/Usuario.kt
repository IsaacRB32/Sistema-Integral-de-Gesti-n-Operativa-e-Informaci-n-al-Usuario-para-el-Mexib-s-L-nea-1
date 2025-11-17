package com.example.botoneraoperador.data.model

data class Usuario(
    val id: Int,
    val nombre: String,
    val primerApellido: String,
    val segundoApellido: String?,
    val email: String
)
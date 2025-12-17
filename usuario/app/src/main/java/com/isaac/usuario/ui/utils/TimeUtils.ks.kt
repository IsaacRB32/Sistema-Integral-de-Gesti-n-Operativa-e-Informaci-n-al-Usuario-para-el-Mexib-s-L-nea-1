package com.isaac.usuario.ui.utils

import java.time.Instant
import java.time.ZoneId
import java.time.temporal.ChronoUnit

fun tiempoTranscurrido(fechaIso: String): String {
    return try {
        val inicio = Instant.parse(fechaIso)
        val ahora = Instant.now()

        val minutos = ChronoUnit.MINUTES.between(inicio, ahora)
        val horas = ChronoUnit.HOURS.between(inicio, ahora)

        when {
            minutos < 1 -> "Hace unos segundos"
            minutos < 60 -> "Hace $minutos minutos"
            horas < 24 -> "Hace $horas horas"
            else -> {
                val dias = ChronoUnit.DAYS.between(inicio, ahora)
                "Hace $dias días"
            }
        }
    } catch (e: Exception) {
        "Hace un momento"
    }
}
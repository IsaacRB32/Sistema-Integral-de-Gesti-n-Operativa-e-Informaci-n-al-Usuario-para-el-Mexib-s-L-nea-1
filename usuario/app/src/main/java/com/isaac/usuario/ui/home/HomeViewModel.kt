package com.isaac.usuario.ui.home

import android.content.Context
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import com.isaac.usuario.data.model.IncidenciaDto
import com.isaac.usuario.data.repository.IncidenciasRepository
import androidx.compose.runtime.State
import com.isaac.usuario.data.model.UnidadMB
import com.isaac.usuario.data.repository.SimulacionRepository

class HomeViewModel : ViewModel() {
    private val repository = IncidenciasRepository()
    private val _ultimaIncidencia = mutableStateOf<IncidenciaDto?>(null)
    val ultimaIncidencia: State<IncidenciaDto?> = _ultimaIncidencia
    private val _cargando = mutableStateOf(false)
    val cargando: State<Boolean> = _cargando
    private val _incidencias = mutableStateOf<List<IncidenciaDto>>(emptyList())
    val incidencias: State<List<IncidenciaDto>> = _incidencias

    //Adiciones para el trazo de las incidencias en el mapa
    private val simRepository = SimulacionRepository()
    private val _unidades = mutableStateOf<List<UnidadMB>>(emptyList())
    val unidades: State<List<UnidadMB>> = _unidades

    fun cargarUltimaIncidencia(context: Context) {
        _cargando.value = true

        repository.obtenerUltimaIncidencia(
            context = context,
            onSuccess = { incidencia ->
                _ultimaIncidencia.value = incidencia
                _cargando.value = false
            },
            onError = {
                _cargando.value = false
            }
        )
    }

    fun cargarIncidencias(context: Context) {
        _cargando.value = true

        repository.obtenerIncidencias(
            context = context,
            onSuccess = { lista ->
                _incidencias.value = lista
                _cargando.value = false
            },
            onError = {
                _cargando.value = false
            }
        )
    }

    fun cargarSnapshot(context: Context) {
        println(">>> cargarSnapshot EJECUTADO")

        simRepository.obtenerSnapshot(
            context = context,
            onSuccess = { lista ->
                println(">>> Snapshot recibido: ${lista.size}")
                _unidades.value = lista
            },
            onError = {
                println(">>> ERROR snapshot")
            }
        )
    }

}
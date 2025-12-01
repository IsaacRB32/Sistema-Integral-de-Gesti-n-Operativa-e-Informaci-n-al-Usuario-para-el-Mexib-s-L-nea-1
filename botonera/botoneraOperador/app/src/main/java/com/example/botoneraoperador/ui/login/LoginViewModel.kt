package com.example.botoneraoperador.ui.login

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.botoneraoperador.data.model.Usuario
import com.example.botoneraoperador.data.repository.LoginRepository
import com.example.botoneraoperador.data.session.SessionManager
import kotlinx.coroutines.launch

class LoginViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = LoginRepository()
    private val sessionManager = SessionManager(application.applicationContext)
    var usuario: Usuario? = null
        private set

    fun login(email: String, password: String, onResult: (Boolean, String, Usuario?) -> Unit) {
        val context = getApplication<Application>().applicationContext
        repository.login(context, email, password,
            onSuccess = { user ->
                usuario=user
                when(user.rol.uppercase()){
                    "SUPERVISOR" -> {
                        viewModelScope.launch {
                            sessionManager.saveSession(user.id, user.email, -1)
                        }
                        onResult(true, "SUPERVISOR_OK", user)
                    }
                    "OPERADOR" -> {
                        if(user.unidadAsignada!=null) {
                            viewModelScope.launch {
                                sessionManager.saveSession(user.id, user.email, user.unidadAsignada)
                            }
                            onResult(true, "OPERADOR_OK", user)
                        }
                        else{
                            onResult(false, "OPERADOR_SIN_UNIDAD", user)
                        }
                    }
                    else -> {
                        onResult(false, "ROL_INVALIDO", user)
                    }
                }
            },
            onError = { error ->
                onResult(false, error, null)
            }
        )
    }
}
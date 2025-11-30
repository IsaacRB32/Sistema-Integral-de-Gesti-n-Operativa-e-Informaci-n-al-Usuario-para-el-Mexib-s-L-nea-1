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

    fun login(email: String, password: String, onResult: (success: Boolean, message: String) -> Unit) {
        val context = getApplication<Application>().applicationContext
        repository.login(context, email, password,
            onSuccess = {
                usuario=it
                viewModelScope.launch{
                    sessionManager.saveSession(it.id, it.email)
                }
                onResult(true, "Login exitoso")
            },
            onError = { error ->
                onResult(false, error)
            }
        )
    }
}

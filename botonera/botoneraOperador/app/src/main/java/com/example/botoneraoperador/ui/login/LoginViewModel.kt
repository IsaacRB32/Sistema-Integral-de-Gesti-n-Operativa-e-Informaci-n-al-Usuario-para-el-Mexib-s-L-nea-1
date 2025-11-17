package com.example.botoneraoperador.ui.login

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import com.example.botoneraoperador.data.model.Usuario
import com.example.botoneraoperador.data.repository.LoginRepository

class LoginViewModel(application: Application) : AndroidViewModel(application) {

    private val repository = LoginRepository()

    var usuario: Usuario? = null
        private set

    fun login(email: String, password: String, onResult: (success: Boolean, message: String) -> Unit) {
        val context = getApplication<Application>().applicationContext
        repository.login(context, email, password,
            onSuccess = {
                usuario = it
                onResult(true, "Login exitoso")
            },
            onError = { error ->
                onResult(false, error)
            }
        )
    }
}

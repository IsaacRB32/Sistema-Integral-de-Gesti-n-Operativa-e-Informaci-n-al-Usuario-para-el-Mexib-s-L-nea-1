package com.example.botoneraoperador.ui.login

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.example.botoneraoperador.ui.login.LoginViewModel

@Composable
fun LoginScreen(navController: NavController, viewModel: LoginViewModel = viewModel()) {

    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var errorMessage by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {

            Text(text = "Inicio de Sesión", style = MaterialTheme.typography.headlineMedium)

            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                label = { Text("Correo") },
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                label = { Text("Contraseña") },
                visualTransformation = PasswordVisualTransformation(),
                modifier = Modifier.fillMaxWidth()
            )

            if (loading) {
                CircularProgressIndicator()
            }

            Button(
                onClick = {
                    if (email.isEmpty() || password.isEmpty()) {
                        errorMessage = "Completa todos los campos"
                        return@Button
                    }

                    loading = true
                    viewModel.login(email, password) { success, message ->
                        loading = false
                        if (success) {
                            navController.navigate("botonera") // Navega a la pantalla principal
                        } else {
                            errorMessage = message
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Ingresar")
            }

            if (errorMessage.isNotEmpty()) {
                Text(errorMessage, color = Color.Red)
            }
        }
    }
}
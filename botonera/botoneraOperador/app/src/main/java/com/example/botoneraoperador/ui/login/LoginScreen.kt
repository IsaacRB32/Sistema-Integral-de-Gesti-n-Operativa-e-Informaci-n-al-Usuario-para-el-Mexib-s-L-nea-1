package com.example.botoneraoperador.ui.login

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import androidx.navigation.compose.rememberNavController
import com.example.botoneraoperador.R
import com.example.botoneraoperador.ui.theme.Blue40
import com.example.botoneraoperador.ui.theme.Blue41

@Composable
fun LoginScreen(
    navController: NavController,
    loginViewModel: LoginViewModel = viewModel()
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    var showEmptyFieldsDialog by remember { mutableStateOf(false) }
    var showLoginFailedDialog by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(32.dp)
        ) {
            LoginHeader()

            LoginForm(
                usuario = email,
                onUsuarioChange = { email = it },
                pwd = password,
                onPwdChange = { password = it },
                onLoginClick = {
                    when {
                        email.isEmpty() || password.isEmpty() -> {
                            showEmptyFieldsDialog = true
                        }
                        else -> {
                            loginViewModel.login(email, password) { success, _ ->
                                if (success) {
                                    navController.navigate("botonera")
                                } else {
                                    showLoginFailedDialog = true
                                }
                            }
                        }
                    }
                }
            )
        }
    }

    // Diálogo campos vacíos
    if (showEmptyFieldsDialog) {
        AlertDialog(
            onDismissRequest = { showEmptyFieldsDialog = false },
            confirmButton = {
                TextButton(
                    onClick = { showEmptyFieldsDialog = false },
                    colors = ButtonDefaults.textButtonColors(contentColor = Blue41)
                ) {
                    Text("Aceptar")
                }
            },
            title = { Text("Campos Vacíos") },
            text = { Text("Por favor, completa todos los campos.") }
        )
    }

    // Diálogo login fallido
    if (showLoginFailedDialog) {
        AlertDialog(
            onDismissRequest = { showLoginFailedDialog = false },
            confirmButton = {
                TextButton(
                    onClick = { showLoginFailedDialog = false },
                    colors = ButtonDefaults.textButtonColors(contentColor = Blue41)
                ) {
                    Text("Cerrar")
                }
            },
            title = { Text("Error de Acceso") },
            text = { Text("El nombre de usuario o la contraseña son incorrectos. Por favor, verifica tus credenciales y vuelve a intentarlo.") }
        )
    }
}

@Composable
fun LoginHeader() {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        Image(
            painter = painterResource(id = R.drawable.mexibusicon),
            contentDescription = "Logo de Mexibús",
            modifier = Modifier.size(100.dp)
        )
        Text(
            text = "Acceso para Operadores",
            style = MaterialTheme.typography.headlineLarge,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
        )
    }
}

@Composable
fun LoginForm(
    usuario: String,
    onUsuarioChange: (String) -> Unit,
    pwd: String,
    onPwdChange: (String) -> Unit,
    onLoginClick: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        OutlinedTextField(
            value = usuario,
            onValueChange = onUsuarioChange,
            label = { Text("Usuario") },
            modifier = Modifier.fillMaxWidth()
        )

        OutlinedTextField(
            value = pwd,
            onValueChange = onPwdChange,
            label = { Text("Contraseña") },
            modifier = Modifier.fillMaxWidth()
        )

        Button(
            onClick = onLoginClick,
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(
                containerColor = Blue40,
                contentColor = Color.White
            )
        ) {
            Text("Ingresar")
        }
    }
}

// Previews
@Preview(showBackground = true)
@Composable
fun LoginScreenPreview() {
    LoginScreen(navController = rememberNavController())
}
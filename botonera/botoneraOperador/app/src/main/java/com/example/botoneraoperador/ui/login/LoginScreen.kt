package com.example.botoneraoperador.ui.login

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import androidx.navigation.compose.rememberNavController
import androidx.compose.ui.graphics.Color
import com.example.botoneraoperador.R
import com.example.botoneraoperador.ui.theme.Blue40
import com.example.botoneraoperador.ui.theme.Blue41


@Composable
fun LoginScreen(navController: NavController) {

    var usuario by remember { mutableStateOf("") }
    var pwd by remember { mutableStateOf("") }
    var showNoUnitDialog by remember { mutableStateOf(false) }
    // NUEVO ESTADO: Controla la visibilidad del diálogo de error de login
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
                usuario = usuario,
                onUsuarioChange = { usuario = it },
                pwd = pwd,
                onPwdChange = { pwd = it },
                onLoginClick = {
                    // Lógica simulada de LOGIN
                    when (usuario) {
                        "sinunidad" -> showNoUnitDialog = true // Muestra diálogo de no unidad
                        "error" -> showLoginFailedDialog = true // Muestra diálogo de error de login
                        else -> navController.navigate("botonera") // Navegación exitosa
                    }
                }
            )
        }
    }

    if (showNoUnitDialog) {
        NoUnitAssignedDialog(
            onDismiss = { showNoUnitDialog = false }
        )
    }

    if (showLoginFailedDialog) {
        LoginFailedDialog(
            onDismiss = { showLoginFailedDialog = false }
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
            painter = painterResource(id = R.drawable.mexibusicoN), // Asumiendo el nombre renombrado
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
                containerColor = Blue40, // Usando el color Blue40
                contentColor = Color.White
            )
        ) {
            Text("Ingresar")
        }
    }
}

@Composable
fun NoUnitAssignedDialog(onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(text = "Sin unidad asignada")
        },

        confirmButton = {
            TextButton(
                onClick = onDismiss,
                colors = ButtonDefaults.textButtonColors(contentColor = Blue41)
            ) {
                Text("Aceptar")
            }
        },


        text = {
            Text(text = "Tu usuario ha iniciado sesión correctamente, pero no tienes una unidad de transporte asignada en este momento.")
        }
    )
}

@Composable
fun LoginFailedDialog(onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            TextButton(
                onClick = onDismiss,
                colors = ButtonDefaults.textButtonColors(contentColor = Blue41)
            ) {
                Text("Cerrar") // Cambiamos el texto a Cerrar
            }
        },
        title = {
            Text(text = "Error de Acceso")
        },
        text = {
            Text(text = "El nombre de usuario o la contraseña son incorrectos. Por favor, verifica tus credenciales y vuelve a intentarlo.")
        }
    )
}


@Preview(showBackground = true)
@Composable
fun LoginScreenPreview() {
    LoginScreen(navController = rememberNavController())
}

@Preview
@Composable
fun LoginFailedDialogPreview() {
    LoginFailedDialog(onDismiss = {})
}

@Preview
@Composable
fun NoUnitAssignedDialogPreview() {
    NoUnitAssignedDialog(onDismiss = {})
}
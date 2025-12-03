package com.example.botoneraoperador.ui.login

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import androidx.navigation.compose.rememberNavController
import com.example.botoneraoperador.R
import com.example.botoneraoperador.ui.theme.Blue40
import com.example.botoneraoperador.ui.theme.Blue41
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff

@Composable
fun LoginScreen(
    navController: NavController,
    loginViewModel: LoginViewModel = viewModel()
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    var showEmptyFieldsDialog by remember { mutableStateOf(false) }
    var showLoginFailedDialog by remember { mutableStateOf(false) }
    var showNoUnitDialog by remember { mutableStateOf(false) }

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
                            loginViewModel.login(email, password) { success, codeOrMsg, usuario ->
                                if(success){
                                    navController.navigate("botonera"){
                                        popUpTo("login"){
                                            inclusive=true
                                        }
                                    }
                                }
                                else{
                                    when(codeOrMsg){
                                        "OPERADOR_SIN_UNIDAD" ->{
                                            showNoUnitDialog=true
                                        }
                                        "ROL_INVALIDO" ->{
                                            showLoginFailedDialog=true
                                        }
                                        else ->{
                                            showLoginFailedDialog=true
                                        }
                                    }
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
            text = { Text("El correo o la contraseña son incorrectos. Por favor, verifica tus credenciales.") }
        )
    }

    if (showNoUnitDialog) {
        AlertDialog(
            onDismissRequest = { showNoUnitDialog = false },
            title = { Text("Sin unidad asignada") },
            text = { Text("Aún no tiene unidad asignada, consulte a su supervisor.") },
            confirmButton = {
                TextButton(onClick = { showNoUnitDialog = false }) { Text("Aceptar") }
            }
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
    val miAzul = Color(0xFF00a1d3)

    // Configuración de colores
    val misColores = OutlinedTextFieldDefaults.colors(
        // Bordes y Etiquetas (AZUL)
        focusedBorderColor = miAzul,
        focusedLabelColor = miAzul,
        cursorColor = miAzul,
        focusedTrailingIconColor = miAzul,

        // Texto de los campos (NEGRO)
        focusedTextColor = Color.Black,
        unfocusedTextColor = Color.Black
    )

    var passwordVisible by remember { mutableStateOf(false) }

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Campo Usuario
        OutlinedTextField(
            value = usuario,
            onValueChange = onUsuarioChange,
            label = { Text("Correo Electrónico") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            colors = misColores // Aplica negro al texto y azul al borde
        )

        // Campo Contraseña
        OutlinedTextField(
            value = pwd,
            onValueChange = onPwdChange,
            label = { Text("Contraseña") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
            colors = misColores, // Aplica negro al texto y azul al borde
            trailingIcon = {

                val image = if (passwordVisible)
                    Icons.Filled.Visibility
                else
                    Icons.Filled.VisibilityOff
                val description = if (passwordVisible) "Ocultar contraseña" else "Mostrar contraseña"

                IconButton(onClick = { passwordVisible = !passwordVisible }) {
                    Icon(imageVector = image, contentDescription = description)
                }
            }
        )

        // Botón Ingresar
        Button(
            onClick = onLoginClick,
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(
                containerColor = miAzul,
                contentColor = Color.White
            )
        ) {
            Text("Ingresar")
        }
    }
}

@Preview(showBackground = true)
@Composable
fun LoginScreenPreview() {
    LoginScreen(navController = rememberNavController())
}
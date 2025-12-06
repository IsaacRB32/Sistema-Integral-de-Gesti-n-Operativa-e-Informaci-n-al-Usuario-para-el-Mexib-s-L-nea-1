package com.example.botoneraoperador.ui.login

import android.app.Activity
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
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
    // 1. OCULTAR BARRAS DE SISTEMA (Pantalla Completa)
    HideSystemBarsLogin()

    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    var showEmptyFieldsDialog by remember { mutableStateOf(false) }
    var showLoginFailedDialog by remember { mutableStateOf(false) }
    var showNoUnitDialog by remember { mutableStateOf(false) }

    // 2. DETECCIÓN DE TABLETA
    val configuration = LocalConfiguration.current
    val isTablet = configuration.screenWidthDp > 600

    // Lógica Responsive:
    // Si es tableta, el contenido tendrá un ancho fijo de 450dp para que se vea como una "tarjeta" centrada.
    // Si es celular, usará el ancho máximo disponible (fillMaxWidth).
    val contentModifier = if (isTablet) {
        Modifier.width(450.dp)
    } else {
        Modifier.fillMaxWidth()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        // Aplicamos el modificador responsive a la Columna principal
        Column(
            modifier = contentModifier,
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(32.dp)
        ) {
            LoginHeader(isTablet)

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
                                        popUpTo("login"){ inclusive=true }
                                    }
                                }
                                else{
                                    when(codeOrMsg){
                                        "OPERADOR_SIN_UNIDAD" -> showNoUnitDialog=true
                                        else -> showLoginFailedDialog=true
                                    }
                                }
                            }
                        }
                    }
                }
            )
        }
    }

    // --- DIÁLOGOS ---
    if (showEmptyFieldsDialog) {
        AlertDialog(
            onDismissRequest = { showEmptyFieldsDialog = false },
            confirmButton = {
                TextButton(
                    onClick = { showEmptyFieldsDialog = false },
                    colors = ButtonDefaults.textButtonColors(contentColor = Blue41)
                ) { Text("Aceptar") }
            },
            title = { Text("Campos Vacíos") },
            text = { Text("Por favor, completa todos los campos.") }
        )
    }

    if (showLoginFailedDialog) {
        AlertDialog(
            onDismissRequest = { showLoginFailedDialog = false },
            confirmButton = {
                TextButton(
                    onClick = { showLoginFailedDialog = false },
                    colors = ButtonDefaults.textButtonColors(contentColor = Blue41)
                ) { Text("Cerrar") }
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
fun LoginHeader(isTablet: Boolean = false) {
    // Logo más grande en tableta
    val logoSize = if (isTablet) 150.dp else 100.dp

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        Image(
            painter = painterResource(id = R.drawable.mexibusicon),
            contentDescription = "Logo de Mexibús",
            modifier = Modifier.size(logoSize)
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
        focusedBorderColor = miAzul,
        focusedLabelColor = miAzul,
        cursorColor = miAzul,
        focusedTrailingIconColor = miAzul,
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
            colors = misColores
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
            colors = misColores,
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

// Función auxiliar para pantalla completa
@Composable
fun HideSystemBarsLogin() {
    val view = LocalView.current
    if (!view.isInEditMode) {
        DisposableEffect(Unit) {
            val window = (view.context as? Activity)?.window
            if (window != null) {
                val insetsController = WindowCompat.getInsetsController(window, view)
                insetsController.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                insetsController.hide(WindowInsetsCompat.Type.systemBars())
            }
            onDispose {
                // Al salir del Login, decidimos qué hacer.
                val window = (view.context as? Activity)?.window
                if (window != null) {
                    val insetsController = WindowCompat.getInsetsController(window, view)
                    insetsController.show(WindowInsetsCompat.Type.systemBars())
                }
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
fun LoginScreenPreview() {
    LoginScreen(navController = rememberNavController())
}
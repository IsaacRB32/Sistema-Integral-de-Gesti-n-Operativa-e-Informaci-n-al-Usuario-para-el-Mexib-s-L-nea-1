package com.example.botoneraoperador

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.example.botoneraoperador.navigation.AppNavigation
import com.example.botoneraoperador.ui.theme.BotoneraOperadorTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            BotoneraOperadorTheme {
                AppNavigation()
            }
        }
    }
}

//@Composable
//fun LoginScreen() {
//    var usuario by remember { mutableStateOf("") }
//    var pwd by remember { mutableStateOf("") }
//
//    Box(
//        modifier = Modifier
//            .fillMaxSize()
//            .padding(24.dp),
//        contentAlignment = Alignment.Center
//    ) {
//
//        Column(
//            horizontalAlignment = Alignment.CenterHorizontally,
//            verticalArrangement = Arrangement.spacedBy(16.dp)
//        ) {
//
//            Text(text = "Inicio de Sesión")
//
//            OutlinedTextField(
//                value = usuario,
//                onValueChange = { usuario = it },
//                label = { Text("Usuario") },
//                modifier = Modifier.fillMaxWidth()
//            )
//
//            OutlinedTextField(
//                value = pwd,
//                onValueChange = { pwd = it },
//                label = { Text("Contraseña") },
//                modifier = Modifier.fillMaxWidth()
//            )
//
//            Button(
//                onClick = {
//                    // Procesamiento del login
//                },
//                modifier = Modifier.fillMaxWidth()
//            ) {
//                Text("Ingresar")
//            }
//        }
//    }
//}
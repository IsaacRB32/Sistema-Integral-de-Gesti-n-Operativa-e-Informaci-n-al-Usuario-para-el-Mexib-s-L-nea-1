package com.isaac.usuario

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.isaac.usuario.ui.home.HomeScreen // <--- Importamos tu pantalla nueva
import com.isaac.usuario.ui.theme.UsuarioTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // enableEdgeToEdge() permite que la app se dibuje detrás de las barras (transparencia)
        // Si notas que el contenido se solapa con la barra de arriba, puedes quitar esta línea.
        enableEdgeToEdge()

        setContent {
            UsuarioTheme {
                // Aquí es donde sucede la magia: Cargamos TU pantalla
                HomeScreen()
            }
        }
    }
}
package com.example.botoneraoperador.ui.botonera

import androidx.compose.material3.Surface
import androidx.compose.ui.res.painterResource
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.botoneraoperador.ui.theme.BotoneraOperadorTheme
import androidx.navigation.NavHostController
import androidx.navigation.compose.rememberNavController
import com.example.botoneraoperador.R
import androidx.compose.foundation.Image
import androidx.compose.foundation.clickable
import androidx.compose.ui.text.style.TextOverflow

//Importaciones de Reloj
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import kotlinx.coroutines.delay
import java.time.LocalTime
import java.time.format.DateTimeFormatter

// Color principal de la app
val AppTealColor = Color(0xFF018786)

@Composable
fun BotoneraScreen(navController: NavHostController) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White)
    ) {
        TopBar()
        IconGrid() //Cuadricula de Iconos
    }
}

@Composable
fun TopBar() {
    // 1. Prepara un formateador para la hora "HH:mm"
    val formatter = remember { DateTimeFormatter.ofPattern("HH:mm") }

    // 2. Crea un "estado" para guardar el texto de la hora.
    var currentTime by remember { mutableStateOf("") }

    // 3. Este efecto se "lanza" una vez y se ejecuta en un bucle
    LaunchedEffect(Unit) {
        while (true) {
            currentTime = LocalTime.now().format(formatter)
            delay(1000L)
        }
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(AppTealColor)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Logo
        Box(
            modifier = Modifier
                .size(40.dp)
                .background(Color.White, RoundedCornerShape(8.dp)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Menu,
                contentDescription = "Logo",
                tint = AppTealColor,
                modifier = Modifier.size(30.dp)
            )
        }

        Spacer(modifier = Modifier.weight(1f))

        // 4. El texto ahora usa la variable de estado "currentTime"
        Text(
            text = currentTime,
            color = Color.White,
            fontSize = 32.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
fun IconGrid() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Fila 1 de íconos
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            InfoButton(drawableId = R.drawable.bloqueo_manif, description = "Bloqueo")
            InfoButton(drawableId = R.drawable.colision_terceros, description = "Colisión Terceros")
            InfoButton(drawableId = R.drawable.colision_unidad, description = "Colisión Unidad")
            InfoButton(drawableId = R.drawable.fallas_tecnicas, description = "Fallas Técnicas")
        }

        Spacer(modifier = Modifier.height(16.dp)) // Espacio entre filas

        // Fila 2 de íconos
        Row(
            modifier = Modifier.fillMaxWidth(0.8f),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            InfoButton(drawableId = R.drawable.incidente_estacion, description = "Inc. Estación")
            InfoButton(drawableId = R.drawable.inundacion, description = "Inundación")
            InfoButton(drawableId = R.drawable.unidad_detenida, description = "Unidad Detenida")
        }
    }
}

@Composable
fun InfoButton(drawableId: Int, description: String) {
    Column(
        modifier = Modifier
            .size(90.dp)
            .background(AppTealColor, RoundedCornerShape(12.dp))
            .clickable { /* AQUI VAN LAS ACCIONES DEL BOTON */ },
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Image(
            painter = painterResource(id = drawableId),
            contentDescription = description,
            modifier = Modifier.size(48.dp)
        )

        Spacer(modifier = Modifier.height(4.dp))

        Text(
            text = description,
            color = Color.White,
            fontSize = 10.sp,
            fontWeight = FontWeight.Normal,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}

@Preview(showBackground = true)
@Composable
fun DefaultPreview() {
    BotoneraOperadorTheme {
        BotoneraScreen(navController = rememberNavController())
    }
}//Hola
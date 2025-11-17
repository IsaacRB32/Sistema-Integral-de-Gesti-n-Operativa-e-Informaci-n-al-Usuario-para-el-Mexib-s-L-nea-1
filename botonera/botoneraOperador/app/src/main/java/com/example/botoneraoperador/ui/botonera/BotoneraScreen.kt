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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.style.TextAlign


import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import kotlinx.coroutines.delay
import java.time.LocalTime
import java.time.format.DateTimeFormatter


val AppTealColor = Color(0xFF3D6D7A)


@Composable
fun BotoneraScreen(navController: NavHostController) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White)
    ) {
        TopBar()
        IconGrid()
    }
}


@Composable
fun TopBar() {
    val formatter = remember { DateTimeFormatter.ofPattern("HH:mm") }
    var currentTime by remember { mutableStateOf("") }

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
        // Botón de Menú
        Box(
            modifier = Modifier
                .size(40.dp)
                .background(Color.White, RoundedCornerShape(8.dp)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Menu,
                contentDescription = "Menú",
                tint = AppTealColor,
                modifier = Modifier.size(30.dp)
            )
        }

        Spacer(modifier = Modifier.weight(1f))

        // Reloj
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
            .fillMaxHeight()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceAround
    ) {

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly // Distribuye los 4 botones
        ) {
            InfoButton(drawableId = R.drawable.bloqueo_manif, description = "Bloqueos")
            InfoButton(drawableId = R.drawable.colision_terceros, description = "Colisión Terceros")
            InfoButton(drawableId = R.drawable.colision_unidad, description = "Colisión Unidad")
            InfoButton(drawableId = R.drawable.fallas_tecnicas, description = "Fallas Técnicas")
        }


        Row(

            modifier = Modifier.fillMaxWidth(0.75f),
            horizontalArrangement = Arrangement.SpaceEvenly // Distribuye los 3 botones
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
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.padding(1.dp)
    ) {

        Box(

            modifier = Modifier
                .size(90.dp)
                .background(AppTealColor, RoundedCornerShape(3.dp))
                .clickable { /* AQUI VAN LAS ACCIONES DEL BOTON */ },
            contentAlignment = Alignment.Center
        ) {
            Image(
                painter = painterResource(id = drawableId),
                contentDescription = description,
                modifier = Modifier.fillMaxSize().padding(1.5.dp),
                contentScale = ContentScale.Fit
            )
        }


        Spacer(modifier = Modifier.height(3.dp))

        Text(
            text = description,
            color = Color.Black,
            fontSize = 12.sp,
            fontWeight = FontWeight.Normal,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
            textAlign = TextAlign.Center,

            modifier = Modifier.widthIn(min = 90.dp)
        )
    }
}


@Preview(showBackground = true)
@Composable
fun DefaultPreview() {
    BotoneraOperadorTheme {
        BotoneraScreen(navController = rememberNavController())
    }
}
package com.example.botoneraoperador.ui.botonera

import android.content.Context
import android.os.Build
import android.widget.Toast
import androidx.annotation.RequiresApi
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
import androidx.compose.ui.platform.LocalContext
import com.example.botoneraoperador.data.repository.IncidenciasRepository
import kotlinx.coroutines.delay
import org.json.JSONObject
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton


val AppTealColor = Color(0xFF3D6D7A)

@RequiresApi(Build.VERSION_CODES.O)
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


@RequiresApi(Build.VERSION_CODES.O)
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
    val context=LocalContext.current;
    val repo=IncidenciasRepository(context)
    var mostrarDialogo by remember {mutableStateOf(false)}
    var tipoIncidencia by remember { mutableStateOf("") }
    var descripcionIncidencia by remember { mutableStateOf("") }

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
            InfoButton(
                drawableId = R.drawable.bloqueo_manif, description = "Bloqueos"
            ){
                tipoIncidencia="Bloqueo"
                descripcionIncidencia="Se presenta un bloqueo en el recorrido debido a una manifestación"
                mostrarDialogo=true
            }
            InfoButton(
                drawableId = R.drawable.colision_terceros, description = "Colisión Terceros"
            ){
                tipoIncidencia="Colisión de Terceros"
                descripcionIncidencia="Se presenta una colisión entre dos autos particulares"
                mostrarDialogo=true
            }
            InfoButton(
                drawableId = R.drawable.colision_unidad, description = "Colisión Unidad"
            ){
                tipoIncidencia="Colisión de Unidad"
                descripcionIncidencia="La unidad está involucrada en una colisión con otro vehículo"
                mostrarDialogo=true
            }
            InfoButton(
                drawableId = R.drawable.fallas_tecnicas, description = "Fallas Técnicas"
            ){
                tipoIncidencia="Fallas Técnicas"
                descripcionIncidencia="La unidad presenta fallas técnicas"
                mostrarDialogo=true
            }
        }


        Row(

            modifier = Modifier.fillMaxWidth(0.75f),
            horizontalArrangement = Arrangement.SpaceEvenly // Distribuye los 3 botones
        ) {
            InfoButton(
                drawableId = R.drawable.incidente_estacion, description = "Inc. Estación"
            ){
                tipoIncidencia="Incidencia en Estación"
                descripcionIncidencia="Se ha presentado un incidente dentro de una estación"
                mostrarDialogo=true
            }
            InfoButton(
                drawableId = R.drawable.inundacion, description = "Inundación"
            ){
                tipoIncidencia="Inundación"
                descripcionIncidencia="Un tramo del recorrido presenta afectaciones por inundación"
                mostrarDialogo=true
            }
            InfoButton(
                drawableId = R.drawable.unidad_detenida, description = "Unidad Detenida"
            ){
                tipoIncidencia="Unidad Detenida"
                descripcionIncidencia="La unidad se encuentra detenida en un tramo del recorrido"
                mostrarDialogo=true
            }
        }
    }
    ConfirmDialog(
        mostrar=mostrarDialogo,
        tipo=tipoIncidencia,
        descripcion=descripcionIncidencia,
        unidad=1258,
        operador=3,
        onCorfirm = {
            mostrarDialogo=false
            reportar(descripcionIncidencia, repo, context)
        },
        onCancel = {
            mostrarDialogo=false
        }
    )
}

@Composable
fun ConfirmDialog(
    mostrar: Boolean,
    tipo: String,
    descripcion: String,
    unidad: Int,
    operador: Int,
    onCorfirm: () -> Unit,
    onCancel: () -> Unit
){
    if(mostrar){
        AlertDialog(
            onDismissRequest={ onCancel() },
            title = {Text("Confirmar incidencia")},
            text={
                Text(
                    "Se enviará una la incidencia de tipo: $tipo\n\n"+
                            "Descripción: $descripcion\n"+
                            "Unidad: $unidad\n"+
                            "Operador: $operador\n\n"+
                            "¿Desea confirmar el envío?"
                )
            },
            confirmButton = {
                TextButton(onClick = onCorfirm){
                    Text("Aceptar")
                }
            },
            dismissButton = {
                TextButton(onClick = onCancel){
                    Text("Cancelar")
                }
            }
        )
    }
}
fun reportar(descripcion: String, repo: IncidenciasRepository, context: Context){
    val data= JSONObject().apply {
        put("descripcion", descripcion)
        put("id_cincidencia", 1)
        put("id_estacion", 1)
        put("id_usuario_reporta", 3)
    }

    val url="http://192.168.100.207:3000/api/operador/incidencias"

    repo.reportarIncidencia(
        url,
        data,
        onSuccess = { respuesta ->
            Toast.makeText(context, "Incidencia enviada correctamente", Toast.LENGTH_SHORT).show()
        },
        onError = { error ->
            Toast.makeText(context, "Error al enviar la incidencia. Intente más tarde", Toast.LENGTH_SHORT).show()
        }
    )
}

@Composable
fun InfoButton(drawableId: Int, description: String, onClick: () -> Unit){
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.padding(1.dp)
    ) {

        Box(

            modifier = Modifier
                .size(90.dp)
                .background(AppTealColor, RoundedCornerShape(3.dp))
                .clickable { onClick() },
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

@RequiresApi(Build.VERSION_CODES.O)
@Preview(showBackground = true)
@Composable
fun DefaultPreview() {
    BotoneraOperadorTheme {
        BotoneraScreen(navController = rememberNavController())
    }
}
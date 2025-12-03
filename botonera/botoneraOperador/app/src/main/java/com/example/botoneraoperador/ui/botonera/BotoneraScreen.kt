package com.example.botoneraoperador.ui.botonera

import android.os.Build
import androidx.annotation.RequiresApi
import androidx.compose.ui.res.painterResource
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton

// Responsive
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.runtime.collectAsState
import com.example.botoneraoperador.data.session.SessionManager
import com.example.botoneraoperador.ui.incidencias.IncidenciasViewModel
import androidx.lifecycle.viewmodel.compose.viewModel
import kotlinx.coroutines.delay
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

val AppTealColor = Color(0xFF378EA6)

// Botonera
@RequiresApi(Build.VERSION_CODES.O)
@Composable
fun BotoneraScreen(
    navController: NavHostController,
    viewModel: IncidenciasViewModel = viewModel()
) {
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White)
    ) {
        TopBar()
        IconGrid(viewModel)
    }
}

// Barra superior
@RequiresApi(Build.VERSION_CODES.O)
@Composable
fun TopBar() {
    val configuration = LocalConfiguration.current
    val isTablet = configuration.screenWidthDp > 600

    val timeFormatter = remember { DateTimeFormatter.ofPattern("HH:mm") }
    val dateFormatter = remember { DateTimeFormatter.ofPattern("dd/MM/yyyy") }
    var timeString by remember { mutableStateOf("") }
    var dateString by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        while (true) {
            val now = LocalDateTime.now()
            timeString = now.format(timeFormatter)
            dateString = now.format(dateFormatter)
            delay(1000L)
        }
    }

    val logoHeight = if (isTablet) 70.dp else 45.dp
    val dateSize = if (isTablet) 28.sp else 18.sp
    val timeSize = if (isTablet) 50.sp else 32.sp
    val paddingH = if (isTablet) 32.dp else 16.dp
    val paddingV = if (isTablet) 20.dp else 12.dp

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(AppTealColor)
            .padding(horizontal = paddingH, vertical = paddingV),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Image(
            painter = painterResource(id = R.drawable.mexibusicon),
            contentDescription = "Logo Mexibus",
            modifier = Modifier.height(logoHeight),
            contentScale = ContentScale.Fit
        )

        Spacer(modifier = Modifier.weight(1f))

        Text(
            text = dateString,
            color = Color.White,
            fontSize = dateSize,
            modifier = Modifier.padding(end = if (isTablet) 24.dp else 12.dp)
        )
        Text(
            text = timeString,
            color = Color.White,
            fontSize = timeSize,
            fontWeight = FontWeight.Bold
        )
    }
}

// Grid de botonera
@Composable
fun IconGrid(viewModel: IncidenciasViewModel) {
    val context = LocalContext.current
    val sessionManager = SessionManager(context)
    val idUsuario by sessionManager.userId.collectAsState(initial = -1)
    val idUnidad by sessionManager.userUnidad.collectAsState(initial = -1)
    var mostrarDialogo by remember { mutableStateOf(false) }
    var tipoIncidencia by remember { mutableStateOf("") }
    var descripcionIncidencia by remember { mutableStateOf("") }
    val configuration = LocalConfiguration.current
    val isTablet = configuration.screenWidthDp > 600
    val columnCount = if (isTablet) 4 else 2
    val gridPadding = if (isTablet) 32.dp else 16.dp
    val itemSpacing = if (isTablet) 24.dp else 12.dp

    // Mnesajes de IncidenciasViewModel
    val loading by viewModel.loading.collectAsState()
    val mensaje by viewModel.mensaje.collectAsState()

    // Loader
    if (loading) {
        AlertDialog(
            onDismissRequest = {},
            title = { Text("Enviando...") },
            text = { Text("Espere por favor") },
            confirmButton = {}
        )
    }

    // Mensaje del servidor
    mensaje?.let {
        AlertDialog(
            onDismissRequest = { viewModel.limpiarMensaje() },
            title = { Text("Información") },
            text = { Text(it) },
            confirmButton = {
                TextButton(onClick = { viewModel.limpiarMensaje() }) {
                    Text("Aceptar")
                }
            }
        )
    }

    LazyVerticalGrid(
        columns = GridCells.Fixed(columnCount),
        contentPadding = PaddingValues(gridPadding),
        verticalArrangement = Arrangement.spacedBy(itemSpacing),
        horizontalArrangement = Arrangement.spacedBy(itemSpacing),
        modifier = Modifier.fillMaxSize()
    ) {

        item {
            InfoButton(R.drawable.bloqueo_manif, "Bloqueos", isTablet) {
                tipoIncidencia = "Bloqueo por manifestación"
                descripcionIncidencia = "Se presenta un bloqueo en el recorrido debido a una manifestación"
                mostrarDialogo = true
            }
        }
        item {
            InfoButton(R.drawable.colision_terceros, "Colisión\nTerceros", isTablet) {
                tipoIncidencia = "Colisión de terceros"
                descripcionIncidencia = "Se presenta una colisión entre dos autos particulares"
                mostrarDialogo = true
            }
        }
        item {
            InfoButton(R.drawable.colision_unidad, "Colisión\nUnidad", isTablet) {
                tipoIncidencia = "Colisión de unidad"
                descripcionIncidencia = "La unidad está involucrada en una colisión con otro vehículo"
                mostrarDialogo = true
            }
        }
        item {
            InfoButton(R.drawable.fallas_tecnicas, "Fallas\nTécnicas", isTablet) {
                tipoIncidencia = "Fallas técnicas de la unidad"
                descripcionIncidencia = "La unidad presenta fallas técnicas"
                mostrarDialogo = true
            }
        }
        item {
            InfoButton(R.drawable.incidente_estacion, "Incidente\nEstación", isTablet) {
                tipoIncidencia = "Incidente en la estación"
                descripcionIncidencia = "Se ha presentado un incidente dentro de una estación"
                mostrarDialogo = true
            }
        }
        item {
            InfoButton(R.drawable.inundacion, "Inundación", isTablet) {
                tipoIncidencia = "Inundación"
                descripcionIncidencia = "Un tramo del recorrido presenta afectaciones por inundación"
                mostrarDialogo = true
            }
        }
        item {
            InfoButton(R.drawable.unidad_detenida, "Unidad\nDetenida", isTablet) {
                tipoIncidencia = "Unidad detenida en el carril"
                descripcionIncidencia = "La unidad se encuentra detenida en un tramo del recorrido"
                mostrarDialogo = true
            }
        }
        item {
            InfoButton(R.drawable.otra_incidencia, "Otra\nIncidencia", isTablet) {
                tipoIncidencia = "Otro"
                descripcionIncidencia = "La incidencia cae fuera de la clasificación predeterminada"
                mostrarDialogo = true
            }
        }
    }

    //Confirmacion
    ConfirmDialog(
        mostrar = mostrarDialogo,
        tipo = tipoIncidencia,
        descripcion = descripcionIncidencia,
        unidad = idUnidad,
        operador = idUsuario,
        onCorfirm = {
            mostrarDialogo = false

            viewModel.reportarIncidencia(
                context = context,
                idUnidad = idUnidad,
                tipoIncidencia = tipoIncidencia,
                descripcion = descripcionIncidencia,
                obtenerIdIncidencia = ::obtenerIdIncidencia
            ) {
                // Callback éxito
            }
        },
        onCancel = { mostrarDialogo = false }
    )
}
//ID para cada incidencia
fun obtenerIdIncidencia(tipo: String): Int {
    return when (tipo) {
        "Bloqueo por manifestación" -> 1
        "Inundación" -> 2
        "Colisión de unidad" -> 3
        "Colisión de terceros" -> 4
        "Fallas técnicas de la unidad" -> 5
        "Unidad detenida en el carril" -> 6
        "Incidente en la estación" -> 7
        "Otro" -> 8
        else -> 0
    }
}

//Dialogo de confirmacion
@Composable
fun ConfirmDialog(
    mostrar: Boolean,
    tipo: String,
    descripcion: String,
    unidad: Int,
    operador: Int,
    onCorfirm: () -> Unit,
    onCancel: () -> Unit
) {
    if (mostrar) {
        AlertDialog(
            onDismissRequest = { onCancel() },
            title = { Text("Confirmar incidencia") },
            text = {
                Text(
                    "Se enviará la incidencia de tipo: $tipo\n\n" +
                            "Descripción: $descripcion\n" +
                            "Unidad: $unidad\n" +
                            "Operador: $operador\n\n" +
                            "¿Desea confirmar el envío?"
                )
            },
            confirmButton = {
                TextButton(onClick = onCorfirm) { Text("Aceptar") }
            },
            dismissButton = {
                TextButton(onClick = onCancel) { Text("Cancelar") }
            }
        )
    }
}

//Boton de incidencia
@Composable
fun InfoButton(drawableId: Int, description: String, isTablet: Boolean, onClick: () -> Unit) {

    val iconPadding = if (isTablet) 30.dp else 16.dp
    val fontSize = if (isTablet) 20.sp else 13.sp
    val cornerRadius = if (isTablet) 24.dp else 16.dp

    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(1f)
                .background(AppTealColor, RoundedCornerShape(cornerRadius))
                .clickable { onClick() },
            contentAlignment = Alignment.Center
        ) {
            Image(
                painter = painterResource(id = drawableId),
                contentDescription = description,
                modifier = Modifier
                    .fillMaxSize()
                    .padding(iconPadding),
                contentScale = ContentScale.Fit
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = description,
            color = Color.Black,
            fontSize = fontSize,
            fontWeight = FontWeight.Medium,
            textAlign = TextAlign.Center,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis
        )
    }
}

//Preview
@RequiresApi(Build.VERSION_CODES.O)
@Preview(showBackground = true)
@Composable
fun DefaultPreview() {
    BotoneraOperadorTheme {
        BotoneraScreen(navController = rememberNavController())
    }
}
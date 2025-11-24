package com.example.botoneraoperador.ui.botonera

import android.content.Context
import android.os.Build
import android.widget.Toast
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
import com.example.botoneraoperador.data.repository.IncidenciasRepository
import kotlinx.coroutines.delay
import org.json.JSONObject
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton

//Importaciones para que sea Responsive
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.GridCells


val AppTealColor = Color(0xFF378EA6)

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
    val configuration = LocalConfiguration.current
    // Consideramos "Tableta" si el ancho es mayor a 600dp
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

    // Tamaños dinámicos
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
            modifier = Modifier
                .height(logoHeight)
                .wrapContentWidth(Alignment.Start),
            contentScale = ContentScale.Fit
        )

        Spacer(modifier = Modifier.weight(1f))

        Text(
            text = dateString,
            color = Color.White,
            fontSize = dateSize,
            fontWeight = FontWeight.Normal,
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

@Composable
fun IconGrid() {
    val context = LocalContext.current
    val repo = IncidenciasRepository(context)
    var mostrarDialogo by remember { mutableStateOf(false) }
    var tipoIncidencia by remember { mutableStateOf("") }
    var descripcionIncidencia by remember { mutableStateOf("") }

    // DETECCIÓN INTELIGENTE
    val configuration = LocalConfiguration.current
    val screenWidth = configuration.screenWidthDp
    val isTablet = screenWidth > 600

    // Si es tableta -> 4 columnas. Si es celular -> 2 columnas.
    val columnCount = if (isTablet) 4 else 2

    // Espaciado dinámico
    val gridPadding = if (isTablet) 32.dp else 16.dp
    val itemSpacing = if (isTablet) 24.dp else 12.dp

    // Usamos LazyVerticalGrid para que se acomode solo
    LazyVerticalGrid(
        columns = GridCells.Fixed(columnCount),
        contentPadding = PaddingValues(gridPadding),
        verticalArrangement = Arrangement.spacedBy(itemSpacing),
        horizontalArrangement = Arrangement.spacedBy(itemSpacing),
        modifier = Modifier.fillMaxSize()
    ) {
        // Aquí definimos los botones como items del grid
        item { InfoButton(R.drawable.bloqueo_manif, "Bloqueos", isTablet) {
            tipoIncidencia = "Bloqueo"; descripcionIncidencia = "Bloqueo en recorrido"; mostrarDialogo = true
        } }

        item { InfoButton(R.drawable.colision_terceros, "Colisión\nTerceros", isTablet) {
            tipoIncidencia = "Colisión Terceros"; descripcionIncidencia = "Choque de particulares"; mostrarDialogo = true
        } }

        item { InfoButton(R.drawable.colision_unidad, "Colisión\nUnidad", isTablet) {
            tipoIncidencia = "Colisión Unidad"; descripcionIncidencia = "Unidad chocada"; mostrarDialogo = true
        } }

        item { InfoButton(R.drawable.fallas_tecnicas, "Fallas\nTécnicas", isTablet) {
            tipoIncidencia = "Fallas Técnicas"; descripcionIncidencia = "Falla mecánica"; mostrarDialogo = true
        } }

        item { InfoButton(R.drawable.incidente_estacion, "Incidente\nEstación", isTablet) {
            tipoIncidencia = "Incidente Estación"; descripcionIncidencia = "Incidente en estación"; mostrarDialogo = true
        } }

        item { InfoButton(R.drawable.inundacion, "Inundación", isTablet) {
            tipoIncidencia = "Inundación"; descripcionIncidencia = "Tramo inundado"; mostrarDialogo = true
        } }

        item { InfoButton(R.drawable.unidad_detenida, "Unidad\nDetenida", isTablet) {
            tipoIncidencia = "Unidad Detenida"; descripcionIncidencia = "Unidad parada"; mostrarDialogo = true
        } }

        item { InfoButton(R.drawable.otra_incidencia, "Otra\nIncidencia", isTablet) {
            tipoIncidencia = "Otra Incidencia"; descripcionIncidencia = "Incidencia no listada"; mostrarDialogo = true
        } }
    }

    ConfirmDialog(
        mostrar = mostrarDialogo,
        tipo = tipoIncidencia,
        descripcion = descripcionIncidencia,
        unidad = 1258,
        operador = 3,
        onCorfirm = { mostrarDialogo = false; reportar(descripcionIncidencia, repo, context) },
        onCancel = { mostrarDialogo = false }
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
fun InfoButton(drawableId: Int, description: String, isTablet: Boolean, onClick: () -> Unit) {
    // Tamaños dinámicos basados en si es tableta o no
    val cardSize = if (isTablet) 180.dp else 110.dp // Grande en tablet, normal en cel
    val iconPadding = if (isTablet) 30.dp else 16.dp
    val fontSize = if (isTablet) 20.sp else 13.sp
    val cornerRadius = if (isTablet) 24.dp else 16.dp

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        // No ponemos padding externo aquí, el Grid se encarga de eso
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth() // Ocupa el ancho de la columna del grid
                .aspectRatio(1f) // Mantiene forma cuadrada perfecta
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

@RequiresApi(Build.VERSION_CODES.O)
@Preview(showBackground = true)
@Composable
fun DefaultPreview() {
    BotoneraOperadorTheme {
        BotoneraScreen(navController = rememberNavController())
    }
}
//Borra este comentario
@file:OptIn(ExperimentalMaterialApi::class)

package com.isaac.usuario.ui.home

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.ExperimentalMaterialApi
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.isaac.usuario.R
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import com.isaac.usuario.ui.utils.tiempoTranscurrido
import kotlinx.coroutines.delay
import com.isaac.usuario.ui.home.HomeViewModel

// COLOR PRINCIPAL (El azul de la botonera)
val AppTealColor = Color(0xFF00a1d3)

// Modelo de datos para las incidencias
data class IncidenciaData(
    val titulo: String,
    val tiempo: String,
    val estacion: String,
    val descripcion: String,
    val icono: ImageVector
)

@Composable
fun HomeScreen() {
    // 0: Inicio, 1: Incidencias, 2: Mapa, 3: Ajustes
    var selectedTab by remember { mutableIntStateOf(0) }
    val homeViewModel: HomeViewModel = viewModel()

    Scaffold(
        bottomBar = {
            UsuarioBottomBar(selectedTab = selectedTab) { index ->
                selectedTab = index
            }
        },
        containerColor = Color(0xFFF5F5F5) // Fondo gris muy claro
    ) { innerPadding ->
        Box(modifier = Modifier.padding(innerPadding).fillMaxSize()) {
            when (selectedTab) {
                0 -> InicioTabContent(homeViewModel)
                1 -> IncidenciasListTabContent()
                2 -> MapaFullTabContent()
                3 -> AjustesTabContent()
            }
        }
    }
}

// PESTAÑA 1: INICIO
@Composable
fun InicioTabContent(homeViewModel: HomeViewModel = viewModel()) {

    val context = LocalContext.current
    val ultimaIncidencia by homeViewModel.ultimaIncidencia
    val cargando by homeViewModel.cargando

    LaunchedEffect(Unit) {
        while (true) {
            homeViewModel.cargarUltimaIncidencia(context)
            delay(10_000)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(16.dp))

        // Encabezado
        Text(
            text = "¡Hola viajero!",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
            color = Color.Black,
            modifier = Modifier.fillMaxWidth()
        )
        Text(
            text = "Recuerda tomar precauciones antes de salir",
            style = MaterialTheme.typography.bodyLarge,
            color = Color.Gray,
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Tarjeta de Alerta Principal
        Text(
            text = "⚠️ Última incidencia reportada:",
            style = MaterialTheme.typography.labelLarge,
            color = Color.DarkGray,
            modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp)
        )

        when {
            cargando -> {
                CircularProgressIndicator()
            }

            ultimaIncidencia == null -> {
                Text(
                    text = "No hay incidencias activas",
                    color = Color.Gray
                )
            }
            else -> {
                val incidenciaUi = IncidenciaData(
                    titulo = ultimaIncidencia!!.nombre_incidencia,
                    tiempo = "Unidad ${ultimaIncidencia!!.id_unidad}",
                    estacion = tiempoTranscurrido(ultimaIncidencia!!.fecha_inicio),
                    descripcion = ultimaIncidencia!!.descripcion,
                    icono = Icons.Default.Warning
                )

                IncidentCard(data = incidenciaUi, esDestacada = true, limitarDescripcion = true)
            }
        }

        Spacer(modifier = Modifier.height(32.dp))

        // Sección de Ubicación (Mini Mapa)
        Text(
            text = "Tu ubicación actual:",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp)
        )

        //En esta parte estaria bueno poner el logo de cada estación
        Image(
            painter = painterResource(id = R.drawable.mapa),
            contentDescription = "Mini mapa",
            contentScale = ContentScale.Crop, // Recorta para llenar el cuadro bonito
            modifier = Modifier
                .fillMaxWidth()
                .height(200.dp)
                .clip(RoundedCornerShape(24.dp))
                .border(2.dp, Color.White, RoundedCornerShape(24.dp))
        )
    }
}


// PESTAÑA 2: LISTA DE INCIDENCIAS
@Composable
fun IncidenciasListTabContent(homeViewModel: HomeViewModel = viewModel()) {

    val context = LocalContext.current
    val incidencias by homeViewModel.incidencias
    val cargando by homeViewModel.cargando

    LaunchedEffect(Unit) {
        while (true) {
            homeViewModel.cargarIncidencias(context)
            delay(10_000)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(
            text = "Reportes en Tiempo Real",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
            color = AppTealColor,
            modifier = Modifier.padding(bottom = 16.dp)
        )

        when {
            cargando -> {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }

            incidencias.isEmpty() -> {
                Text(
                    text = "No hay incidencias registradas",
                    color = Color.Gray
                )
            }

            else -> {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                    contentPadding = PaddingValues(bottom = 16.dp)
                ) {
                    items(incidencias) { incidencia ->
                        IncidentCard(
                            data = IncidenciaData(
                                titulo = incidencia.nombre_incidencia,
                                tiempo = "Unidad ${incidencia.id_unidad}",
                                estacion = tiempoTranscurrido(incidencia.fecha_inicio),
                                descripcion = incidencia.descripcion,
                                icono = Icons.Default.Warning
                            ),
                            esDestacada = false,
                            limitarDescripcion = false
                        )
                    }
                }
            }
        }
    }
}

// PESTAÑA 3: MAPA COMPLETO
@Composable
fun MapaFullTabContent() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFEFEFEF)), // Fondo gris para enmarcar el mapa
        contentAlignment = Alignment.Center
    ) {
        // Imagen centrada y ajustada (Fit) para ver todo el mapa sin recortes
        Image(
            painter = painterResource(id = R.drawable.mapa),
            contentDescription = "Mapa Completo",
            contentScale = ContentScale.Fit,
            modifier = Modifier.fillMaxSize()
        )
    }
}


// PESTAÑA 4: AJUSTES
@Composable
fun AjustesTabContent() {
    // Estado del Switch (Por defecto true)
    var notificacionesEnabled by remember { mutableStateOf(true) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp)
    ) {
        Text(
            text = "Configuración",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 32.dp)
        )

        // Opción de Notificaciones
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color.White, RoundedCornerShape(12.dp))
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = if(notificacionesEnabled) Icons.Default.NotificationsActive else Icons.Default.NotificationsOff,
                    contentDescription = null,
                    tint = AppTealColor,
                    modifier = Modifier.size(28.dp)
                )
                Spacer(modifier = Modifier.width(16.dp))
                Column {
                    Text(text = "Notificaciones", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                    Text(
                        text = if (notificacionesEnabled) "Se notificarán incidentes" else "Notificaciones desactivadas",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.Gray
                    )
                }
            }

            Switch(
                checked = notificacionesEnabled,
                onCheckedChange = { notificacionesEnabled = it },
                colors = SwitchDefaults.colors(
                    checkedThumbColor = Color.White,
                    checkedTrackColor = AppTealColor
                )
            )
        }
    }
}


// COMPONENTE REUTILIZABLE: TARJETA DE INCIDENCIA
@Composable
fun IncidentCard(data: IncidenciaData, esDestacada: Boolean, limitarDescripcion: Boolean=false) {
    val containerColor = if (esDestacada) Color.White else Color.White
    val borderColor = if (esDestacada) AppTealColor else Color.Transparent
    val borderWidth = if (esDestacada) 2.dp else 0.dp
    val elevation = if (esDestacada) 8.dp else 2.dp

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = containerColor),
        elevation = CardDefaults.cardElevation(defaultElevation = elevation),
        border = BorderStroke(borderWidth, borderColor)
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Icono Circular
            Box(
                modifier = Modifier
                    .size(50.dp)
                    .background(AppTealColor.copy(alpha = 0.1f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = data.icono,
                    contentDescription = null,
                    tint = AppTealColor,
                    modifier = Modifier.size(24.dp)
                )
            }

            Spacer(modifier = Modifier.width(16.dp))

            // Textos
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = data.titulo,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = Color.Black
                )
                // Estación destacada
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Place, contentDescription = null, tint = Color.Gray, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = data.estacion,
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.SemiBold,
                        color = Color.DarkGray
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = data.descripcion,
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.Gray,
                    maxLines = if (limitarDescripcion) 2 else Int.MAX_VALUE
                )
            }

            // Tiempo
            Text(
                text = data.tiempo,
                style = MaterialTheme.typography.labelSmall,
                color = AppTealColor,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.align(Alignment.Top)
            )
        }
    }
}


// BARRA DE NAVEGACIÓN INFERIOR
@Composable
fun UsuarioBottomBar(selectedTab: Int, onTabSelected: (Int) -> Unit) {
    NavigationBar(
        containerColor = Color.White,
        tonalElevation = 10.dp
    ) {
        NavigationBarItem(
            icon = { Icon(Icons.Default.Home, contentDescription = "Inicio") },
            label = { Text("Inicio") },
            selected = selectedTab == 0,
            onClick = { onTabSelected(0) },
            colors = NavigationBarItemDefaults.colors(selectedIconColor = AppTealColor, selectedTextColor = AppTealColor, indicatorColor = AppTealColor.copy(alpha = 0.1f))
        )
        NavigationBarItem(
            icon = { Icon(Icons.Default.Warning, contentDescription = "Incidencias") }, // Icono Warning para lista de incidencias
            label = { Text("Alertas") },
            selected = selectedTab == 1,
            onClick = { onTabSelected(1) },
            colors = NavigationBarItemDefaults.colors(selectedIconColor = AppTealColor, selectedTextColor = AppTealColor, indicatorColor = AppTealColor.copy(alpha = 0.1f))
        )
        NavigationBarItem(
            icon = { Icon(Icons.Default.Map, contentDescription = "Mapa") }, // ICONO DE MAPA DOBLADO
            label = { Text("Mapa") },
            selected = selectedTab == 2,
            onClick = { onTabSelected(2) },
            colors = NavigationBarItemDefaults.colors(selectedIconColor = AppTealColor, selectedTextColor = AppTealColor, indicatorColor = AppTealColor.copy(alpha = 0.1f))
        )
        NavigationBarItem(
            icon = { Icon(Icons.Default.Settings, contentDescription = "Ajustes") },
            label = { Text("Ajustes") },
            selected = selectedTab == 3,
            onClick = { onTabSelected(3) },
            colors = NavigationBarItemDefaults.colors(selectedIconColor = AppTealColor, selectedTextColor = AppTealColor, indicatorColor = AppTealColor.copy(alpha = 0.1f))
        )
    }
}

@Preview(showBackground = true)
@Composable
fun HomeScreenPreview() {
    HomeScreen()
}
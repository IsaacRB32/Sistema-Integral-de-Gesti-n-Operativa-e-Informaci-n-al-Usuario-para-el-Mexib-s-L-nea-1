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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.isaac.usuario.R
import com.isaac.usuario.ui.recorrido.MiniRecorridoLinea1
import com.isaac.usuario.ui.recorrido.MiniRecorridoLinea1FullScreen
import com.isaac.usuario.ui.utils.tiempoTranscurrido
import kotlinx.coroutines.delay

// COLOR PRINCIPAL
val AppTealColor = Color(0xFF00a1d3)

// Modelo de datos
data class IncidenciaData(
    val titulo: String,
    val tiempo: String,
    val estacion: String,
    val descripcion: String,
    val iconoRes: Int
)

fun iconoDrawablePorIncidencia(nombre: String): Int {
    return when (nombre) {
        "Bloqueo por manifestación" -> R.drawable.bloqueomanifestacion
        "Inundación" -> R.drawable.inundacion
        "Colisión de unidad" -> R.drawable.colisionunidad
        "Colisión de terceros" -> R.drawable.colisionterceros
        "Fallas técnicas de la unidad" -> R.drawable.fallastecnicas
        "Unidad detenida en el carril" -> R.drawable.unidaddetenida
        "Incidente en la estación" -> R.drawable.incidenteestacion
        "Otro" -> R.drawable.otraincidencia
        else -> R.drawable.otraincidencia
    }
}

@Composable
fun HomeScreen() {
    var selectedTab by remember { mutableIntStateOf(0) }
    val homeViewModel: HomeViewModel = viewModel()

    Scaffold(
        bottomBar = {
            UsuarioBottomBar(selectedTab = selectedTab) { index ->
                selectedTab = index
            }
        },
        containerColor = Color(0xFFF5F5F5)
    ) { innerPadding ->
        Box(modifier = Modifier.padding(innerPadding).fillMaxSize()) {
            when (selectedTab) {
                0 -> InicioTabContent(homeViewModel)
                1 -> IncidenciasListTabContent(homeViewModel)
                2 -> MapaFullTabContent()
                3 -> AjustesTabContent() // Ahora es la pestaña de Información
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

        Text(
            text = "¡Hola, pasajer@!",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
            color = AppTealColor,
            modifier = Modifier.fillMaxWidth()
        )
        Text(
            text = "Recuerda tomar precauciones.",
            style = MaterialTheme.typography.bodyLarge,
            color = Color.Gray,
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = "⚠️ Última incidencia reportada:",
            style = MaterialTheme.typography.titleMedium,
            color = Color.DarkGray,
            modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp)
        )

        when {
            cargando -> CircularProgressIndicator()
            ultimaIncidencia == null -> Text(text = "No hay incidencias activas", color = Color.Gray)
            else -> {
                val incidenciaUi = IncidenciaData(
                    titulo = ultimaIncidencia!!.nombre_incidencia,
                    tiempo = "Unidad ${ultimaIncidencia!!.id_unidad}",
                    estacion = tiempoTranscurrido(ultimaIncidencia!!.fecha_inicio),
                    descripcion = ultimaIncidencia!!.descripcion,
                    iconoRes = iconoDrawablePorIncidencia(
                        ultimaIncidencia!!.nombre_incidencia
                    )
                )
                IncidentCard(data = incidenciaUi, esDestacada = true, limitarDescripcion = true)
            }
        }

        Spacer(modifier = Modifier.height(32.dp))

        Text(
            text = "Consulta el estado del recorrido",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp)
        )

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(300.dp)
                .clip(RoundedCornerShape(24.dp))
                .border(2.dp, Color.White, RoundedCornerShape(24.dp))
        ) {
            MiniRecorridoLinea1(
                modifier = Modifier.fillMaxSize()
            )
        }
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
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            }
            incidencias.isEmpty() -> {
                Text(text = "No hay incidencias registradas", color = Color.Gray)
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
                                iconoRes = iconoDrawablePorIncidencia(
                                    incidencia.nombre_incidencia
                                )
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
    MiniRecorridoLinea1FullScreen(
        modifier = Modifier.fillMaxSize()
    )
}

// ==========================================
// PESTAÑA 4: INFORMACIÓN (Antes Ajustes)
// ==========================================
@Composable
fun AjustesTabContent() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        // --- SECCIÓN 1: HORARIOS ---
        Text(
            text = "Horario del sistema de transporte",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
            color = Color.Black,
            modifier = Modifier.padding(bottom = 16.dp)
        )

        Card(
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {

                // --- LUNES A VIERNES ---
                ScheduleBadge(text = "Lunes a viernes")
                Spacer(modifier = Modifier.height(12.dp))

                ScheduleHeader() // Encabezados de tabla
                ScheduleRow("Terminal Ojo de agua", "4:00 hrs", "01:40 hrs")
                ScheduleRow("Terminal Cd. Azteca", "4:00 hrs", "01:40 hrs")

                Spacer(modifier = Modifier.height(24.dp))

                // --- SÁBADO Y DOMINGO ---
                ScheduleBadge(text = "Sábado y domingo")
                Spacer(modifier = Modifier.height(12.dp))

                ScheduleHeader() // Encabezados de tabla
                ScheduleRow("Terminal Ojo de agua", "4:10 hrs", "01:37 hrs")
                ScheduleRow("Terminal Cd. Azteca", "4:10 hrs", "01:37 hrs")
            }
        }

        Spacer(modifier = Modifier.height(32.dp))

        // --- SECCIÓN 2: TARIFA ---
        Text(
            text = "Tarifa del sistema de transporte",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
            color = Color.Black,
            modifier = Modifier.padding(bottom = 16.dp)
        )

        // TARJETA CON IMAGEN REAL
        Card(
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(220.dp), // Ajusta la altura según se vea mejor tu imagen
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
        ) {
            Image(
                painter = painterResource(id = R.drawable.tarjetamexibus),
                contentDescription = "Tarjeta Movimex",
                contentScale = ContentScale.Crop, // "Crop" recorta para llenar, "Fit" ajusta para verse completa
                modifier = Modifier.fillMaxSize()
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        // --- SECCIÓN 3: DESGLOSE DE TARIFAS (Versión Bonita) ---
        Text(
            text = "Desglose de Tarifas",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = Color.Black,
            modifier = Modifier.padding(bottom = 12.dp)
        )

        Card(
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {

                // Renglón 1: General
                FareRow(
                    category = "Público General",
                    price = "$10.00",
                    description = "Tarifa base por viaje"
                )

                HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp), color = Color.LightGray.copy(alpha = 0.5f))

                // Renglón 2: Estudiantes
                FareRow(
                    category = "Estudiantes",
                    price = "$7.00",
                    description = "Presentando credencial vigente"
                )

                HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp), color = Color.LightGray.copy(alpha = 0.5f))

                // Renglón 3: Mujeres con Bienestar
                FareRow(
                    category = "Mujeres del Bienestar",
                    price = "$9.50",
                    description = "Con tarjeta del programa"
                )

                HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp), color = Color.LightGray.copy(alpha = 0.5f))

                // Renglón 4: Grupos Vulnerables (Gratis)
                // Aquí usamos un diseño especial para que resalte la gratuidad
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Acceso Gratuito",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            color = Color.Black
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "• Niños menores de 5 años\n• Personas con discapacidad\n• Adultos mayores (60+)",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.Gray,
                            lineHeight = 16.sp
                        )
                    }

                    // Etiqueta "GRATIS"
                    Surface(
                        color = AppTealColor, // O puedes usar un verde Color(0xFF4CAF50)
                        shape = RoundedCornerShape(50),
                        modifier = Modifier.padding(start = 8.dp)
                    ) {
                        Text(
                            text = "GRATIS",
                            color = Color.White,
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                        )
                    }
                }
            }
        }

        // Espacio final para que no quede pegado al borde
        Spacer(modifier = Modifier.height(80.dp))
    }
}

// --- COMPONENTES AUXILIARES PARA EL HORARIO ---

@Composable
fun ScheduleBadge(text: String) {
    Surface(
        color = AppTealColor,
        shape = RoundedCornerShape(4.dp),
    ) {
        Text(
            text = text,
            color = Color.White,
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
        )
    }
}

@Composable
fun ScheduleHeader() {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.End
    ) {
        // Espacio vacío para alinear con el nombre de terminal
        Spacer(modifier = Modifier.weight(1f))

        Text(
            text = "Primera salida",
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold,
            color = Color.Black,
            modifier = Modifier.width(80.dp),
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = "Ultima salida",
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold,
            color = Color.Black,
            modifier = Modifier.width(80.dp),
            textAlign = TextAlign.Center
        )
    }
}

@Composable
fun ScheduleRow(station: String, firstTime: String, lastTime: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = station,
            style = MaterialTheme.typography.bodySmall,
            color = Color.DarkGray,
            modifier = Modifier.weight(1f)
        )

        Text(
            text = firstTime,
            style = MaterialTheme.typography.bodySmall,
            color = Color.Black,
            fontWeight = FontWeight.Medium,
            modifier = Modifier.width(80.dp),
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = lastTime,
            style = MaterialTheme.typography.bodySmall,
            color = Color.Black,
            fontWeight = FontWeight.Medium,
            modifier = Modifier.width(80.dp),
            textAlign = TextAlign.Center
        )
    }
}


// COMPONENTE REUTILIZABLE: TARJETA DE INCIDENCIA
@Composable
fun IncidentCard(data: IncidenciaData, esDestacada: Boolean, limitarDescripcion: Boolean = false) {
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
            verticalAlignment = Alignment.Top
        ) {
            Image(
                painter = painterResource(id = data.iconoRes),
                contentDescription = null,
                modifier = Modifier
                    .size(48.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .border(width = 1.dp, color = Color.White, shape = RoundedCornerShape(10.dp)),
                contentScale = ContentScale.Crop
            )
            Spacer(modifier = Modifier.width(16.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = data.titulo,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = Color.Black
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Timer, contentDescription = null, tint = Color.Gray, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = data.estacion,
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.SemiBold,
                        color = Color.DarkGray
                    )
                }
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = data.descripcion,
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.Gray,
                    maxLines = if (limitarDescripcion) 2 else Int.MAX_VALUE,
                    overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                )
            }
            Spacer(modifier = Modifier.width(8.dp))
        }
    }
}

// TARJETA DE TARIFAS
@Composable
fun FareRow(category: String, price: String, description: String? = null) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Lado Izquierdo: Categoría y descripción
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = category,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                color = Color.Black
            )
            if (description != null) {
                Text(
                    text = description,
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.Gray
                )
            }
        }

        // Lado Derecho: El Precio en una burbuja gris tenue
        Surface(
            color = Color(0xFFF0F0F0),
            shape = RoundedCornerShape(8.dp)
        ) {
            Text(
                text = price,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = AppTealColor, // El precio usa el color de tu app
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
            )
        }
    }
}

// BARRA DE NAVEGACIÓN
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
            icon = { Icon(Icons.Default.Warning, contentDescription = "Incidencias") },
            label = { Text("Alertas") },
            selected = selectedTab == 1,
            onClick = { onTabSelected(1) },
            colors = NavigationBarItemDefaults.colors(selectedIconColor = AppTealColor, selectedTextColor = AppTealColor, indicatorColor = AppTealColor.copy(alpha = 0.1f))
        )
        NavigationBarItem(
            icon = { Icon(Icons.Default.Map, contentDescription = "Mapa") },
            label = { Text("Mapa") },
            selected = selectedTab == 2,
            onClick = { onTabSelected(2) },
            colors = NavigationBarItemDefaults.colors(selectedIconColor = AppTealColor, selectedTextColor = AppTealColor, indicatorColor = AppTealColor.copy(alpha = 0.1f))
        )
        NavigationBarItem(
            icon = { Icon(Icons.Default.Info, contentDescription = "Info.") },
            label = { Text("Info.") },
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
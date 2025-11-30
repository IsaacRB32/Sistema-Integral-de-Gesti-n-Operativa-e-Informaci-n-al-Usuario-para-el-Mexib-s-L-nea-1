package com.example.botoneraoperador.navigation

import android.os.Build
import androidx.annotation.RequiresApi
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.example.botoneraoperador.data.session.SessionManager
import com.example.botoneraoperador.ui.login.LoginScreen
import com.example.botoneraoperador.ui.botonera.BotoneraScreen
import kotlinx.coroutines.flow.collectLatest
@RequiresApi(Build.VERSION_CODES.O)
@Composable
fun AppNavigation() {

    //Arranque de la app si es que existe sesión o no
    val navController: NavHostController = rememberNavController()
    val context=androidx.compose.ui.platform.LocalContext.current
    val sessionManager=remember{ SessionManager(context) }
    var startDestination by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        sessionManager.isLoggedIn.collectLatest { logged ->
            startDestination = if (logged) "botonera" else "login"
        }
    }

    if(startDestination==null) return

    NavHost(
        navController = navController,
        startDestination = startDestination!!
    ) {
        composable("login") { LoginScreen(navController) }
        composable("botonera") { BotoneraScreen(navController) }
    }
}
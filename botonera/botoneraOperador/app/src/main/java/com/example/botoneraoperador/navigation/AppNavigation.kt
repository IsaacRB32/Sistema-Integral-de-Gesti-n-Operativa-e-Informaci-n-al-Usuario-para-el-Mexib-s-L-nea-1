package com.example.botoneraoperador.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.example.botoneraoperador.ui.login.LoginScreen
import com.example.botoneraoperador.ui.botonera.BotoneraScreen

@Composable
fun AppNavigation() {

    val navController: NavHostController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = "login"
    ) {
        composable("login") { LoginScreen(navController) }
        composable("botonera") { BotoneraScreen(navController) }
    }
}

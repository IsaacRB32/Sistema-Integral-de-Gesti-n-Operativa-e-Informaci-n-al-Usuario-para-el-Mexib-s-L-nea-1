package com.example.botoneraoperador.data.session
import android.content.Context
import androidx.datastore.preferences.core.edit
import com.example.botoneraoperador.data.session.UserSessionDataStore.KEY_IS_LOGGED_IN
import com.example.botoneraoperador.data.session.UserSessionDataStore.KEY_USER_EMAIL
import com.example.botoneraoperador.data.session.UserSessionDataStore.KEY_USER_ID
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
class SessionManager(private val context: Context){
    val isLoggedIn: Flow<Boolean> = context.dataStore.data
        .map { prefs -> prefs[KEY_IS_LOGGED_IN] ?: false }

    val userId: Flow<Int> = context.dataStore.data
        .map { prefs -> prefs[KEY_USER_ID] ?: -1 }

    val userEmail: Flow<String> = context.dataStore.data
        .map { prefs -> prefs[KEY_USER_EMAIL] ?: "" }
    suspend fun saveSession(idUsuario: Int, email: String) {
        context.dataStore.edit { prefs ->
            prefs[KEY_IS_LOGGED_IN] = true
            prefs[KEY_USER_ID] = idUsuario
            prefs[KEY_USER_EMAIL] = email
        }
    }
    suspend fun clearSession() {
        context.dataStore.edit { prefs ->
            prefs.clear()
        }
    }
}
package com.example.botoneraoperador.data.session
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
object UserSessionDataStore{
    val KEY_IS_LOGGED_IN=booleanPreferencesKey("is_logged_in")
    val KEY_USER_ID=intPreferencesKey("user_id")
    val KEY_USER_EMAIL=stringPreferencesKey("user_email")
}
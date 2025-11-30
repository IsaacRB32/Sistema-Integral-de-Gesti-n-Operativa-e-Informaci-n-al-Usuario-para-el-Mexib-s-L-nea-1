package com.example.botoneraoperador.data.session
import android.content.Context
import androidx.datastore.preferences.preferencesDataStore
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "user_session")
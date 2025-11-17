# Botonera del Operador (Arquitectura MVVM)

## Introducción

Este README documenta la arquitectura final adoptada para la aplicación móvil  
Botonera del Operador, implementada en **Kotlin + Jetpack Compose + MVVM**, y alineada  
con la arquitectura general del sistema Mexibús.

La organización en carpetas, el uso de ViewModels, repositorios y casos de uso  
garantizan un código más limpio, robusto y preparado para futuras ampliaciones.

---

# Botonera del Operador – Arquitectura MVVM (Android + Kotlin + Compose)

Este documento describe la estructura oficial del proyecto móvil **Botonera de Incidencias**  
para el operador del sistema Mexibús. Implementa un diseño moderno, escalable y mantenible utilizando:

- Jetpack Compose  
- MVVM  
- Navigation  
- Retrofit (API REST)  
- Clean Architecture (simple)

La app **NO usa WebSocket**, ya que su función es únicamente:

- realizar el inicio de sesión del operador  
- enviar incidencias al backend  

Los WebSockets se usan en otras aplicaciones del sistema (Usuario, Supervisor, SIP).

---

# Estructura del Proyecto (MVVM)

```
com.example.botoneraoperador
│
├─ MainActivity.kt
│
├─ navigation/
│     └─ AppNavigation.kt
│
├─ ui/
│   ├─ login/
│   │     ├─ LoginScreen.kt
│   │     └─ LoginViewModel.kt
│   │
│   ├─ botonera/
│   │     ├─ BotoneraScreen.kt
│   │     └─ BotoneraViewModel.kt
│   │
│   └─ theme/
│         ├─ Color.kt
│         ├─ Theme.kt
│         └─ Type.kt
│
├─ data/
│   ├─ model/
│   │     ├─ Operador.kt
│   │     └─ Incidencia.kt
│   │
│   ├─ repository/
│   │     ├─ AuthRepository.kt
│   │     └─ IncidenciaRepository.kt
│   │
│   └─ network/
│         ├─ ApiService.kt
│         └─ RetrofitClient.kt
│
└─ domain/
      └─ usecase/
            ├─ LoginUseCase.kt
            └─ EnviarIncidenciaUseCase.kt
```

---

# Arquitectura

MVVM separa correctamente:

- **View** (UI con Jetpack Compose)  
- **ViewModel** (lógica de presentación y manejo de estado)  
- **Repository** (acceso a datos remotos)

Esto permite que:

- la UI sea más simple de mantener  
- la lógica sea reutilizable y testeable  
- el acceso a datos pueda cambiarse sin modificar la UI  

**Navigation Compose** permite trabajar con una sola Activity (MainActivity) y múltiples pantallas:

- pantalla de Login  
- pantalla de Botonera  

**Retrofit** es suficiente porque la Botonera solo:

- hace login  
- envía incidencias vía API REST (por ejemplo, `POST /api/incidencias`)  

Los casos de uso encapsulan operaciones clave del dominio:

- `LoginUseCase`  
- `EnviarIncidenciaUseCase`  

---

# Flujo General del Sistema (Botonera)

```
UI → ViewModel → UseCase → Repository → API (Node.js)
```

### 1) Login
```
LoginScreen
  → LoginViewModel
  → LoginUseCase
  → AuthRepository
  → POST /api/login
```

### 2) Enviar incidencia
```
BotoneraScreen
  → BotoneraViewModel
  → EnviarIncidenciaUseCase
  → IncidenciaRepository
  → POST /api/incidencias
```

---

# Detalles por carpeta

## 1. Raíz del paquete: `com.example.botoneraoperador`

### **MainActivity.kt**
Responsabilidades:

- configurar el tema (`BotoneraOperadorTheme`)  
- invocar `AppNavigation()` dentro de `setContent { }`

Ejemplo:

```kotlin
setContent {
    BotoneraOperadorTheme {
        AppNavigation()
    }
}
```

---

## 2. Carpeta `navigation/`

### **AppNavigation.kt**
Define:

- `NavHost`  
- rutas  
- pantalla inicial  

Rutas mínimas esperadas:

- `"login"` → LoginScreen  
- `"botonera"` → BotoneraScreen  

---

## 3. Carpeta `ui/`

### 3.1 `ui/login/`

#### **LoginScreen.kt**
Pantalla con:

- campo Usuario  
- campo Contraseña  
- botón de iniciar sesión  
- mensajes de error  

#### **LoginViewModel.kt**
Maneja:

- estado de usuario y contraseña  
- validaciones  
- llamada a `LoginUseCase`  
- errores y éxito de login  

---

### 3.2 `ui/botonera/`

#### **BotoneraScreen.kt**
Pantalla principal del operador:

- botones de incidencias  
- info del operador (opcional)  
- confirmación al enviar  

#### **BotoneraViewModel.kt**
Se encarga de:

- función `enviarIncidencia()`  
- administrar estado (exitoso/error)  
- llamar `EnviarIncidenciaUseCase`  

---

### 3.3 `ui/theme/`

- Color.kt  
- Theme.kt  
- Type.kt  

Define:

- colores  
- tipografías  
- estilos  

---

## 4. Carpeta `data/`

### 4.1 `data/model/`

#### **Operador.kt**
Representa un operador autenticado.

#### **Incidencia.kt**
Representa una incidencia enviada.

---

### 4.2 `data/repository/`

#### **AuthRepository.kt**
Realiza login.

#### **IncidenciaRepository.kt**
Envía incidencias al backend.

---

### 4.3 `data/network/`

#### **ApiService.kt**
Define endpoints:

```kotlin
@POST("/api/login")
@POST("/api/incidencias")
```

#### **RetrofitClient.kt**
Contiene:

- BaseURL  
- Gson/Moshi  
- OkHttpClient  

---

## 5. Carpeta `domain/usecase/`

#### **LoginUseCase.kt**
Caso de uso para login.

#### **EnviarIncidenciaUseCase.kt**
Caso de uso para enviar incidencias.

---



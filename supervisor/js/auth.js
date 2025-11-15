// Manejo de autenticación del lado del cliente

/**
 * Iniciar sesión
 */
async function login(email, password) {
  const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGIN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  
  if (data.ok) {
    localStorage.setItem(API_CONFIG.STORAGE_KEYS.TOKEN, data.token);
    localStorage.setItem(API_CONFIG.STORAGE_KEYS.USER, JSON.stringify(data.usuario));
    return { success: true, usuario: data.usuario };
  } else {
    return { success: false, error: data.error };
  }
}

/**
 * Cerrar sesión
 */
function logout() {
  localStorage.removeItem(API_CONFIG.STORAGE_KEYS.TOKEN);
  localStorage.removeItem(API_CONFIG.STORAGE_KEYS.USER);
  window.location.href = 'login.html';
}

/**
 * Obtener usuario actual
 */
function getCurrentUser() {
  const userStr = localStorage.getItem(API_CONFIG.STORAGE_KEYS.USER);
  return userStr ? JSON.parse(userStr) : null;
}

/**
 * Verificar si hay sesión activa
 */
function isAuthenticated() {
  return !!localStorage.getItem(API_CONFIG.STORAGE_KEYS.TOKEN);
}

/**
 * Verificar autenticación en páginas protegidas
 */
function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
  }
}

/**
 * Verificar si ya está autenticado (para login)
 */
function redirectIfAuthenticated() {
  if (isAuthenticated()) {
    window.location.href = 'index.html';
  }
}
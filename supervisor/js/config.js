// Configuración de la API
const API_CONFIG = {
  BASE_URL: 'http://localhost:3000/api',
  ENDPOINTS: {
    LOGIN: '/login',
    VERIFY: '/verify',
    SNAPSHOT: '/sim/snapshot',
    INCIDENCIAS: '/supervisor/incidencias',
    UNIDADES: '/supervisor/unidades',
    RESOLVER: '/sim/resolver'
  },
  STORAGE_KEYS: {
    TOKEN: 'mexibus_token',
    USER: 'mexibus_user'
  }
};

// Utilidad para hacer peticiones autenticadas
async function fetchAPI(endpoint, options = {}) {
  const token = localStorage.getItem(API_CONFIG.STORAGE_KEYS.TOKEN);
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  };

  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, config);
    const data = await response.json();
    
    // Si el token expiró, redirigir al login
    if (response.status === 401) {
      localStorage.removeItem(API_CONFIG.STORAGE_KEYS.TOKEN);
      localStorage.removeItem(API_CONFIG.STORAGE_KEYS.USER);
      window.location.href = 'login.html';
      return null;
    }
    
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('Error en petición:', error);
    return { ok: false, error: error.message };
  }
}
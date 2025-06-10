// client-web/src/services/apiClient.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // Lee la URL base del .env
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Peticiones:
// Este código se ejecuta ANTES de que cada petición sea enviada.
// Su propósito es añadir el token JWT a las cabeceras si existe.
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken'); // Buscamos el token en localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config; // Continuar con la petición (con el token añadido si existía)
  },
  (error) => {
    // Manejar errores de configuración de la petición
    return Promise.reject(error);
  }
);

export default apiClient;
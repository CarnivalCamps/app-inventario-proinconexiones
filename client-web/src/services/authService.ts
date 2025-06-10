// client-web/src/services/authService.ts
import apiClient from './apiClient';

// Define la estructura de los datos que enviamos para el login
export interface LoginPayload {
  nombre_usuario: string;
  password: string;
}

// Define la estructura de la respuesta esperada del backend al hacer login
export interface LoginResponse {
  message: string;
  token: string;
  // Podríamos añadir más datos del usuario si el backend los devolviera
  // por ejemplo: user: { id: number, nombre_completo: string, rol: string }
}

export const loginUser = async (payload: LoginPayload): Promise<LoginResponse> => {
  try {
    const response = await apiClient.post<LoginResponse>('/auth/login', payload);
    return response.data; // Devuelve solo los datos de la respuesta (ej. el token y el mensaje)
  } catch (error: any) {
    // Manejo de errores mejorado para dar mensajes más claros
    if (error.response && error.response.data && error.response.data.message) {
      // Si el backend envía un mensaje de error específico, úsalo
      throw new Error(error.response.data.message);
    } else if (error.request) {
      // La petición se hizo pero no se recibió respuesta (ej. servidor caído)
      throw new Error('Error de red o el servidor no responde. Inténtalo más tarde.');
    } else {
      // Algo más causó el error
      throw new Error('Ocurrió un error al intentar iniciar sesión.');
    }
  }
};

// Aquí podríamos añadir funciones para registerUser, getCurrentUser, logoutUser, etc. en el futuro.
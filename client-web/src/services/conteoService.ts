// client-web/src/services/conteoService.ts
import apiClient from './apiClient';
import type { ProductoFrontend } from './productService';
import type { UserFrontendSimple } from './solicitudService';

// --- INTERFACES PARA EL MÓDULO DE CONTEOS ---

interface MovimientoAjusteFrontend {
    id_movimiento: number;
    cantidad_convertida_a_primaria: number;
}

// ✅ CORREGIDO: Interface actualizada para coincidir con el componente
export interface DetalleConteoFrontend {
    id_detalle_conteo: number;
    stock_teorico_primaria: number;
    stock_fisico_contado_primaria: number;
    diferencia_primaria: number;
    ajuste_aplicado: boolean;
    notas_detalle_conteo: string | null;
    producto: ProductoFrontend;
    movimiento_ajuste: MovimientoAjusteFrontend | null;
}

// ✅ CORREGIDO: Interface actualizada para coincidir con el componente
export interface ConteoFisicoFrontend {
    id_conteo: number;
    fecha_inicio_conteo: string; // <-- Nombre consistente
    fecha_finalizacion_conteo: string | null; // <-- Nombre consistente
    estado_conteo: string;
    descripcion_motivo_conteo: string | null;
    notas_generales_conteo: string | null; // <-- Añadido
    usuario_responsable: UserFrontendSimple;
    detalles_conteo: DetalleConteoFrontend[]; // <-- Nombre consistente
}

// Payloads para las peticiones a la API
export interface IniciarConteoPayload {
    descripcion_motivo_conteo?: string;
    filtros_aplicados_info?: string;
    notas_generales_conteo?: string;
}

export interface DetalleConteoInput {
    id_producto_fk: number;
    stock_fisico_contado_primaria: number; // ✅ Hecho requerido
    notas_detalle_conteo?: string; // ✅ Simplificado
}

export interface FinalizarConteoPayload {
    notas_finalizacion?: string;
}

// --- FUNCIONES DEL SERVICIO ---

export const getConteos = async (): Promise<ConteoFisicoFrontend[]> => {
    try {
        const response = await apiClient.get<ConteoFisicoFrontend[]>('/conteos');
        return response.data;
    } catch (error: any) {
        console.error("Error al obtener los conteos:", error);
        throw new Error(error.response?.data?.message || 'Error al cargar los conteos.');
    }
};

export const getConteoById = async (id: number): Promise<ConteoFisicoFrontend> => {
    try {
        const response = await apiClient.get<ConteoFisicoFrontend>(`/conteos/${id}`);
        return response.data;
    } catch (error: any) {
        console.error(`Error al obtener el conteo con ID ${id}:`, error);
        throw new Error(error.response?.data?.message || 'Error al cargar el conteo.');
    }
};

export const iniciarConteo = async (payload: IniciarConteoPayload): Promise<ConteoFisicoFrontend> => {
    try {
        const response = await apiClient.post<ConteoFisicoFrontend>('/conteos', payload);
        return response.data;
    } catch (error: any) {
        console.error("Error al iniciar el conteo:", error);
        throw new Error(error.response?.data?.message || 'Error al iniciar el conteo.');
    }
};

export const addDetallesConteo = async (idConteo: number, payload: DetalleConteoInput[]): Promise<DetalleConteoFrontend[]> => {
    try {
        // DEBUG: Verificar el token y headers antes de la petición
        console.log('🔍 DEBUG - addDetallesConteo:');
        console.log('ID Conteo:', idConteo);
        console.log('Payload:', payload);
        
        // Verificar headers de autenticación
        const token = localStorage.getItem('token');
        console.log('Token en localStorage:', token ? 'Existe' : 'No existe');
        
        // Verificar configuración del apiClient
        console.log('apiClient defaults:', apiClient.defaults.headers);
        
        const response = await apiClient.post<DetalleConteoFrontend[]>(`/conteos/${idConteo}/detalles`, payload);
        console.log('✅ Respuesta exitosa:', response.data);
        return response.data;
    } catch (error: any) {
        console.error(`❌ Error al añadir detalles al conteo con ID ${idConteo}:`, error);
        
        // DEBUG: Información detallada del error
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Status Text:', error.response.statusText);
            console.log('Response Data:', error.response.data);
            console.log('Response Headers:', error.response.headers);
        }
        
        // Manejo específico del error 403
        if (error.response?.status === 403) {
            const errorMessage = error.response.data?.message || 'No tienes permisos para realizar esta acción.';
            throw new Error(`Acceso denegado: ${errorMessage}`);
        }
        
        throw new Error(error.response?.data?.message || 'Error al añadir detalles al conteo.');
    }
};

export const finalizarConteo = async (idConteo: number, payload: FinalizarConteoPayload): Promise<ConteoFisicoFrontend> => {
    try {
        const response = await apiClient.put<ConteoFisicoFrontend>(`/conteos/${idConteo}/finalizar`, payload);
        return response.data;
    } catch (error: any) {
        console.error(`Error al finalizar el conteo con ID ${idConteo}:`, error);
        throw new Error(error.response?.data?.message || 'Error al finalizar el conteo.');
    }
};

export const aplicarAjustesConteo = async (idConteo: number): Promise<ConteoFisicoFrontend> => {
    try {
        const response = await apiClient.post<ConteoFisicoFrontend>(`/conteos/${idConteo}/aplicar-ajustes`, {});
        return response.data;
    } catch (error: any) {
        console.error(`Error al aplicar ajustes al conteo con ID ${idConteo}:`, error);
        throw new Error(error.response?.data?.message || 'Error al aplicar los ajustes.');
    }
};
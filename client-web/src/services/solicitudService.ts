// client-web/src/services/solicitudService.ts
import apiClient from './apiClient';
import type { ProductoFrontend, UnidadMedidaFrontend } from './productService'; // Asumiendo que tienes estos tipos o similares

// Podrías tener un UserFrontend simple si lo necesitas
export interface UserFrontendSimple {
    id_usuario: number;
    nombre_usuario: string;
    nombre_completo?: string;
}

export interface DetalleSolicitudFrontend {
    id_detalle_solicitud: number;
    cantidad_solicitada: number;
    cantidad_solicitada_convertida_a_primaria: number;
    cantidad_aprobada_primaria: number | null;
    cantidad_entregada_primaria: number;
    stock_disponible_al_solicitar_primaria: number | null;
    producto: ProductoFrontend; // Usamos el tipo de producto del frontend
    unidad_medida_solicitada: UnidadMedidaFrontend;
}

export interface SolicitudReservaFrontend {
    id_solicitud: number;
    fecha_solicitud: string; // o Date
    proposito_solicitud: string;
    estado_solicitud: string;
    fecha_requerida_entrega: string | null; // o Date
    justificacion_detallada: string | null;
    fecha_procesamiento: string | null; // o Date
    razon_rechazo: string | null;
    notas_almacenista: string | null;
    fecha_entrega_efectiva: string | null; // o Date
    vendedor: UserFrontendSimple;
    almacenista_procesa: UserFrontendSimple | null;
    detalles_solicitud: DetalleSolicitudFrontend[];
    // fecha_creacion_registro, ultima_modificacion_registro (opcionales para mostrar)
}
export interface DetalleSolicitudInput {
    id_producto_fk: number;
    cantidad_solicitada: number;
    id_unidad_medida_solicitada_fk: number;
}

export interface CreateSolicitudPayload {
    proposito_solicitud: string;
    fecha_requerida_entrega?: string | null; // Formato YYYY-MM-DD
    justificacion_detallada?: string | null;
    detalles: DetalleSolicitudInput[];
}
export interface DetalleAprobadoInput {
    id_detalle_solicitud: number;
    cantidad_aprobada_primaria: number;
}

export interface AprobarSolicitudPayload {
    notas_almacenista?: string;
    detalles_aprobados: DetalleAprobadoInput[];
}
export interface RechazarSolicitudPayload {
    razon_rechazo: string;
    notas_almacenista?: string;
}
export interface EntregarSolicitudPayload {
    notas_entrega?: string;
}

export const getSolicitudes = async (): Promise<SolicitudReservaFrontend[]> => {
    try {
        const response = await apiClient.get<SolicitudReservaFrontend[]>('/solicitudes');
        return response.data;
    } catch (error: any) {
        console.error("Error al obtener las solicitudes de reserva:", error);
        throw new Error(error.response?.data?.message || 'Error al cargar las solicitudes.');
    }
};

export const getSolicitudById = async (id: number): Promise<SolicitudReservaFrontend> => {
    try {
        const response = await apiClient.get<SolicitudReservaFrontend>(`/solicitudes/${id}`);
        return response.data;
    } catch (error: any) {
        console.error(`Error al obtener la solicitud con ID ${id}:`, error);
        throw new Error(error.response?.data?.message || 'Error al cargar la solicitud.');
    }
};
export const createSolicitud = async (payload: CreateSolicitudPayload): Promise<SolicitudReservaFrontend> => {
    try {
        const response = await apiClient.post<SolicitudReservaFrontend>('/solicitudes', payload);
        return response.data;
    } catch (error: any) {
        console.error("Error al crear la solicitud de reserva:", error);
        throw new Error(error.response?.data?.message || 'Error al crear la solicitud.');
    }
};
export const aprobarSolicitud = async (id: number, payload: AprobarSolicitudPayload): Promise<SolicitudReservaFrontend> => {
    try {
        const response = await apiClient.put<SolicitudReservaFrontend>(`/solicitudes/${id}/aprobar`, payload);
        return response.data;
    } catch (error: any) {
        console.error(`Error al aprobar la solicitud con ID ${id}:`, error);
        throw new Error(error.response?.data?.message || 'Error al aprobar la solicitud.');
    }
};
export const rechazarSolicitud = async (id: number, payload: RechazarSolicitudPayload): Promise<SolicitudReservaFrontend> => {
    try {
        const response = await apiClient.put<SolicitudReservaFrontend>(`/solicitudes/${id}/rechazar`, payload);
        return response.data;
    } catch (error: any) {
        console.error(`Error al rechazar la solicitud con ID ${id}:`, error);
        throw new Error(error.response?.data?.message || 'Error al rechazar la solicitud.');
    }
};
export const entregarSolicitud = async (id: number, payload: EntregarSolicitudPayload): Promise<SolicitudReservaFrontend> => {
    try {
        const response = await apiClient.put<SolicitudReservaFrontend>(`/solicitudes/${id}/entregar`, payload);
        return response.data;
    } catch (error: any) {
        console.error(`Error al marcar como entregada la solicitud con ID ${id}:`, error);
        throw new Error(error.response?.data?.message || 'Error al procesar la entrega.');
    }
};

// Aquí añadiremos más adelante createSolicitud, aprobarSolicitud, etc.
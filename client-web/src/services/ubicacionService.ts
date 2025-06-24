// client-web/src/services/ubicacionService.ts
import apiClient from './apiClient';

export interface UbicacionFrontend {
    id_ubicacion: number;
    nombre: string;
    tipo: string | null;
    codigo_legible: string | null;
    descripcion: string | null;
    capacidad: number | null;
    padre: { id_ubicacion: number; nombre: string } | null;
    hijos: UbicacionFrontend[];
    pos_x: number | null;
    pos_y: number | null;
    width: number | null;
    height: number | null;
    slot_filas?: number;    // <--- AÑADIR ESTA LÍNEA
    slot_columnas?: number; // <--- Y ESTA LÍNEA
    // Nuevos campos para el mapa
    tipo_ubicacion?: string; // Para compatibilidad con el componente del mapa
}

// Interface para ubicaciones con información de stock de productos
export interface UbicacionConStock extends UbicacionFrontend {
    productos_en_ubicacion?: Array<{
        id_producto: number;
        nombre_producto: string;
        cantidad: number;
        sku: string;
    }>;
}

export interface CreateUbicacionPayload {
    nombre: string;
    tipo?: string | null;
    descripcion?: string | null;
    codigo_legible?: string | null;
    capacidad?: number | null;
    id_ubicacion_padre_fk?: number | null;
    pos_x?: number | null;
    pos_y?: number | null;
    width?: number | null;
    height?: number | null;
}

export type UpdateUbicacionPayload = Partial<CreateUbicacionPayload>;

// Función principal para obtener todas las ubicaciones (la que ya tenías)
export const getUbicacionesTree = async (): Promise<UbicacionFrontend[]> => {
    try {
        const response = await apiClient.get<UbicacionFrontend[]>('/ubicaciones');
        // Normalizamos los datos para el mapa
        return response.data.map(ubicacion => ({
            ...ubicacion,
            tipo_ubicacion: ubicacion.tipo || 'ubicacion' // Para compatibilidad
        }));
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Error al cargar las ubicaciones.');
    }
};

// Nueva función: obtener ubicaciones con información de stock
export const getUbicacionesConStock = async (): Promise<UbicacionConStock[]> => {
    try {
        const response = await apiClient.get<UbicacionConStock[]>('/ubicaciones/con-stock');
        return response.data.map(ubicacion => ({
            ...ubicacion,
            tipo_ubicacion: ubicacion.tipo || 'ubicacion'
        }));
    } catch (error: any) {
        // Si el endpoint no existe, fallback a ubicaciones normales
        console.warn('Endpoint con-stock no disponible, usando ubicaciones normales');
        return getUbicacionesTree();
    }
};

// Nueva función: obtener ubicaciones que contienen un producto específico
export const getUbicacionesDeProducto = async (idProducto: number): Promise<UbicacionFrontend[]> => {
    try {
        const response = await apiClient.get<UbicacionFrontend[]>(`/productos/${idProducto}/ubicaciones`);
        return response.data.map(ubicacion => ({
            ...ubicacion,
            tipo_ubicacion: ubicacion.tipo || 'ubicacion'
        }));
    } catch (error: any) {
        console.warn(`No se pudieron cargar las ubicaciones del producto ${idProducto}:`, error);
        return []; // Retorna array vacío si no se puede obtener la información
    }
};

// Función auxiliar: verificar si una ubicación contiene un producto específico
export const verificarProductoEnUbicacion = async (
    idUbicacion: number, 
    idProducto: number
): Promise<boolean> => {
    try {
        const response = await apiClient.get<{ tiene_producto: boolean }>(
            `/ubicaciones/${idUbicacion}/productos/${idProducto}`
        );
        return response.data.tiene_producto;
    } catch (error: any) {
        console.warn(`Error verificando producto en ubicación:`, error);
        return false;
    }
};

// Funciones originales (sin cambios)
export const createUbicacion = async (payload: CreateUbicacionPayload): Promise<UbicacionFrontend> => {
    try {
        const response = await apiClient.post<UbicacionFrontend>('/ubicaciones', payload);
        return {
            ...response.data,
            tipo_ubicacion: response.data.tipo || 'ubicacion'
        };
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Error al crear la ubicación.');
    }
};

export const updateUbicacion = async (id: number, payload: UpdateUbicacionPayload): Promise<UbicacionFrontend> => {
    try {
        const response = await apiClient.put<UbicacionFrontend>(`/ubicaciones/${id}`, payload);
        return {
            ...response.data,
            tipo_ubicacion: response.data.tipo || 'ubicacion'
        };
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Error al actualizar la ubicación.');
    }
};

export const deleteUbicacion = async (id: number): Promise<void> => {
    try {
        await apiClient.delete(`/ubicaciones/${id}`);
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Error al eliminar la ubicación.');
    }
};

// Función de utilidad: aplanar árbol de ubicaciones para el mapa
export const aplanarUbicaciones = (ubicaciones: UbicacionFrontend[]): UbicacionFrontend[] => {
    const resultado: UbicacionFrontend[] = [];
    
    const aplanar = (items: UbicacionFrontend[]) => {
        items.forEach(item => {
            resultado.push(item);
            if (item.hijos && item.hijos.length > 0) {
                aplanar(item.hijos);
            }
        });
    };
    
    aplanar(ubicaciones);
    return resultado;
};

// Función de utilidad: encontrar ubicación por ID en el árbol
export const encontrarUbicacionPorId = (
    ubicaciones: UbicacionFrontend[], 
    id: number
): UbicacionFrontend | null => {
    for (const ubicacion of ubicaciones) {
        if (ubicacion.id_ubicacion === id) {
            return ubicacion;
        }
        if (ubicacion.hijos && ubicacion.hijos.length > 0) {
            const encontrada = encontrarUbicacionPorId(ubicacion.hijos, id);
            if (encontrada) return encontrada;
        }
    }
    return null;
};
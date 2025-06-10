// client-web/src/services/movimientoService.ts
import apiClient from './apiClient';
import type { ProductoFrontend, UnidadMedidaFrontend } from './productService';
import type { UserFrontendSimple } from './solicitudService';

// --- INTERFACES PARA EL MÓDULO DE MOVIMIENTOS ---

interface TipoMovimientoFrontend {
    id_tipo_movimiento: number;
    nombre_tipo: string;
    efecto_stock: number; // 1, -1, o 0
}

// Usaremos un tipo más completo para la respuesta del historial
export interface MovimientoInventarioFrontend {
    id_movimiento: number;
    fecha_movimiento: string; // o Date
    cantidad_movida: number;
    cantidad_convertida_a_primaria: number;
    stock_anterior_primaria: number;
    stock_nuevo_primaria: number;
    referencia_documento: string | null;
    notas_adicionales: string | null;
    producto: ProductoFrontend;
    usuario: UserFrontendSimple;
    tipo_movimiento: TipoMovimientoFrontend;
    unidad_medida_movimiento: UnidadMedidaFrontend;
    // Las relaciones con solicitud y conteo también podrían venir aquí si se necesitan
}

interface GetMovimientosParams {
    id_producto_fk?: number;
    // Podríamos añadir más filtros aquí en el futuro: fecha_inicio, fecha_fin, etc.
}

// --- FUNCIONES DEL SERVICIO ---

export const getMovimientos = async (params: GetMovimientosParams): Promise<MovimientoInventarioFrontend[]> => {
    try {
        const response = await apiClient.get<MovimientoInventarioFrontend[]>('/movimientos', { params });
        return response.data;
    } catch (error: any) {
        console.error("Error al obtener el historial de movimientos:", error);
        throw new Error(error.response?.data?.message || 'Error al cargar el historial de movimientos.');
    }
};
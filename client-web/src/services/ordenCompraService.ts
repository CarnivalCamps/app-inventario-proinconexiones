// client-web/src/services/ordenCompraService.ts
import apiClient from './apiClient';
import type { ProductoFrontend } from './productService';
import type { UserFrontendSimple } from './solicitudService';
import type { ProveedorFrontend } from './proveedorService';

// --- INTERFACES PARA EL MÓDULO DE ORDENES DE COMPRA ---

export interface DetalleOrdenCompraFrontend {
    id_detalle_orden: number;
    cantidad_solicitada: number;
    costo_unitario: number;
    cantidad_recibida: number;
    producto: ProductoFrontend;
}

export interface OrdenCompraFrontend {
    id_orden_compra: number;
    fecha_emision: string;
    fecha_entrega_esperada: string | null;
    estado: string;
    subtotal: number | null;
    impuestos: number | null;
    total: number | null;
    notas: string | null;
    proveedor: ProveedorFrontend;
    usuario_creador: UserFrontendSimple;
    detalles: DetalleOrdenCompraFrontend[];
}

export interface DetalleOrdenInput {
    id_producto_fk: number;
    cantidad_solicitada: number;
    costo_unitario: number;
}

export interface CreateOrdenCompraPayload {
    id_proveedor_fk: number;
    fecha_emision: string;
    fecha_entrega_esperada?: string | null;
    notas?: string | null;
    detalles: DetalleOrdenInput[];
}
export interface DetalleRecepcionInput {
    id_detalle_orden: number;
    cantidad_recibida: number;
}



// Aquí irán los Payloads para crear, actualizar, etc.

// --- FUNCIONES DEL SERVICIO ---

export const getOrdenesCompra = async (): Promise<OrdenCompraFrontend[]> => {
    try {
        const response = await apiClient.get<OrdenCompraFrontend[]>('/ordenes-compra');
        return response.data;
    } catch (error: any) {
        console.error("Error al obtener las órdenes de compra:", error);
        throw new Error(error.response?.data?.message || 'Error al cargar las órdenes de compra.');
    }
};
export const getOrdenCompraById = async (id: number): Promise<OrdenCompraFrontend> => {
    try {
        const response = await apiClient.get<OrdenCompraFrontend>(`/ordenes-compra/${id}`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Error al cargar la orden de compra.');
    }
};

export const createOrdenCompra = async (payload: CreateOrdenCompraPayload): Promise<OrdenCompraFrontend> => {
    try {
        const response = await apiClient.post<OrdenCompraFrontend>('/ordenes-compra', payload);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Error al crear la orden de compra.');
    }

}
export const registrarRecepcion = async (idOrdenCompra: number, payload: DetalleRecepcionInput[]): Promise<OrdenCompraFrontend> => {
    try {
        const response = await apiClient.post<OrdenCompraFrontend>(`/ordenes-compra/${idOrdenCompra}/recepcion`, payload);
        return response.data;
    } catch (error: any) {
        console.error(`Error al registrar la recepción para la OC ID ${idOrdenCompra}:`, error);
        throw new Error(error.response?.data?.message || 'Error al registrar la recepción.');
    }
};
export const updateOrdenCompraEstado = async (id: number, payload: { nuevo_estado: string }): Promise<OrdenCompraFrontend> => {
    try {
        const response = await apiClient.put<OrdenCompraFrontend>(`/ordenes-compra/${id}/estado`, payload);
        return response.data;
    } catch (error: any) {
        console.error(`Error al actualizar estado de la OC ID ${id}:`, error);
        throw new Error(error.response?.data?.message || 'Error al actualizar el estado.');
    }
};
// Aquí añadiremos getOrdenById, createOrden, updateEstado, registrarRecepcion
// client-web/src/services/proveedorService.ts
import apiClient from './apiClient';

export interface ProveedorFrontend {
    id_proveedor: number;
    nombre_proveedor: string;
    contacto_nombre?: string | null;
    contacto_email?: string | null;
    contacto_telefono?: string | null;
    direccion?: string | null;
    notas?: string | null;
    // fecha_creacion y ultima_modificacion se pueden añadir si se quieren mostrar
}

export interface CreateProveedorPayload {
    nombre_proveedor: string;
    contacto_nombre?: string | null;
    contacto_email?: string | null;
    contacto_telefono?: string | null;
    direccion?: string | null;
    notas?: string | null;
}

export type UpdateProveedorPayload = Partial<CreateProveedorPayload>;

export const getProveedores = async (): Promise<ProveedorFrontend[]> => {
    try {
        const response = await apiClient.get<ProveedorFrontend[]>('/proveedores');
        return response.data;
    } catch (error: any) {
        console.error("Error al obtener proveedores:", error);
        throw new Error(error.response?.data?.message || 'Error al cargar los proveedores.');
    }
};

export const getProveedorById = async (id: number): Promise<ProveedorFrontend> => {
    try {
        const response = await apiClient.get<ProveedorFrontend>(`/proveedores/${id}`);
        return response.data;
    } catch (error: any) {
        console.error(`Error al obtener el proveedor con ID ${id}:`, error);
        throw new Error(error.response?.data?.message || 'Error al cargar el proveedor.');
    }
};

export const createProveedor = async (payload: CreateProveedorPayload): Promise<ProveedorFrontend> => {
    try {
        const response = await apiClient.post<ProveedorFrontend>('/proveedores', payload);
        return response.data;
    } catch (error: any) {
        console.error("Error al crear el proveedor:", error);
        throw new Error(error.response?.data?.message || 'Error al crear el proveedor.');
    }
};

export const updateProveedor = async (id: number, payload: UpdateProveedorPayload): Promise<ProveedorFrontend> => {
    try {
        const response = await apiClient.put<ProveedorFrontend>(`/proveedores/${id}`, payload);
        return response.data;
    } catch (error: any) {
        console.error(`Error al actualizar el proveedor con ID ${id}:`, error);
        throw new Error(error.response?.data?.message || 'Error al actualizar el proveedor.');
    }
};

export const deleteProveedor = async (id: number): Promise<void> => {
    try {
        await apiClient.delete(`/proveedores/${id}`);
    } catch (error: any) {
        console.error(`Error al eliminar el proveedor con ID ${id}:`, error);
        throw new Error(error.response?.data?.message || 'Error al eliminar el proveedor.');
    }
};
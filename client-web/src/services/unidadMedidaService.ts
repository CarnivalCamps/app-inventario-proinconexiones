// client-web/src/services/unidadMedidaService.ts
import apiClient from './apiClient';

export interface UnidadMedidaFrontend {
    id_unidad_medida: number;
    nombre_unidad: string;
    abreviatura: string;
}

export interface CreateUnidadMedidaPayload {
    nombre_unidad: string;
    abreviatura: string;
}

export type UpdateUnidadMedidaPayload = Partial<CreateUnidadMedidaPayload>;

export const getUnidadesMedida = async (): Promise<UnidadMedidaFrontend[]> => {
    try {
        const response = await apiClient.get<UnidadMedidaFrontend[]>('/unidades-medida');
        return response.data;
    } catch (error: any) {
        console.error("Error al obtener unidades de medida:", error);
        throw new Error(error.response?.data?.message || 'Error al cargar las unidades de medida.');
    }
};

export const getUnidadMedidaById = async (id: number): Promise<UnidadMedidaFrontend> => {
    try {
        const response = await apiClient.get<UnidadMedidaFrontend>(`/unidades-medida/${id}`);
        return response.data;
    } catch (error: any) {
        console.error(`Error al obtener la unidad de medida con ID ${id}:`, error);
        throw new Error(error.response?.data?.message || 'Error al cargar la unidad de medida.');
    }
};

export const createUnidadMedida = async (payload: CreateUnidadMedidaPayload): Promise<UnidadMedidaFrontend> => {
    try {
        const response = await apiClient.post<UnidadMedidaFrontend>('/unidades-medida', payload);
        return response.data;
    } catch (error: any) {
        console.error("Error al crear la unidad de medida:", error);
        throw new Error(error.response?.data?.message || 'Error al crear la unidad de medida.');
    }
};

export const updateUnidadMedida = async (id: number, payload: UpdateUnidadMedidaPayload): Promise<UnidadMedidaFrontend> => {
    try {
        const response = await apiClient.put<UnidadMedidaFrontend>(`/unidades-medida/${id}`, payload);
        return response.data;
    } catch (error: any) {
        console.error(`Error al actualizar la unidad de medida con ID ${id}:`, error);
        throw new Error(error.response?.data?.message || 'Error al actualizar la unidad de medida.');
    }
};

export const deleteUnidadMedida = async (id: number): Promise<void> => {
    try {
        await apiClient.delete(`/unidades-medida/${id}`);
    } catch (error: any) {
        console.error(`Error al eliminar la unidad de medida con ID ${id}:`, error);
        throw new Error(error.response?.data?.message || 'Error al eliminar la unidad de medida.');
    }
};
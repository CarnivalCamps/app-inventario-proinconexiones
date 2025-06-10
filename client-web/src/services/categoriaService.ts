// client-web/src/services/categoriaService.ts
import apiClient from './apiClient';

export interface CategoriaFrontend {
    id_categoria: number;
    nombre_categoria: string;
    descripcion_categoria?: string | null;
}

export interface CreateCategoriaPayload {
    nombre_categoria: string;
    descripcion_categoria?: string | null;
}

export type UpdateCategoriaPayload = Partial<CreateCategoriaPayload>;

export const getCategorias = async (): Promise<CategoriaFrontend[]> => {
    try {
        const response = await apiClient.get<CategoriaFrontend[]>('/categorias');
        return response.data;
    } catch (error: any) {
        console.error("Error al obtener categorías:", error);
        throw new Error(error.response?.data?.message || 'Error al cargar las categorías.');
    }
};

export const getCategoriaById = async (id: number): Promise<CategoriaFrontend> => {
    try {
        const response = await apiClient.get<CategoriaFrontend>(`/categorias/${id}`);
        return response.data;
    } catch (error: any) {
        console.error(`Error al obtener la categoría con ID ${id}:`, error);
        throw new Error(error.response?.data?.message || 'Error al cargar la categoría.');
    }
};

export const createCategoria = async (payload: CreateCategoriaPayload): Promise<CategoriaFrontend> => {
    try {
        const response = await apiClient.post<CategoriaFrontend>('/categorias', payload);
        return response.data;
    } catch (error: any) {
        console.error("Error al crear la categoría:", error);
        throw new Error(error.response?.data?.message || 'Error al crear la categoría.');
    }
};

export const updateCategoria = async (id: number, payload: UpdateCategoriaPayload): Promise<CategoriaFrontend> => {
    try {
        const response = await apiClient.put<CategoriaFrontend>(`/categorias/${id}`, payload);
        return response.data;
    } catch (error: any) {
        console.error(`Error al actualizar la categoría con ID ${id}:`, error);
        throw new Error(error.response?.data?.message || 'Error al actualizar la categoría.');
    }
};

export const deleteCategoria = async (id: number): Promise<void> => {
    try {
        await apiClient.delete(`/categorias/${id}`);
    } catch (error: any) {
        console.error(`Error al eliminar la categoría con ID ${id}:`, error);
        throw new Error(error.response?.data?.message || 'Error al eliminar la categoría.');
    }
};
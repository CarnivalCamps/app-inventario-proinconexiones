// client-web/src/services/productService.ts
import apiClient from './apiClient';


// Elimina esta línea que causa el conflicto:
// import type { ProductoFrontend } from './productService';

export interface CategoriaFrontend {
    id_categoria: number;
    nombre_categoria: string;
}

export interface UnidadMedidaFrontend {
    id_unidad_medida: number;
    nombre_unidad: string;
    abreviatura: string;
}

export interface ProductoFrontend {
    id_producto: number;
    sku: string;
    nombre_producto: string;
    descripcion_corta: string | null;
    descripcion_larga?: string | null;
    stock_actual: number;
    stock_minimo: number;
    stock_maximo?: number | null;
    ubicacion_almacen?: string | null;
    imagen_url?: string | null;
    id_proveedor_preferido_fk?: number | null;
    categoria: CategoriaFrontend | null;
    unidad_medida_primaria: UnidadMedidaFrontend;
    unidad_conteo_alternativa: UnidadMedidaFrontend | null;
    cantidad_por_unidad_alternativa?: number | null;
    // proveedor_preferido?: ProveedorFrontend | null;
}

export const getProductos = async (): Promise<ProductoFrontend[]> => {
    try {
        const response = await apiClient.get<ProductoFrontend[]>('/productos');
        return response.data;
    } catch (error: any) {
        console.error("Error al obtener productos:", error);
        throw new Error(error.response?.data?.message || 'Error al cargar los productos desde el servidor.');
    }
};

// --- NUEVAS FUNCIONES ---

export interface CreateProductPayload {
    sku: string;
    nombre_producto: string;
    descripcion_corta?: string | null;
    descripcion_larga?: string | null;
    id_categoria_fk?: number | null;
    id_unidad_medida_primaria_fk: number;
    stock_minimo?: number;
    stock_maximo?: number | null;
    ubicacion_almacen?: string | null;
    imagen_url?: string | null;
    id_proveedor_preferido_fk?: number | null;
    id_unidad_conteo_alternativa_fk?: number | null;
    cantidad_por_unidad_alternativa?: number | null;
}

export const createProducto = async (payload: CreateProductPayload): Promise<ProductoFrontend> => {
    try {
        const response = await apiClient.post<ProductoFrontend>('/productos', payload);
        return response.data;
    } catch (error: any) {
        console.error("Error al crear producto:", error);
        throw new Error(error.response?.data?.message || 'Error al crear el producto.');
    }
};
export const getProductoById = async (id: number): Promise<ProductoFrontend> => {
    try {
        const response = await apiClient.get<ProductoFrontend>(`/productos/${id}`);
        return response.data;
    } catch (error: any) {
        console.error(`Error al obtener el producto con ID ${id}:`, error);
        throw new Error(error.response?.data?.message || 'Error al cargar el producto desde el servidor.');
    }
};
export type UpdateProductPayload = Partial<CreateProductPayload>; // Hace todos los campos opcionales

export const updateProducto = async (id: number, payload: UpdateProductPayload): Promise<ProductoFrontend> => {
    try {
        const response = await apiClient.put<ProductoFrontend>(`/productos/${id}`, payload);
        return response.data;
    } catch (error: any) {
        console.error(`Error al actualizar el producto con ID ${id}:`, error);
        throw new Error(error.response?.data?.message || 'Error al actualizar el producto.');
    }
};
export const deleteProducto = async (id: number): Promise<void> => {
    try {
        // El backend debería responder con un 204 No Content, por lo que no esperamos datos de respuesta.
        await apiClient.delete(`/productos/${id}`);
    } catch (error: any) {
        console.error(`Error al eliminar el producto con ID ${id}:`, error);
        throw new Error(error.response?.data?.message || 'Error al eliminar el producto.');
    }
};

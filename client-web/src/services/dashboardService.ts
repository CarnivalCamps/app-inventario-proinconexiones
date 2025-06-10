// client-web/src/services/dashboardService.ts
import apiClient from './apiClient';
import type { ProductoFrontend } from './productService'; // Reutilizamos el tipo de producto

export interface DashboardSummary {
    productosConStockBajo: ProductoFrontend[];
    conteoProductosStockBajo: number;
    conteoPendientesAprobacion: number;
    conteoConteosEnProgreso: number;
}

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
    try {
        const response = await apiClient.get<DashboardSummary>('/dashboard/summary');
        return response.data;
    } catch (error: any) {
        console.error("Error al obtener el resumen del dashboard:", error);
        throw new Error(error.response?.data?.message || 'Error al cargar los datos del dashboard.');
    }
};
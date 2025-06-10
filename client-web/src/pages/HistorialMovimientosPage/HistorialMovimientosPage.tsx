// client-web/src/pages/HistorialMovimientosPage/HistorialMovimientosPage.tsx
import React, { useState, useEffect } from 'react';
import { getMovimientos } from '../../services/movimientoService';
import type { MovimientoInventarioFrontend } from '../../services/movimientoService';
import { getProductos} from '../../services/productService';
import type { ProductoFrontend } from '../../services/productService';
// import './HistorialMovimientosPage.css';

const HistorialMovimientosPage: React.FC = () => {
    const [movimientos, setMovimientos] = useState<MovimientoInventarioFrontend[]>([]);
    const [productos, setProductos] = useState<ProductoFrontend[]>([]); // Para el filtro
    const [filtroProductoId, setFiltroProductoId] = useState<string>(''); // Usamos string para el select
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMovimientos = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const params = filtroProductoId ? { id_producto_fk: Number(filtroProductoId) } : {};
            const data = await getMovimientos(params);
            setMovimientos(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Cargar la lista de productos para el dropdown del filtro
        const loadProductsForFilter = async () => {
            try {
                const prodsData = await getProductos();
                setProductos(prodsData);
            } catch (err) {
                console.error("Error cargando productos para el filtro:", err);
            }
        };

        loadProductsForFilter();
        fetchMovimientos(); // Cargar todos los movimientos inicialmente
    }, []); // Se ejecuta solo una vez al montar

    const handleFilter = () => {
        fetchMovimientos();
    };

    
    

    if (isLoading && movimientos.length === 0) return <p>Cargando historial de movimientos...</p>;
    if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

    return (
        <div>
            <h2>Historial de Movimientos de Inventario</h2>

            {/* --- SECCIÓN DE FILTROS --- */}
            <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc' }}>
                <h4>Filtros</h4>
                <label htmlFor="filtro-producto">Filtrar por Producto: </label>
                <select
                    id="filtro-producto"
                    value={filtroProductoId}
                    onChange={(e) => setFiltroProductoId(e.target.value)}
                >
                    <option value="">-- Todos los Productos --</option>
                    {productos.map(p => (
                        <option key={p.id_producto} value={p.id_producto}>
                            {p.nombre_producto} ({p.sku})
                        </option>
                    ))}
                </select>
                <button onClick={handleFilter} style={{ marginLeft: '10px' }} disabled={isLoading}>
                    {isLoading ? 'Filtrando...' : 'Filtrar'}
                </button>
            </div>


            {/* --- TABLA DE HISTORIAL --- */}
            <table border={1} style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Producto (SKU)</th>
                        <th>Tipo Movimiento</th>
                        <th>Cantidad</th>
                        <th>Stock Anterior</th>
                        <th>Stock Nuevo</th>
                        <th>Usuario</th>
                        <th>Referencia</th>
                    </tr>
                </thead>
                <tbody>
                    {movimientos.length > 0 ? (
                        movimientos.map((mov) => (
                            <tr key={mov.id_movimiento}>
                                <td>{new Date(mov.fecha_movimiento).toLocaleString()}</td>
                                <td>{mov.producto.nombre_producto} ({mov.producto.sku})</td>
                                <td>{mov.tipo_movimiento.nombre_tipo}</td>
                                <td style={{ fontWeight: 'bold', color: mov.tipo_movimiento.efecto_stock === 1 ? 'green' : 'red' }}>
                                    {mov.tipo_movimiento.efecto_stock === 1 ? '+' : '-'}
                                    {mov.cantidad_convertida_a_primaria} {mov.producto.unidad_medida_primaria.abreviatura}
                                </td>
                                <td>{mov.stock_anterior_primaria}</td>
                                <td>{mov.stock_nuevo_primaria}</td>
                                <td>{mov.usuario.nombre_usuario}</td>
                                <td>{mov.referencia_documento || '-'}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={8} style={{ textAlign: 'center' }}>No hay movimientos para mostrar con los filtros seleccionados.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default HistorialMovimientosPage;
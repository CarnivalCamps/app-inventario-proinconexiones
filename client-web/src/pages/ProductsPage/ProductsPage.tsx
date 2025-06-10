// client-web/src/pages/ProductsPage/ProductsPage.tsx
import React, { useState, useEffect } from 'react';
import { getProductos } from '../../services/productService';
import type { ProductoFrontend } from '../../services/productService';
import { Link } from 'react-router-dom';
// Podríamos importar un archivo CSS: import './ProductsPage.css';

const ProductsPage: React.FC = () => {
    const [productos, setProductos] = useState<ProductoFrontend[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProductos = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getProductos();
                setProductos(data);
            } catch (err: any) {
                setError(err.message || 'Ocurrió un error desconocido.');
            } finally {
                setLoading(false);
            }
        };

        fetchProductos();
    }, []); // El array vacío [] significa que este efecto se ejecuta solo una vez, cuando el componente se monta

    if (loading) {
        return <div>Cargando productos...</div>;
    }

    if (error) {
        return <div style={{ color: 'red' }}>Error: {error}</div>;
    }

    return (
        <div>
            <h2>Lista de Productos</h2>
            <Link to="/productos/nuevo"> {/* <--- AÑADE ESTE ENLACE/BOTÓN */}
                <button style={{ marginBottom: '15px' }}>Crear Nuevo Producto</button>
            </Link>
            {productos.length === 0 ? (
                <p>No hay productos para mostrar.</p>
            ) : (
                <table border={1} style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th>SKU</th>
                            <th>Nombre</th>
                            <th>Stock Actual</th>
                            <th>Categoría</th>
                            <th>Unidad Primaria</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productos.map((producto) => (
                            <tr key={producto.id_producto}>
                                <td>{producto.sku}</td>
                                <td>
                                    <Link to={`/productos/${producto.id_producto}`}>
                                        {producto.nombre_producto}
                                    </Link>
                                </td>
                                <td>{producto.stock_actual}</td>
                                <td>{producto.categoria?.nombre_categoria || 'N/A'}</td>
                                <td>{producto.unidad_medida_primaria.nombre_unidad} ({producto.unidad_medida_primaria.abreviatura})</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            {/* Aquí podríamos añadir un botón para "Crear Nuevo Producto" más adelante */}
        </div>
    );
};

export default ProductsPage;
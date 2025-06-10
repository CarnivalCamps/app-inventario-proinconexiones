// client-web/src/pages/ProductDetailPage/ProductDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProductoById, deleteProducto } from '../../services/productService';
import type { ProductoFrontend,  } from '../../services/productService';
// Podrías crear un archivo CSS: import './ProductDetailPage.css';

const ProductDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>(); // Obtiene el 'id' de los parámetros de la URL
    const navigate = useNavigate();
    const [producto, setProducto] = useState<ProductoFrontend | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    useEffect(() => {
        if (id) {
            const fetchProducto = async () => {
                try {
                    setLoading(true);
                    setError(null);
                    const numericId = parseInt(id, 10);
                    if (isNaN(numericId)) {
                        throw new Error("ID de producto inválido.");
                    }
                    const data = await getProductoById(numericId);
                    setProducto(data);
                } catch (err: any) {
                    setError(err.message || 'Ocurrió un error desconocido.');
                } finally {
                    setLoading(false);
                }
            };
            fetchProducto();
        } else {
            setError("No se especificó un ID de producto.");
            setLoading(false);
        }
    }, [id]); // Se ejecuta cuando el componente se monta o cuando 'id' cambia
    const handleDelete = async () => {
        if (!producto) return;

        if (window.confirm(`¿Estás seguro de que deseas eliminar el producto "${producto.nombre_producto}"? Esta acción no se puede deshacer.`)) {
            setIsDeleting(true);
            setError(null);
            try {
                await deleteProducto(producto.id_producto);
                alert('Producto eliminado exitosamente.');
                navigate('/productos'); // Redirigir a la lista de productos
            } catch (err: any) {
                setError(err.message || 'Error al eliminar el producto.');
                setIsDeleting(false);
            }
            // No es necesario setIsDeleting(false) en caso de éxito porque navegamos
        }
    };

    if (loading) {
        return <div>Cargando detalles del producto...</div>;
    }

    if (error) {
        return <div style={{ color: 'red' }}>Error: {error}</div>;
    }

    if (!producto) {
        return <div>Producto no encontrado.</div>;
    }

    // Estilos simples para el ejemplo
    const detailStyles = {
        container: { padding: '20px', border: '1px solid #ccc', borderRadius: '8px', margin: '20px' },
        item: { marginBottom: '10px' },
        label: { fontWeight: 'bold' as 'bold' }
    };
    const buttonStyles = { marginLeft: '10px', backgroundColor: 'red', color: 'white' };

    return (
        <div style={detailStyles.container}>
            <h2>Detalles del Producto: {producto.nombre_producto}</h2>
            <p style={detailStyles.item}><span style={detailStyles.label}>SKU:</span> {producto.sku}</p>
            <p style={detailStyles.item}><span style={detailStyles.label}>Descripción Corta:</span> {producto.descripcion_corta || 'N/A'}</p>
            <p style={detailStyles.item}><span style={detailStyles.label}>Stock Actual:</span> {producto.stock_actual}</p>
            <p style={detailStyles.item}><span style={detailStyles.label}>Stock Mínimo:</span> {producto.stock_minimo}</p>
            <p style={detailStyles.item}><span style={detailStyles.label}>Stock Máximo:</span> {producto.stock_maximo}</p>
            <p style={detailStyles.item}><span style={detailStyles.label}>Proveedor:</span> {producto.id_proveedor_preferido_fk}</p>

            <p style={detailStyles.item}><span style={detailStyles.label}>Categoría:</span> {producto.categoria?.nombre_categoria || 'N/A'}</p>
            <p style={detailStyles.item}><span style={detailStyles.label}>Unidad Primaria:</span> {producto.unidad_medida_primaria.nombre_unidad} ({producto.unidad_medida_primaria.abreviatura})</p>
            {producto.unidad_conteo_alternativa && (
                <p style={detailStyles.item}>
                    <span style={detailStyles.label}>Unidad Alternativa:</span> {producto.unidad_conteo_alternativa.nombre_unidad} ({producto.unidad_conteo_alternativa.abreviatura})
                    <br />
                    <span style={detailStyles.label}>Cantidad por Und. Alt.:</span> {producto.cantidad_por_unidad_alternativa}
                </p>
            )}
            {/* Aquí podríamos añadir más campos y botones de Editar/Eliminar */}
            <br />
            <Link to={`/productos/${producto.id_producto}/editar`}> {/* <--- AÑADE ESTE ENLACE/BOTÓN */}
                <button>Editar Producto</button>
            </Link>
            <br />
            
            <br />
            <button onClick={handleDelete} disabled={isDeleting} style={buttonStyles}>
                        {isDeleting ? 'Eliminando...' : 'Eliminar Producto'}
                    </button>
            <br />
            <br />
            <Link to="/productos">Volver a la lista de productos</Link>
            <br />
        </div>
    );
};

export default ProductDetailPage;
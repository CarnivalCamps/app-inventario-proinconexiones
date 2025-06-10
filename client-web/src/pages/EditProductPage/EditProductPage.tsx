// client-web/src/pages/EditProductPage/EditProductPage.tsx
import React, { useState, useEffect } from 'react';
import type  { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProductoById, updateProducto } from '../../services/productService';
import type { ProductoFrontend,UpdateProductPayload, CreateProductPayload } from '../../services/productService';
import { getCategorias } from '../../services/categoriaService';
import type { CategoriaFrontend } from '../../services/categoriaService';
import { getUnidadesMedida } from '../../services/unidadMedidaService';
import type { UnidadMedidaFrontend } from '../../services/unidadMedidaService';
import {  getProveedores } from '../../services/proveedorService';
import type { ProveedorFrontend } from '../../services/proveedorService';

// Usamos CreateProductPayload como base para el estado del formulario
const initialFormData: Partial<CreateProductPayload> = { // Partial para permitir inicialización vacía
    sku: '',
    nombre_producto: '',
    // ... inicializa otros campos como desees o déjalos para ser poblados por el fetch
};

const EditProductPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const productId = parseInt(id || '0', 10);

    const [formData, setFormData] = useState<Partial<CreateProductPayload>>(initialFormData);
    const [categorias, setCategorias] = useState<CategoriaFrontend[]>([]);
    const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedidaFrontend[]>([]);
    const [proveedores, setProveedores] = useState<ProveedorFrontend[]>([]);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!productId) {
            setError("ID de producto inválido.");
            setPageLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                setPageLoading(true);
                const [productoData, cats, ums, provs] = await Promise.all([
                    getProductoById(productId),
                    getCategorias(),
                    getUnidadesMedida(),
                    getProveedores()
                ]);

                // Poblar el formulario con los datos del producto existente
                setFormData({
                    sku: productoData.sku,
                    nombre_producto: productoData.nombre_producto,
                    descripcion_corta: productoData.descripcion_corta,
                    descripcion_larga: productoData.descripcion_larga, // Asegúrate que tu ProductoFrontend tenga estos campos si los usas
                    id_categoria_fk: productoData.categoria?.id_categoria || undefined,
                    id_unidad_medida_primaria_fk: productoData.unidad_medida_primaria.id_unidad_medida,
                    stock_minimo: productoData.stock_minimo,
                    stock_maximo: productoData.stock_maximo,
                    ubicacion_almacen: productoData.ubicacion_almacen,
                    imagen_url: productoData.imagen_url,
                    // id_proveedor_preferido_fk: productoData.proveedor_preferido?.id_proveedor || undefined,
                    id_unidad_conteo_alternativa_fk: productoData.unidad_conteo_alternativa?.id_unidad_medida || undefined,
                    cantidad_por_unidad_alternativa: productoData.cantidad_por_unidad_alternativa
                });

                setCategorias(cats);
                setUnidadesMedida(ums);
                setProveedores(provs);

            } catch (err: any) {
                setError(err.message || "Error cargando datos para el formulario.");
            } finally {
                setPageLoading(false);
            }
        };
        fetchData();
    }, [productId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        // ... (Tu función handleChange es la misma que en CreateProductPage.tsx)
        // Asegúrate de que maneje bien los valores para 'undefined' en selects opcionales
        // y 'null' para números opcionales vaciados.
        const { name, value, type } = e.target;
        let processedValue: string | number | null | undefined = value;

        if (type === 'number') {
            processedValue = value === '' ? null : Number(value);
        }
        if (name === 'id_categoria_fk' || name === 'id_proveedor_preferido_fk' || name === 'id_unidad_conteo_alternativa_fk') {
            processedValue = value === '' ? undefined : Number(value);
        }
         if (name === 'id_unidad_medida_primaria_fk') { // Asumiendo que este es siempre numérico
            processedValue = Number(value);
        }

        if (name === 'id_unidad_conteo_alternativa_fk') {
            const nuevaUnidadAlternativaId = value === '' ? undefined : Number(value);
            if (nuevaUnidadAlternativaId === undefined) {
                setFormData(prev => ({
                    ...prev,
                    id_unidad_conteo_alternativa_fk: undefined,
                    cantidad_por_unidad_alternativa: null
                }));
            } else {
                setFormData(prev => ({ ...prev, id_unidad_conteo_alternativa_fk: nuevaUnidadAlternativaId }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: processedValue }));
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setLoading(true);

        if (!formData.sku || !formData.nombre_producto || !formData.id_unidad_medida_primaria_fk) {
            setError("SKU, Nombre del producto y Unidad de Medida Primaria son obligatorios.");
            setLoading(false);
            return;
        }
        if (formData.id_unidad_conteo_alternativa_fk && (!formData.cantidad_por_unidad_alternativa || formData.cantidad_por_unidad_alternativa <= 0)) {
            setError("Si selecciona una unidad de conteo alternativa, la cantidad por unidad debe ser mayor a 0.");
            setLoading(false);
            return;
        }
        if (!formData.id_unidad_conteo_alternativa_fk && formData.cantidad_por_unidad_alternativa) {
            setError("No puede ingresar cantidad por unidad alternativa si no ha seleccionado una unidad alternativa.");
            setLoading(false);
            return;
        }

        try {
            // Construir el payload asegurándose de que los FK opcionales sean null si undefined
            const payloadToSend: UpdateProductPayload = {
                ...formData,
                id_categoria_fk: formData.id_categoria_fk || null,
                id_proveedor_preferido_fk: formData.id_proveedor_preferido_fk || null,
                id_unidad_conteo_alternativa_fk: formData.id_unidad_conteo_alternativa_fk || null,
                // Los campos numéricos que pueden ser null ya están como null o number
            };

            await updateProducto(productId, payloadToSend);
            alert(`Producto "${formData.nombre_producto}" actualizado exitosamente!`);
            navigate(`/productos/${productId}`); // Redirigir a la página de detalle del producto
        } catch (err: any) {
            setError(err.message || "Ocurrió un error al actualizar el producto.");
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) return <div>Cargando datos del producto para editar...</div>;
    if (error && !formData.sku) return <div style={{ color: 'red' }}>Error: {error}</div>; // Si hay error al cargar datos iniciales

    // El JSX del formulario será muy similar al de CreateProductPage.tsx
    // Solo cambia el título y el texto del botón.
    // Reutiliza los estilos si los definiste.
    
    const styles = {
        formGroup: { marginBottom: '15px' },
        label: { display: 'block', marginBottom: '5px' },
        input: { width: '100%', padding: '8px', boxSizing: 'border-box' as 'border-box' },
        select: { width: '100%', padding: '8px' },
        button: { padding: '10px 15px', marginTop: '10px' },
        error: { color: 'red', marginTop: '10px' }
    };

    return (
        <div>
            <h2>Editar Producto: {formData.nombre_producto || 'Cargando...'}</h2>
            <form onSubmit={handleSubmit}>
                {/* Copia aquí todos los <div style={styles.formGroup}> ... </div> de tu CreateProductPage */}
                {/* Asegúrate de que los 'value' de los inputs y selects usen formData */}
                {/* Ejemplo para SKU: */}
                {/* <div style={styles.formGroup}>
                    <label htmlFor="sku" style={styles.label}>SKU:</label>
                    <input type="text" name="sku" id="sku" value={formData.sku || ''} onChange={handleChange} required style={styles.input} />
                </div> */}
                {/* ... Repite para todos los campos ... */}

                {/* ----- COPIA Y PEGA AQUÍ TU FORMULARIO DE CreateProductPage.tsx ----- */}
                {/* ----- DESDE EL PRIMER DIV CON SKU HASTA ANTES DEL BOTÓN ----- */}
                {/* Ejemplo del formulario (DEBES COPIAR EL TUYO COMPLETO): */}
                <div style={styles.formGroup}>
                    <label htmlFor="sku" style={styles.label}>SKU:</label>
                    <input type="text" name="sku" id="sku" value={formData.sku || ''} onChange={handleChange} required style={styles.input} />
                </div>
                {/* ... (demás campos: nombre_producto, descripciones, selects para categoria, unidades, proveedor, etc.) ... */}
                <div style={styles.formGroup}>
                    <label htmlFor="nombre_producto" style={styles.label}>Nombre del Producto:</label>
                    <input type="text" name="nombre_producto" id="nombre_producto" value={formData.nombre_producto || ''} onChange={handleChange} required style={styles.input} />
                </div>
                <div style={styles.formGroup}>
                    <label htmlFor="descripcion_corta" style={styles.label}>Descripción Corta:</label>
                    <textarea 
                        name="descripcion_corta" 
                        id="descripcion_corta" 
                        value={formData.descripcion_corta || ''} 
                        onChange={handleChange} 
                        style={styles.input} 
                    />
                </div>
                <div style={styles.formGroup}>
                    <label htmlFor="descripcion_larga" style={styles.label}>Descripción Larga:</label>
                    <textarea 
                        name="descripcion_larga" 
                        id="descripcion_larga" 
                        value={formData.descripcion_larga || ''} 
                        onChange={handleChange} 
                        style={styles.input} 
                    />
                </div>
                {/* Añade todos los demás campos aquí, igual que en CreateProductPage */}
                {/* Ejemplo para categoría: */}
                <div style={styles.formGroup}>
                    <label htmlFor="id_categoria_fk" style={styles.label}>Categoría:</label>
                    <select name="id_categoria_fk" id="id_categoria_fk" value={formData.id_categoria_fk || ''} onChange={handleChange} style={styles.select}>
                        <option value="">-- Sin Categoría --</option>
                        {categorias.map(cat => <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nombre_categoria}</option>)}
                    </select>
                </div>
                <div style={styles.formGroup}>
                    <label htmlFor="id_unidad_medida_primaria_fk" style={styles.label}>Unidad de Medida Primaria:</label>
                    <select 
                        name="id_unidad_medida_primaria_fk" 
                        id="id_unidad_medida_primaria_fk" 
                        value={formData.id_unidad_medida_primaria_fk || ''} 
                        onChange={handleChange} 
                        required 
                        style={styles.select}
                    >
                        <option value="">-- Seleccionar --</option>
                        {unidadesMedida.map(um => (
                            <option key={um.id_unidad_medida} value={um.id_unidad_medida}>
                                {um.nombre_unidad} ({um.abreviatura})
                            </option>
                        ))}
                    </select>
                </div>
                <div style={styles.formGroup}>
                    <label htmlFor="stock_minimo" style={styles.label}>Stock Mínimo:</label>
                    <input 
                        type="number" 
                        name="stock_minimo" 
                        id="stock_minimo" 
                        value={formData.stock_minimo === null ? '' : formData.stock_minimo} 
                        onChange={handleChange} 
                        min="0" 
                        style={styles.input} 
                    />
                </div>
                <div style={styles.formGroup}>
                    <label htmlFor="stock_maximo" style={styles.label}>Stock Máximo (opcional):</label>
                    <input 
                        type="number" 
                        name="stock_maximo" 
                        id="stock_maximo" 
                        value={formData.stock_maximo === null ? '' : formData.stock_maximo} 
                        onChange={handleChange} 
                        min="0" 
                        style={styles.input} 
                    />
                </div>
                <div style={styles.formGroup}>
                    <label htmlFor="id_unidad_conteo_alternativa_fk" style={styles.label}>Unidad de Conteo Alternativa (opcional):</label>
                    <select 
                        name="id_unidad_conteo_alternativa_fk" 
                        id="id_unidad_conteo_alternativa_fk" 
                        value={formData.id_unidad_conteo_alternativa_fk || ''} 
                        onChange={handleChange} 
                        style={styles.select}
                    >
                        <option value="">-- Ninguna --</option>
                        {unidadesMedida.map(um => (
                            <option key={um.id_unidad_medida} value={um.id_unidad_medida}>
                                {um.nombre_unidad} ({um.abreviatura})
                            </option>
                        ))}
                    </select>
                </div>
                <div style={styles.formGroup}>
                        <label htmlFor="cantidad_por_unidad_alternativa" style={styles.label}>Cantidad por Unidad Alternativa:</label>
                        <input 
                            type="number" 
                            name="cantidad_por_unidad_alternativa" 
                            id="cantidad_por_unidad_alternativa" 
                            value={formData.cantidad_por_unidad_alternativa || ''} 
                            onChange={handleChange} 
                            min="1" 
                            style={styles.input} 
                        />
                    </div>
                <div style={styles.formGroup}>
                    <label htmlFor="id_proveedor_preferido_fk" style={styles.label}>Proveedor Preferido (opcional):</label>
                    <select 
                        name="id_proveedor_preferido_fk" 
                        id="id_proveedor_preferido_fk" 
                        value={formData.id_proveedor_preferido_fk || ''} 
                        onChange={handleChange} 
                        style={styles.select}
                    >
                        <option value="">-- Ninguno --</option>
                        {proveedores.map(prov => (
                            <option key={prov.id_proveedor} value={prov.id_proveedor}>
                                {prov.nombre_proveedor}
                            </option>
                        ))}
                    </select>
                </div>
                <div style={styles.formGroup}>
                    <label htmlFor="ubicacion_almacen" style={styles.label}>Ubicación en Almacén (opcional):</label>
                    <input 
                        type="text" 
                        name="ubicacion_almacen" 
                        id="ubicacion_almacen" 
                        value={formData.ubicacion_almacen || ''} 
                        onChange={handleChange} 
                        style={styles.input} 
                    />
                </div>
                <div style={styles.formGroup}>
                    <label htmlFor="imagen_url" style={styles.label}>URL de Imagen (opcional):</label>
                    <input 
                        type="text" 
                        name="imagen_url" 
                        id="imagen_url" 
                        value={formData.imagen_url || ''} 
                        onChange={handleChange} 
                        style={styles.input} 
                    />
                </div>
                {/* ... y así para todos los campos ... */}


                {error && <p style={{color: 'red', marginTop: '10px'}}>{error}</p>}
                <button type="submit" disabled={loading || pageLoading} style={{ padding: '10px 15px', marginTop: '10px' }}>
                    {loading ? 'Guardando Cambios...' : 'Guardar Cambios'}
                </button>
            </form>
        </div>
    );
};

export default EditProductPage;
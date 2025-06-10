// client-web/src/pages/CreateProductPage/CreateProductPage.tsx
import React, { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProducto } from '../../services/productService';
import type { CreateProductPayload } from '../../services/productService';
import { getCategorias } from '../../services/categoriaService';
import type { CategoriaFrontend } from '../../services/categoriaService';
import { getUnidadesMedida } from '../../services/unidadMedidaService';
import type { UnidadMedidaFrontend } from '../../services/unidadMedidaService';
import { getProveedores } from '../../services/proveedorService';
import type { ProveedorFrontend } from '../../services/proveedorService';

const initialFormData: CreateProductPayload = {
    sku: '',
    nombre_producto: '',
    descripcion_corta: null,
    descripcion_larga: null,
    id_categoria_fk: null,
    id_unidad_medida_primaria_fk: 0,
    stock_minimo: 0,
    stock_maximo: null,
    ubicacion_almacen: null,
    imagen_url: null,
    id_proveedor_preferido_fk: null,
    id_unidad_conteo_alternativa_fk: null,
    cantidad_por_unidad_alternativa: null,
};

const CreateProductPage: React.FC = () => {
    const [formData, setFormData] = useState<CreateProductPayload>(initialFormData);
    const [categorias, setCategorias] = useState<CategoriaFrontend[]>([]);
    const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedidaFrontend[]>([]);
    const [proveedores, setProveedores] = useState<ProveedorFrontend[]>([]);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setPageLoading(true);
                const [cats, ums, provs] = await Promise.all([
                    getCategorias(),
                    getUnidadesMedida(),
                    getProveedores()
                ]);
                setCategorias(cats);
                setUnidadesMedida(ums);
                setProveedores(provs);
                // Asignar un valor por defecto válido a la unidad primaria si hay unidades
                if (ums.length > 0 && formData.id_unidad_medida_primaria_fk === 0) {
                    setFormData(prev => ({ ...prev, id_unidad_medida_primaria_fk: ums[0].id_unidad_medida }));
                }
            } catch (err: any) {
                setError(err.message || "Error cargando datos para el formulario.");
            } finally {
                setPageLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        // Manejar campos de texto simples
        if (name === 'sku' || name === 'nombre_producto' || name === 'descripcion_corta' || 
            name === 'descripcion_larga' || name === 'ubicacion_almacen' || name === 'imagen_url') {
            setFormData(prev => ({
                ...prev,
                [name]: value === '' ? null : value
            }));
            return;
        }

        // Manejar campos numéricos
        if (type === 'number' || name === 'stock_minimo' || name === 'stock_maximo' || name === 'cantidad_por_unidad_alternativa') {
            const numValue = value === '' ? null : Number(value);
            setFormData(prev => ({
                ...prev,
                [name]: numValue
            }));
            return;
        }

        // Manejar selects de ID - campos obligatorios
        if (name === 'id_unidad_medida_primaria_fk') {
            setFormData(prev => ({
                ...prev,
                [name]: Number(value)
            }));
            return;
        }

        // Manejar selects de ID - campos opcionales
        if (name === 'id_categoria_fk' || name === 'id_proveedor_preferido_fk') {
            setFormData(prev => ({
                ...prev,
                [name]: value === '' ? null : Number(value)
            }));
            return;
        }

        // Manejar unidad alternativa - si se deselecciona, limpiar también la cantidad
        if (name === 'id_unidad_conteo_alternativa_fk') {
            if (value === '') {
                setFormData(prev => ({
                    ...prev,
                    id_unidad_conteo_alternativa_fk: null,
                    cantidad_por_unidad_alternativa: null
                }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    id_unidad_conteo_alternativa_fk: Number(value)
                }));
            }
            return;
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        console.log('Estado de formData al enviar:', JSON.stringify(formData, null, 2));
        setError(null);
        setLoading(true);

        // Validación simple
        if (!formData.sku || !formData.nombre_producto || !formData.id_unidad_medida_primaria_fk) {
            setError("SKU, Nombre del producto y Unidad de Medida Primaria son obligatorios.");
            setLoading(false);
            return;
        }

        // Validar unidad alternativa y cantidad
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
            // Preparar payload limpio
            const payload: CreateProductPayload = {
                sku: formData.sku,
                nombre_producto: formData.nombre_producto,
                descripcion_corta: formData.descripcion_corta,
                descripcion_larga: formData.descripcion_larga,
                id_categoria_fk: formData.id_categoria_fk,
                id_unidad_medida_primaria_fk: formData.id_unidad_medida_primaria_fk,
                stock_minimo: formData.stock_minimo || 0,
                stock_maximo: formData.stock_maximo,
                ubicacion_almacen: formData.ubicacion_almacen,
                imagen_url: formData.imagen_url,
                id_proveedor_preferido_fk: formData.id_proveedor_preferido_fk,
                id_unidad_conteo_alternativa_fk: formData.id_unidad_conteo_alternativa_fk,
                cantidad_por_unidad_alternativa: formData.id_unidad_conteo_alternativa_fk ? formData.cantidad_por_unidad_alternativa : null,
            };

            console.log('Payload a enviar:', JSON.stringify(payload, null, 2));
            
            const nuevoProducto = await createProducto(payload);
            alert(`Producto "${nuevoProducto.nombre_producto}" creado exitosamente!`);
            navigate('/productos');
        } catch (err: any) {
            console.error('Error al crear producto:', err);
            setError(err.message || "Ocurrió un error al crear el producto.");
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) {
        return <div>Cargando datos del formulario...</div>;
    }

    // Estilos simples para el ejemplo
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
            <h2>Crear Nuevo Producto</h2>
            <form onSubmit={handleSubmit}>
                <div style={styles.formGroup}>
                    <label htmlFor="sku" style={styles.label}>SKU:</label>
                    <input 
                        type="text" 
                        name="sku" 
                        id="sku" 
                        value={formData.sku || ''} 
                        onChange={handleChange} 
                        required 
                        style={styles.input} 
                    />
                </div>
                
                <div style={styles.formGroup}>
                    <label htmlFor="nombre_producto" style={styles.label}>Nombre del Producto:</label>
                    <input 
                        type="text" 
                        name="nombre_producto" 
                        id="nombre_producto" 
                        value={formData.nombre_producto || ''} 
                        onChange={handleChange} 
                        required 
                        style={styles.input} 
                    />
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
                
                <div style={styles.formGroup}>
                    <label htmlFor="id_categoria_fk" style={styles.label}>Categoría:</label>
                    <select 
                        name="id_categoria_fk" 
                        id="id_categoria_fk" 
                        value={formData.id_categoria_fk || ''} 
                        onChange={handleChange} 
                        style={styles.select}
                    >
                        <option value="">-- Sin Categoría --</option>
                        {categorias.map(cat => (
                            <option key={cat.id_categoria} value={cat.id_categoria}>
                                {cat.nombre_categoria}
                            </option>
                        ))}
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
                
                {formData.id_unidad_conteo_alternativa_fk && (
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
                )}
                
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

                {error && <p style={styles.error}>{error}</p>}
                <button type="submit" disabled={loading || pageLoading} style={styles.button}>
                    {loading ? 'Creando Producto...' : 'Crear Producto'}
                </button>
            </form>
        </div>
    );
};

export default CreateProductPage;
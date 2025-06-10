// client-web/src/pages/ConteosPage/ConteoDetailPage.tsx
import React, { useState, useEffect} from 'react';
import type { FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    getConteoById, addDetallesConteo, finalizarConteo, aplicarAjustesConteo,
    
} from '../../services/conteoService';
import type {
    
    ConteoFisicoFrontend, DetalleConteoInput, FinalizarConteoPayload
} from '../../services/conteoService';
import { getProductos } from '../../services/productService';
import type { ProductoFrontend } from '../../services/productService';
import { useAuth } from '../../contexts/AuthContext'

const ConteoDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [conteo, setConteo] = useState<ConteoFisicoFrontend | null>(null);
    const [productos, setProductos] = useState<ProductoFrontend[]>([]); // Para el dropdown

    // Estado del formulario para añadir un nuevo detalle
    const [newDetail, setNewDetail] = useState<{ id_producto_fk: string; cantidad: string; notas: string }>({
        id_producto_fk: '',
        cantidad: '',
        notas: ''
    });

    const [isLoading, setIsLoading] = useState<boolean>(true); // Para la carga inicial de la página
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // Para acciones de botones
    const [error, setError] = useState<string | null>(null);

    const numericId = parseInt(id || '0', 10);

    const fetchConteoAndProducts = async () => {
        if (numericId > 0) {
            try {
                // No establecemos isLoading a true aquí para permitir que las acciones tengan su propio estado de carga
                setError(null);
                const [conteoData, productosData] = await Promise.all([
                    getConteoById(numericId),
                    getProductos() // Cargar productos para el dropdown
                ]);
                setConteo(conteoData);
                setProductos(productosData);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false); // La carga de la página inicial ha terminado
            }
        } else {
            setError("ID de conteo inválido.");
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchConteoAndProducts();
    }, [id]);

    const handleNewDetailChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewDetail(prev => ({ ...prev, [name]: value }));
    };

    const handleAddDetailSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!newDetail.id_producto_fk || !newDetail.cantidad) {
            alert("Por favor, seleccione un producto e ingrese una cantidad.");
            return;
        }
        
        setError(null);
        setIsSubmitting(true);

        const payload: DetalleConteoInput[] = [{
            id_producto_fk: parseInt(newDetail.id_producto_fk),
            stock_fisico_contado_primaria: parseInt(newDetail.cantidad),
            notas_detalle_conteo: newDetail.notas
        }];

        try {
            await addDetallesConteo(numericId, payload);
            alert("Detalle añadido/actualizado exitosamente.");
            setNewDetail({ id_producto_fk: '', cantidad: '', notas: '' }); // Resetear formulario
            await fetchConteoAndProducts(); // Recargar todo para ver los cambios
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFinalizar = async () => {
        if (!conteo) return;
        if (window.confirm("¿Estás seguro de que deseas finalizar este conteo? Una vez finalizado, no podrás añadir más detalles.")) {
            setIsSubmitting(true);
            setError(null);
            try {
                const payload: FinalizarConteoPayload = { notas_finalizacion: "Conteo finalizado desde la aplicación web." };
                await finalizarConteo(conteo.id_conteo, payload);
                alert("Conteo finalizado exitosamente. Ahora puedes aplicar los ajustes.");
                await fetchConteoAndProducts();
            } catch (err: any) { setError(err.message); }
            finally { setIsSubmitting(false); }
        }
    };

    const handleAplicarAjustes = async () => {
        if (!conteo) return;
        if (window.confirm("¡CUIDADO! Esta acción modificará el stock de forma permanente. ¿Continuar?")) {
            setIsSubmitting(true);
            setError(null);
            try {
                await aplicarAjustesConteo(conteo.id_conteo);
                alert("Ajustes aplicados exitosamente. El stock ha sido actualizado.");
                await fetchConteoAndProducts();
            } catch (err: any) { setError(err.message); }
            finally { setIsSubmitting(false); }
        }
    };
    
    const puedeProcesar = user?.rol === 'Administrador' || user?.rol === 'Almacenista';

    if (isLoading) return <p>Cargando detalles del conteo...</p>;
    if (error && !conteo) return <p style={{ color: 'red' }}>Error: {error}</p>;
    if (!conteo) return <p>Conteo no encontrado.</p>;

    return (
        <div>
            <h2>Detalle de Conteo Físico #{conteo.id_conteo}</h2>
            <div style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '20px' }}>
                <p><strong>Estado:</strong> {conteo.estado_conteo}</p>
                <p><strong>Motivo:</strong> {conteo.descripcion_motivo_conteo || 'N/A'}</p>
                <p><strong>Responsable:</strong> {conteo.usuario_responsable.nombre_usuario}</p>
                <p><strong>Fecha Inicio:</strong> {new Date(conteo.fecha_inicio_conteo).toLocaleString()}</p>
                {conteo.fecha_finalizacion_conteo && <p><strong>Fecha Finalización:</strong> {new Date(conteo.fecha_finalizacion_conteo).toLocaleString()}</p>}
                {conteo.notas_generales_conteo && <p><strong>Notas:</strong> {conteo.notas_generales_conteo}</p>}
            </div>

            <h3>Productos Registrados en el Conteo</h3>
            <table border={1} style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th>Producto (SKU)</th>
                        <th>Stock Teórico</th>
                        <th>Stock Físico</th>
                        <th>Diferencia</th>
                        <th>Notas</th>
                    </tr>
                </thead>
                <tbody>
                    {conteo.detalles_conteo.length > 0 ? (
                        conteo.detalles_conteo.map(detalle => (
                            <tr key={detalle.id_detalle_conteo}>
                                <td>{detalle.producto.nombre_producto} ({detalle.producto.sku})</td>
                                <td>{detalle.stock_teorico_primaria}</td>
                                <td>{detalle.stock_fisico_contado_primaria}</td>
                                <td style={{ color: detalle.diferencia_primaria !== 0 ? 'orange' : 'inherit', fontWeight: detalle.diferencia_primaria !== 0 ? 'bold' : 'normal' }}>
                                    {detalle.diferencia_primaria > 0 ? `+${detalle.diferencia_primaria}` : detalle.diferencia_primaria}
                                </td>
                                <td>{detalle.notas_detalle_conteo || '-'}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={5} style={{ textAlign: 'center' }}>Aún no se han añadido productos a este conteo.</td>
                        </tr>
                    )}
                </tbody>
            </table>

            <hr style={{ margin: '30px 0' }}/>
            
            {puedeProcesar && (conteo.estado_conteo === 'Iniciado' || conteo.estado_conteo === 'En Progreso') && (
                <div style={{ border: '1px solid #007bff', padding: '15px', borderRadius: '8px' }}>
                    <h4>Añadir o Actualizar Producto en el Conteo</h4>
                    <p>Si selecciona un producto que ya está en la lista, se actualizará su cantidad contada.</p>
                    <form onSubmit={handleAddDetailSubmit}>
                        <div>
                            <label>Producto:</label>
                            <select name="id_producto_fk" value={newDetail.id_producto_fk} onChange={handleNewDetailChange} required>
                                <option value="">-- Seleccione un Producto --</option>
                                {productos.map(p => <option key={p.id_producto} value={p.id_producto}>{p.nombre_producto} ({p.sku})</option>)}
                            </select>
                        </div>
                        <div style={{marginTop: '10px'}}>
                            <label>Cantidad Física Contada (en unidad primaria):</label>
                            <input type="number" name="cantidad" value={newDetail.cantidad} onChange={handleNewDetailChange} min="0" required />
                        </div>
                        <div style={{marginTop: '10px'}}>
                            <label>Notas (opcional):</label>
                            <textarea name="notas" value={newDetail.notas} onChange={handleNewDetailChange} rows={2} style={{width: '50%'}} />
                        </div>
                        {error && <p style={{ color: 'red' }}>{error}</p>}
                        <button type="submit" disabled={isSubmitting} style={{ marginTop: '10px' }}>
                            {isSubmitting ? 'Guardando...' : 'Añadir/Actualizar Detalle'}
                        </button>
                    </form>
                </div>
            )}

            <h4 style={{marginTop: '30px'}}>Acciones del Conteo</h4>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                {puedeProcesar && (conteo.estado_conteo === 'Iniciado' || conteo.estado_conteo === 'En Progreso') && (
                    <button onClick={handleFinalizar} disabled={isSubmitting}>{isSubmitting ? 'Procesando...' : 'Finalizar Conteo'}</button>
                )}
                {puedeProcesar && conteo.estado_conteo === 'Registrado' && (
                    <button onClick={handleAplicarAjustes} disabled={isSubmitting} style={{ backgroundColor: 'lightblue' }}>
                        {isSubmitting ? 'Aplicando...' : 'Aplicar Ajustes'}
                    </button>
                )}
                {conteo.estado_conteo === 'Ajustes Aplicados' && (
                    <p>✅ Este conteo ya ha sido procesado y los ajustes aplicados.</p>
                )}
            </div>

            <br />
            <Link to="/conteos">← Volver a la lista de conteos</Link>
        </div>
    );
};

export default ConteoDetailPage;
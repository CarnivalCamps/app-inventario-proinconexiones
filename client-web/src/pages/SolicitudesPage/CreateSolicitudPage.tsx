// client-web/src/pages/SolicitudesPage/CreateSolicitudPage.tsx
import React, { useState, useEffect} from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSolicitud } from '../../services/solicitudService';
import type { CreateSolicitudPayload, DetalleSolicitudInput } from '../../services/solicitudService';
import { getProductos } from '../../services/productService';
import type { ProductoFrontend } from '../../services/productService';
import { getUnidadesMedida } from '../../services/unidadMedidaService';
import type { UnidadMedidaFrontend } from '../../services/productService';
// import './CreateSolicitudPage.css';

const initialDetalleState: DetalleSolicitudInput = {
    id_producto_fk: 0,
    cantidad_solicitada: 1,
    id_unidad_medida_solicitada_fk: 0,
};

const CreateSolicitudPage: React.FC = () => {
    const navigate = useNavigate();
    const [proposito, setProposito] = useState('');
    const [fechaRequerida, setFechaRequerida] = useState('');
    const [justificacion, setJustificacion] = useState('');
    const [detalles, setDetalles] = useState<DetalleSolicitudInput[]>([initialDetalleState]);

    const [productos, setProductos] = useState<ProductoFrontend[]>([]);
    const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedidaFrontend[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pageLoading, setPageLoading] = useState(true);


    useEffect(() => {
        const loadDropdownData = async () => {
            try {
                setPageLoading(true);
                const [prodsData, umsData] = await Promise.all([
                    getProductos(),
                    getUnidadesMedida()
                ]);
                setProductos(prodsData);
                setUnidadesMedida(umsData);
            } catch (err) {
                setError("Error cargando datos para el formulario (productos/unidades).");
                console.error(err);
            } finally {
                setPageLoading(false);
            }
        };
        loadDropdownData();
    }, []);

    const handleDetalleChange = (index: number, field: keyof DetalleSolicitudInput, value: string | number) => {
        const newDetalles = [...detalles];
        const val = (field === 'id_producto_fk' || field === 'id_unidad_medida_solicitada_fk' || field === 'cantidad_solicitada')
                    ? Number(value)
                    : value;
        (newDetalles[index] as any)[field] = val;
        setDetalles(newDetalles);
    };

    const addDetalle = () => {
        setDetalles([...detalles, { ...initialDetalleState }]);
    };

    const removeDetalle = (index: number) => {
        if (detalles.length > 1) { // Siempre debe quedar al menos un detalle
            const newDetalles = detalles.filter((_, i) => i !== index);
            setDetalles(newDetalles);
        } else {
            alert("Debe haber al menos un producto en la solicitud.");
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        if (!proposito.trim()) {
            setError("El propósito de la solicitud es requerido.");
            return;
        }
        if (detalles.some(d => !d.id_producto_fk || !d.id_unidad_medida_solicitada_fk || d.cantidad_solicitada <= 0)) {
            setError("Todos los detalles deben tener producto, unidad de medida y cantidad válida (>0) seleccionados.");
            return;
        }

        setIsLoading(true);
        const payload: CreateSolicitudPayload = {
            proposito_solicitud: proposito,
            fecha_requerida_entrega: fechaRequerida || null,
            justificacion_detallada: justificacion || null,
            detalles: detalles,
        };

        try {
            const nuevaSolicitud = await createSolicitud(payload);
            alert(`Solicitud #${nuevaSolicitud.id_solicitud} creada exitosamente.`);
            navigate('/solicitudes'); // o a `/solicitudes/${nuevaSolicitud.id_solicitud}`
        } catch (err: any) {
            setError(err.message || "Ocurrió un error al crear la solicitud.");
        } finally {
            setIsLoading(false);
        }
    };

    if (pageLoading) return <p>Cargando datos del formulario...</p>;

    return (
        <div>
            <h2>Crear Nueva Solicitud de Reserva</h2>
            <form onSubmit={handleSubmit}>
                {/* Campos de Cabecera */}
                <div>
                    <label htmlFor="proposito">Propósito de la Solicitud:</label>
                    <input type="text" id="proposito" value={proposito} onChange={(e) => setProposito(e.target.value)} required />
                </div>
                <div>
                    <label htmlFor="fechaRequerida">Fecha Requerida de Entrega (Opcional):</label>
                    <input type="date" id="fechaRequerida" value={fechaRequerida} onChange={(e) => setFechaRequerida(e.target.value)} />
                </div>
                <div>
                    <label htmlFor="justificacion">Justificación Detallada (Opcional):</label>
                    <textarea id="justificacion" value={justificacion} onChange={(e) => setJustificacion(e.target.value)} rows={3} />
                </div>

                <hr />
                <h3>Productos Solicitados</h3>
                {detalles.map((detalle, index) => (
                    <div key={index} style={{ border: '1px solid #eee', padding: '10px', marginBottom: '10px' }}>
                        <h4>Producto #{index + 1}</h4>
                        <div>
                            <label htmlFor={`producto-${index}`}>Producto:</label>
                            <select
                                id={`producto-${index}`}
                                value={detalle.id_producto_fk}
                                onChange={(e) => handleDetalleChange(index, 'id_producto_fk', e.target.value)}
                                required
                            >
                                <option value={0}>-- Seleccione Producto --</option>
                                {productos.map(p => <option key={p.id_producto} value={p.id_producto}>{p.nombre_producto} ({p.sku})</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor={`cantidad-${index}`}>Cantidad Solicitada:</label>
                            <input
                                type="number"
                                id={`cantidad-${index}`}
                                value={detalle.cantidad_solicitada}
                                onChange={(e) => handleDetalleChange(index, 'cantidad_solicitada', e.target.value)}
                                min="1"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor={`unidad-${index}`}>Unidad de Medida:</label>
                            <select
                                id={`unidad-${index}`}
                                value={detalle.id_unidad_medida_solicitada_fk}
                                onChange={(e) => handleDetalleChange(index, 'id_unidad_medida_solicitada_fk', e.target.value)}
                                required
                            >
                                <option value={0}>-- Seleccione Unidad --</option>
                                {unidadesMedida.map(um => <option key={um.id_unidad_medida} value={um.id_unidad_medida}>{um.nombre_unidad} ({um.abreviatura})</option>)}
                            </select>
                        </div>
                        {detalles.length > 1 && (
                            <button type="button" onClick={() => removeDetalle(index)} style={{ marginTop: '5px', backgroundColor: 'salmon' }}>
                                Eliminar Producto
                            </button>
                        )}
                    </div>
                ))}
                <button type="button" onClick={addDetalle} style={{ marginTop: '10px' }}>
                    Añadir Otro Producto
                </button>
                <hr />
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <button type="submit" disabled={isLoading} style={{ marginTop: '20px', padding: '10px 15px' }}>
                    {isLoading ? 'Creando Solicitud...' : 'Crear Solicitud'}
                </button>
            </form>
        </div>
    );
};

export default CreateSolicitudPage;
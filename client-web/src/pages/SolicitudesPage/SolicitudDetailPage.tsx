// client-web/src/pages/SolicitudesPage/SolicitudDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSolicitudById, aprobarSolicitud, rechazarSolicitud, entregarSolicitud} from '../../services/solicitudService';
import type { SolicitudReservaFrontend, AprobarSolicitudPayload, RechazarSolicitudPayload, EntregarSolicitudPayload } from '../../services/solicitudService';
import { useAuth } from '../../contexts/AuthContext'; // Para verificar roles

const SolicitudDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth(); // Obtener el usuario actual y su rol
    const [solicitud, setSolicitud] = useState<SolicitudReservaFrontend | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [isApproving, setIsApproving] = useState<boolean>(false);
    const [approvalNotes, setApprovalNotes] = useState<string>('');
    const [approvedQuantities, setApprovedQuantities] = useState<{ [key: number]: string }>({}); // Usamos string para el input
    
    const [isRejecting, setIsRejecting] = useState<boolean>(false);
    const [rejectionReason, setRejectionReason] = useState<string>('');
    
    const numericId = parseInt(id || '0', 10);

    const fetchSolicitud = async () => {
        if (id) {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getSolicitudById(numericId);
                setSolicitud(data);

                // Inicializar el estado de cantidades aprobadas con las solicitadas
                const initialQuantities: { [key: number]: string } = {};
                data.detalles_solicitud.forEach(detalle => {
                    initialQuantities[detalle.id_detalle_solicitud] = detalle.cantidad_solicitada_convertida_a_primaria.toString();
                });
                setApprovedQuantities(initialQuantities);

            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        } else {
            setError("No se especificó un ID de solicitud.");
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSolicitud();
    }, [id]);

    const handleQuantityChange = (idDetalle: number, cantidad: string) => {
        setApprovedQuantities(prev => ({ ...prev, [idDetalle]: cantidad }));
    };

    const handleApprovalSubmit = async () => {
        if (!solicitud) return;
        setError(null);
        setIsLoading(true);

        const payload: AprobarSolicitudPayload = {
            notas_almacenista: approvalNotes,
            detalles_aprobados: Object.entries(approvedQuantities).map(([id_detalle, cantidad]) => ({
                id_detalle_solicitud: parseInt(id_detalle),
                cantidad_aprobada_primaria: Number(cantidad) || 0
            }))
        };

        try {
            await aprobarSolicitud(solicitud.id_solicitud, payload);
            alert("Solicitud aprobada exitosamente.");
            setIsApproving(false);
            await fetchSolicitud(); // Recargar los datos de la solicitud
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    const handleRejectionSubmit = async () => {
        if (!solicitud) return;
        if (!rejectionReason.trim()) {
            setError("Debe proporcionar una razón para el rechazo.");
            return;
        }
        setError(null);
        setIsLoading(true);

        const payload: RechazarSolicitudPayload = {
            razon_rechazo: rejectionReason,
            notas_almacenista: approvalNotes // Reutilizamos el campo de notas
        };

        try {
            await rechazarSolicitud(solicitud.id_solicitud, payload);
            alert("Solicitud rechazada exitosamente.");
            setIsRejecting(false);
            await fetchSolicitud(); // Recargar los datos
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    const puedeProcesar = user?.rol === 'Administrador' || user?.rol === 'Almacenista';
    const handleDelivery = async () => {
        if (!solicitud) return;

        if (window.confirm("¿Estás seguro de que deseas marcar esta solicitud como entregada? Esta acción modificará el stock de los productos de forma permanente.")) {
            setIsLoading(true);
            setError(null);
            try {
                // Por ahora enviamos un payload vacío, pero podríamos añadir un campo para notas de entrega
                const payload: EntregarSolicitudPayload = {}; 
                await entregarSolicitud(solicitud.id_solicitud, payload);
                alert("¡Solicitud marcada como entregada! El stock ha sido actualizado.");
                await fetchSolicitud(); // Recargar los datos para ver el estado final
            } catch (err: any) {
                setError(err.message || 'Ocurrió un error al procesar la entrega.');
            } finally {
                setIsLoading(false);
            }
        }
    };
    if (isLoading) return <p>Cargando detalles de la solicitud...</p>;
    if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
    if (!solicitud) return <p>Solicitud no encontrada.</p>;

    return (
        <div>
            <h2>Detalle de Solicitud de Reserva #{solicitud.id_solicitud}</h2>
            <p><strong>Propósito:</strong> {solicitud.proposito_solicitud}</p>
            <p><strong>Estado:</strong> {solicitud.estado_solicitud}</p>
            <p><strong>Solicitante (Vendedor):</strong> {solicitud.vendedor?.nombre_completo || solicitud.vendedor?.nombre_usuario}</p>
            <p><strong>Fecha Solicitud:</strong> {new Date(solicitud.fecha_solicitud).toLocaleString()}</p>
            {solicitud.fecha_requerida_entrega && <p><strong>Fecha Requerida Entrega:</strong> {new Date(solicitud.fecha_requerida_entrega).toLocaleDateString()}</p>}
            {solicitud.justificacion_detallada && <p><strong>Justificación:</strong> {solicitud.justificacion_detallada}</p>}

            {solicitud.almacenista_procesa && (
                <p><strong>Procesada por:</strong> {solicitud.almacenista_procesa.nombre_completo || solicitud.almacenista_procesa.nombre_usuario} el {solicitud.fecha_procesamiento ? new Date(solicitud.fecha_procesamiento).toLocaleString() : ''}</p>
            )}
            {solicitud.estado_solicitud === 'Rechazada' && solicitud.razon_rechazo && <p><strong>Razón Rechazo:</strong> {solicitud.razon_rechazo}</p>}
            {solicitud.notas_almacenista && <p><strong>Notas Almacén:</strong> {solicitud.notas_almacenista}</p>}
            {solicitud.fecha_entrega_efectiva && <p><strong>Fecha Entrega Efectiva:</strong> {new Date(solicitud.fecha_entrega_efectiva).toLocaleString()}</p>}


            <h3>Productos Solicitados:</h3>
            <table border={1} style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                <thead>
                    <tr>
                        <th>Producto (SKU)</th>
                        <th>Cantidad Solicitada</th>
                        <th>Unidad Sol.</th>
                        <th>Cant. Aprobada (Primaria)</th>
                        <th>Cant. Entregada (Primaria)</th>
                    </tr>
                </thead>
                <tbody>
                    {solicitud.detalles_solicitud.map(detalle => (
                        <tr key={detalle.id_detalle_solicitud}>
                            <td>{detalle.producto.nombre_producto} ({detalle.producto.sku})</td>
                            <td>{detalle.cantidad_solicitada}</td>
                            <td>{detalle.unidad_medida_solicitada.abreviatura}</td>
                            <td>{detalle.cantidad_aprobada_primaria !== null ? detalle.cantidad_aprobada_primaria : '-'}</td>
                            <td>{detalle.cantidad_entregada_primaria}</td>

                            {isApproving ? (
                                <td>
                                    <input
                                        type="number"
                                        value={approvedQuantities[detalle.id_detalle_solicitud] || ''}
                                        onChange={(e) => handleQuantityChange(detalle.id_detalle_solicitud, e.target.value)}
                                        max={detalle.cantidad_solicitada_convertida_a_primaria}
                                        min="0"
                                        style={{ width: '60px' }}
                                    />
                                </td>
                            ) : (
                                (solicitud.estado_solicitud !== 'Pendiente') && <td>{detalle.cantidad_aprobada_primaria ?? '-'}</td>
                            )}
                        
                        </tr>
                    ))}
                </tbody>
            </table>
            <br/>
            {/* Mostramos el formulario de aprobación si estamos en modo de aprobación */}
            {isApproving && (
                <div style={{ border: '1px solid #ccc', padding: '15px', marginTop: '15px' }}>
                    <h4>Confirmar Aprobación</h4>
                    <div>
                        <label htmlFor="approvalNotes">Notas de Almacén (Opcional):</label>
                        <textarea
                            id="approvalNotes"
                            value={approvalNotes}
                            onChange={(e) => setApprovalNotes(e.target.value)}
                            rows={3}
                            style={{ width: '100%', marginTop: '5px' }}
                        />
                    </div>
                    <button onClick={handleApprovalSubmit} disabled={isLoading} style={{ marginTop: '10px', backgroundColor: 'lightgreen' }}>
                        {isLoading ? 'Procesando...' : 'Confirmar Aprobación'}
                    </button>
                    <button onClick={() => setIsApproving(false)} disabled={isLoading} style={{ marginLeft: '10px' }}>
                        Cancelar
                    </button>
                </div>
            )}
            {/* --- AÑADE ESTE NUEVO FORMULARIO PARA RECHAZO --- */}
            {isRejecting && (
                <div style={{ border: '1px solid #ccc', padding: '15px', marginTop: '15px' }}>
                    <h4>Confirmar Rechazo</h4>
                    <div>
                        <label htmlFor="rejectionReason">Razón del Rechazo (Obligatorio):</label>
                        <textarea
                            id="rejectionReason"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows={3}
                            style={{ width: '100%', marginTop: '5px' }}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="rejectionNotes">Notas de Almacén (Opcional):</label>
                        <textarea
                            id="rejectionNotes"
                            value={approvalNotes} // Reutilizamos este estado
                            onChange={(e) => setApprovalNotes(e.target.value)}
                            rows={2}
                            style={{ width: '100%', marginTop: '5px' }}
                        />
                    </div>
                    <button onClick={handleRejectionSubmit} disabled={isLoading} style={{ marginTop: '10px', backgroundColor: 'salmon' }}>
                        {isLoading ? 'Procesando...' : 'Confirmar Rechazo'}
                    </button>
                    <button onClick={() => setIsRejecting(false)} disabled={isLoading} style={{ marginLeft: '10px' }}>
                        Cancelar
                    </button>
                </div>
            )}
            {/* Botones de Acción (visibilidad condicional) */}
            <div style={{ marginTop: '20px' }}>
                {puedeProcesar && solicitud.estado_solicitud === 'Pendiente' && !isApproving && (
                    <>
                        <button onClick={() => setIsApproving(true)} style={{marginRight: '10px', backgroundColor: 'lightgreen'}}>Aprobar Solicitud</button>
                        <button onClick={() => setIsRejecting(true)} style={{backgroundColor: 'salmon'}}>Rechazar Solicitud</button>
                        
                    </>
                )}
                {puedeProcesar && (solicitud.estado_solicitud === 'Aprobada' || solicitud.estado_solicitud === 'Parcialmente Aprobada') && (
                    <button onClick={handleDelivery} disabled={isLoading} style={{backgroundColor: 'blue'}}>
                        {isLoading ? 'Procesando...' : 'Marcar como Entregada'}
                    </button>
                )}
            </div>
            
            {error && <p style={{ color: 'red', marginTop: '15px' }}>{error}</p>}

            <br />
            <Link to="/solicitudes">Volver a la lista de solicitudes</Link>
        </div>
    );
};

export default SolicitudDetailPage;
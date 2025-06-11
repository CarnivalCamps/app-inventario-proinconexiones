// client-web/src/pages/SolicitudesPage/SolicitudDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSolicitudById, aprobarSolicitud, rechazarSolicitud, entregarSolicitud} from '../../services/solicitudService';
import type { SolicitudReservaFrontend, AprobarSolicitudPayload, RechazarSolicitudPayload, EntregarSolicitudPayload } from '../../services/solicitudService';
import { useAuth } from '../../contexts/AuthContext';

// Imports de MUI
import {
    Paper, Box, Typography, Grid, Divider, Button, CircularProgress, Alert, Chip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Función de ayuda para dar color al estado de la solicitud
const getStatusChipColor = (status: string) => {
    switch (status) {
        case 'Aprobada':
        case 'Parcialmente Aprobada':
        case 'Entregada':
            return 'success';
        case 'Pendiente':
            return 'warning';
        case 'Rechazada':
        case 'Cancelada':
            return 'error';
        default:
            return 'default';
    }
};

const SolicitudDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [solicitud, setSolicitud] = useState<SolicitudReservaFrontend | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Estados para los modos de edición
    const [isApproving, setIsApproving] = useState<boolean>(false);
    const [isRejecting, setIsRejecting] = useState<boolean>(false);

    // Estado para los modales
    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);

    // Estados para los formularios
    const [approvalNotes, setApprovalNotes] = useState<string>('');
    const [approvedQuantities, setApprovedQuantities] = useState<{ [key: number]: string }>({});
    const [rejectionReason, setRejectionReason] = useState<string>('');

    const numericId = parseInt(id || '0', 10);

    const fetchSolicitud = async () => {
        if (id) {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getSolicitudById(numericId);
                setSolicitud(data);

                // Inicializar cantidades a aprobar con las solicitadas
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
        setIsProcessing(true);

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
            setApproveModalOpen(false);
            await fetchSolicitud();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRejectionSubmit = async () => {
        if (!solicitud) return;
        if (!rejectionReason.trim()) {
            setError("Debe proporcionar una razón para el rechazo.");
            return;
        }
        setError(null);
        setIsProcessing(true);

        const payload: RechazarSolicitudPayload = {
            razon_rechazo: rejectionReason,
            notas_almacenista: approvalNotes
        };

        try {
            await rechazarSolicitud(solicitud.id_solicitud, payload);
            alert("Solicitud rechazada exitosamente.");
            setIsRejecting(false);
            setRejectModalOpen(false);
            await fetchSolicitud();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDelivery = async () => {
        if (!solicitud) return;

        if (window.confirm("¿Estás seguro de que deseas marcar esta solicitud como entregada? Esta acción modificará el stock de los productos de forma permanente.")) {
            setIsProcessing(true);
            setError(null);
            try {
                const payload: EntregarSolicitudPayload = {};
                await entregarSolicitud(solicitud.id_solicitud, payload);
                alert("¡Solicitud marcada como entregada! El stock ha sido actualizado.");
                await fetchSolicitud();
            } catch (err: any) {
                setError(err.message || 'Ocurrió un error al procesar la entrega.');
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const puedeProcesar = user?.rol === 'Administrador' || user?.rol === 'Almacenista';

    if (isLoading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;
    if (!solicitud) return <Alert severity="warning">Solicitud no encontrada.</Alert>;

    return (
        <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <div>
                    <Typography variant="h4" component="h1">Solicitud de Reserva #{solicitud.id_solicitud}</Typography>
                    <Chip label={solicitud.estado_solicitud} color={getStatusChipColor(solicitud.estado_solicitud)} sx={{ mt: 1 }} />
                </div>
                {/* Botones de Acción Principales */}
                <Box>
                    {puedeProcesar && solicitud.estado_solicitud === 'Pendiente' && !isApproving && !isRejecting && (
                        <>
                            <Button variant="contained" color="success" startIcon={<CheckCircleIcon />} onClick={() => setApproveModalOpen(true)} sx={{ mr: 1 }}>Aprobar</Button>
                            <Button variant="contained" color="error" startIcon={<CancelIcon />} onClick={() => setRejectModalOpen(true)}>Rechazar</Button>
                        </>
                    )}
                    {puedeProcesar && (solicitud.estado_solicitud === 'Aprobada' || solicitud.estado_solicitud === 'Parcialmente Aprobada') && (
                        <Button variant="contained" color="info" startIcon={<LocalShippingIcon />} onClick={handleDelivery} disabled={isProcessing}>
                            {isProcessing ? 'Procesando Entrega...' : 'Marcar como Entregada'}
                        </Button>
                    )}
                </Box>
            </Box>
            <Divider sx={{ my: 2 }} />

            {/* Grid para mostrar detalles de la solicitud */}
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="h6">Información General</Typography>
                    <p><strong>Propósito:</strong> {solicitud.proposito_solicitud}</p>
                    <p><strong>Solicitante:</strong> {solicitud.vendedor.nombre_completo || solicitud.vendedor.nombre_usuario}</p>
                    <p><strong>Fecha Solicitud:</strong> {new Date(solicitud.fecha_solicitud).toLocaleString()}</p>
                    {solicitud.fecha_requerida_entrega && <p><strong>Fecha Requerida:</strong> {new Date(solicitud.fecha_requerida_entrega).toLocaleDateString()}</p>}
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="h6">Detalles de Procesamiento</Typography>
                    <p><strong>Procesada por:</strong> {solicitud.almacenista_procesa?.nombre_usuario || 'N/A'}</p>
                    <p><strong>Fecha Procesamiento:</strong> {solicitud.fecha_procesamiento ? new Date(solicitud.fecha_procesamiento).toLocaleString() : 'N/A'}</p>
                    {solicitud.estado_solicitud === 'Rechazada' && <p><strong>Razón Rechazo:</strong> {solicitud.razon_rechazo}</p>}
                    <p><strong>Notas Almacén:</strong> {solicitud.notas_almacenista || 'N/A'}</p>
                </Grid>
            </Grid>

            <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Productos Solicitados</Typography>
            <TableContainer component={Paper} elevation={2}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Producto (SKU)</TableCell>
                            <TableCell>Cantidad Solicitada</TableCell>
                            <TableCell>Unidad Sol.</TableCell>
                            <TableCell>Cant. Aprobada (Primaria)</TableCell>
                            <TableCell>Cant. Entregada (Primaria)</TableCell>
                            {isApproving && <TableCell>Cantidad a Aprobar</TableCell>}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {solicitud.detalles_solicitud.map(detalle => (
                            <TableRow key={detalle.id_detalle_solicitud}>
                                <TableCell>{detalle.producto.nombre_producto} ({detalle.producto.sku})</TableCell>
                                <TableCell>{detalle.cantidad_solicitada}</TableCell>
                                <TableCell>{detalle.unidad_medida_solicitada.abreviatura}</TableCell>
                                <TableCell>{detalle.cantidad_aprobada_primaria !== null ? detalle.cantidad_aprobada_primaria : '-'}</TableCell>
                                <TableCell>{detalle.cantidad_entregada_primaria}</TableCell>
                                {isApproving && (
                                    <TableCell>
                                        <TextField
                                            type="number"
                                            size="small"
                                            value={approvedQuantities[detalle.id_detalle_solicitud] || ''}
                                            onChange={(e) => handleQuantityChange(detalle.id_detalle_solicitud, e.target.value)}
                                            inputProps={{
                                                max: detalle.cantidad_solicitada_convertida_a_primaria,
                                                min: 0
                                            }}
                                            sx={{ width: '100px' }}
                                        />
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Formulario inline de aprobación */}
            {isApproving && (
                <Paper elevation={2} sx={{ p: 2, mt: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                    <Typography variant="h6">Confirmar Aprobación</Typography>
                    <TextField
                        label="Notas de Almacén (Opcional)"
                        fullWidth
                        multiline
                        rows={3}
                        value={approvalNotes}
                        onChange={(e) => setApprovalNotes(e.target.value)}
                        sx={{ mt: 1, bgcolor: 'white' }}
                    />
                    <Box sx={{ mt: 2 }}>
                        <Button variant="contained" color="success" onClick={handleApprovalSubmit} disabled={isProcessing} sx={{ mr: 1 }}>
                            {isProcessing ? 'Procesando...' : 'Confirmar Aprobación'}
                        </Button>
                        <Button variant="outlined" onClick={() => setIsApproving(false)} disabled={isProcessing}>
                            Cancelar
                        </Button>
                    </Box>
                </Paper>
            )}

            {/* Formulario inline de rechazo */}
            {isRejecting && (
                <Paper elevation={2} sx={{ p: 2, mt: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
                    <Typography variant="h6">Confirmar Rechazo</Typography>
                    <TextField
                        label="Razón del Rechazo (Obligatorio)"
                        fullWidth
                        multiline
                        rows={3}
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        required
                        sx={{ mt: 1, bgcolor: 'white' }}
                    />
                    <TextField
                        label="Notas de Almacén (Opcional)"
                        fullWidth
                        multiline
                        rows={2}
                        value={approvalNotes}
                        onChange={(e) => setApprovalNotes(e.target.value)}
                        sx={{ mt: 1, bgcolor: 'white' }}
                    />
                    <Box sx={{ mt: 2 }}>
                        <Button variant="contained" color="error" onClick={handleRejectionSubmit} disabled={isProcessing} sx={{ mr: 1 }}>
                            {isProcessing ? 'Procesando...' : 'Confirmar Rechazo'}
                        </Button>
                        <Button variant="outlined" onClick={() => setIsRejecting(false)} disabled={isProcessing}>
                            Cancelar
                        </Button>
                    </Box>
                </Paper>
            )}

            {/* Botones de Acción Alternativos (estilo simple) */}
            {puedeProcesar && solicitud.estado_solicitud === 'Pendiente' && !isApproving && !isRejecting && (
                <Box sx={{ mt: 2 }}>
                    <Button variant="outlined" color="success" onClick={() => setIsApproving(true)} sx={{ mr: 1 }}>
                        Modo Aprobación
                    </Button>
                    <Button variant="outlined" color="error" onClick={() => setIsRejecting(true)}>
                        Modo Rechazo
                    </Button>
                </Box>
            )}

            <Button variant="outlined" component={Link} to="/solicitudes" startIcon={<ArrowBackIcon />} sx={{ mt: 3 }}>
                Volver a la lista
            </Button>

            {/* --- MODAL (DIALOG) PARA APROBAR SOLICITUD --- */}
            <Dialog open={approveModalOpen} onClose={() => setApproveModalOpen(false)} fullWidth maxWidth="md">
                <DialogTitle>Aprobar Solicitud de Reserva #{solicitud.id_solicitud}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Por favor, revise las cantidades solicitadas y confirme las cantidades a aprobar para cada producto.
                    </DialogContentText>
                    <Table size="small" sx={{ mt: 2 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Producto</TableCell>
                                <TableCell>Solicitado</TableCell>
                                <TableCell>Cantidad a Aprobar</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {solicitud.detalles_solicitud.map(detalle => (
                                <TableRow key={detalle.id_detalle_solicitud}>
                                    <TableCell>{detalle.producto.nombre_producto}</TableCell>
                                    <TableCell>{detalle.cantidad_solicitada_convertida_a_primaria}</TableCell>
                                    <TableCell>
                                        <TextField
                                            type="number"
                                            size="small"
                                            value={approvedQuantities[detalle.id_detalle_solicitud] || ''}
                                            onChange={(e) => handleQuantityChange(detalle.id_detalle_solicitud, e.target.value)}
                                            inputProps={{
                                                max: detalle.cantidad_solicitada_convertida_a_primaria,
                                                min: 0
                                            }}
                                            sx={{ width: '100px' }}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <TextField
                        label="Notas de Almacén (Opcional)"
                        fullWidth
                        multiline
                        rows={2}
                        value={approvalNotes}
                        onChange={(e) => setApprovalNotes(e.target.value)}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setApproveModalOpen(false)}>Cancelar</Button>
                    <Button onClick={handleApprovalSubmit} variant="contained" color="success" disabled={isProcessing}>
                        {isProcessing ? 'Procesando...' : 'Confirmar Aprobación'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* --- MODAL (DIALOG) PARA RECHAZAR SOLICITUD --- */}
            <Dialog open={rejectModalOpen} onClose={() => setRejectModalOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Rechazar Solicitud de Reserva #{solicitud.id_solicitud}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Por favor, especifique la razón por la cual se está rechazando esta solicitud.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="rejectionReason"
                        label="Razón del Rechazo"
                        type="text"
                        fullWidth
                        variant="standard"
                        required
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                    />
                    <TextField
                        margin="dense"
                        id="rejectionNotes"
                        label="Notas Adicionales (Opcional)"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={approvalNotes}
                        onChange={(e) => setApprovalNotes(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRejectModalOpen(false)}>Cancelar</Button>
                    <Button onClick={handleRejectionSubmit} variant="contained" color="error" disabled={isProcessing}>
                        {isProcessing ? 'Procesando...' : 'Confirmar Rechazo'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default SolicitudDetailPage;
// client-web/src/pages/OrdenesCompraPage/OrdenCompraDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
// Importar las nuevas funciones y tipos del servicio
import { getOrdenCompraById, registrarRecepcion, updateOrdenCompraEstado } from '../../services/ordenCompraService';
import type { OrdenCompraFrontend, DetalleRecepcionInput } from '../../services/ordenCompraService';
import { useAuth } from '../../contexts/AuthContext';

// Imports de MUI
import {
    Paper, Box, Typography, Grid, Divider, Button, CircularProgress, Alert, Chip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import SendIcon from '@mui/icons-material/Send';
import CancelIcon from '@mui/icons-material/Cancel';


const getStatusChipColor = (status: string) => {
    switch (status) {
        case 'Recibida Totalmente': return 'success';
        case 'Enviada': case 'Recibida Parcialmente': return 'info';
        case 'Borrador': return 'default';
        case 'Cancelada': return 'error';
        default: return 'secondary';
    }
};

const OrdenCompraDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [orden, setOrden] = useState<OrdenCompraFrontend | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Estado para el modal de recepción
    const [receptionModalOpen, setReceptionModalOpen] = useState(false);
    const [receivedQuantities, setReceivedQuantities] = useState<{ [id_detalle: number]: string }>({});

    const numericId = parseInt(id || '0', 10);

    const fetchOrden = async () => {
        if (numericId > 0) {
            try {
                // No ponemos isLoading a true aquí para que las recargas sean más suaves
                const data = await getOrdenCompraById(numericId);
                setOrden(data);
            } catch (err: any) { setError(err.message); }
            finally { setIsLoading(false); }
        }
    };

    useEffect(() => { fetchOrden(); }, [id]);

    const handleOpenReceptionModal = () => {
        if (!orden) return;
        // Inicializar las cantidades a recibir con lo pendiente de cada ítem
        const initialQuantities: { [id_detalle: number]: string } = {};
        orden.detalles.forEach(d => {
            const pendiente = d.cantidad_solicitada - d.cantidad_recibida;
            initialQuantities[d.id_detalle_orden] = pendiente > 0 ? pendiente.toString() : '0';
        });
        setReceivedQuantities(initialQuantities);
        setReceptionModalOpen(true);
    };

    const handleQuantityChange = (idDetalle: number, cantidad: string) => {
        setReceivedQuantities(prev => ({ ...prev, [idDetalle]: cantidad }));
    };

    const handleReceptionSubmit = async () => {
        if (!orden) return;
        setError(null);
        setIsProcessing(true);

        const payload: DetalleRecepcionInput[] = Object.entries(receivedQuantities)
            .map(([id_detalle, cantidad]) => ({
                id_detalle_orden: parseInt(id_detalle),
                cantidad_recibida: Number(cantidad) || 0
            }))
            .filter(item => item.cantidad_recibida > 0); // Solo enviar ítems que se están recibiendo

        if (payload.length === 0) {
            setError("Debe ingresar una cantidad mayor a 0 para al menos un producto.");
            setIsProcessing(false);
            return;
        }

        try {
            await registrarRecepcion(orden.id_orden_compra, payload);
            alert("Recepción registrada exitosamente. El stock ha sido actualizado.");
            setReceptionModalOpen(false);
            await fetchOrden();
        } catch(err: any) {
            setError(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // --- NUEVA FUNCIÓN PARA ACTUALIZAR ESTADO ---
    const handleUpdateEstado = async (nuevoEstado: string) => {
        if (!orden) return;

        const confirmMessage = `¿Estás seguro de que deseas cambiar el estado de la orden a "${nuevoEstado}"?`;
        if (window.confirm(confirmMessage)) {
            setIsProcessing(true);
            setError(null);
            try {
                await updateOrdenCompraEstado(orden.id_orden_compra, { nuevo_estado: nuevoEstado });
                alert(`Estado de la orden actualizado a "${nuevoEstado}".`);
                await fetchOrden(); // Recargar los datos para ver el cambio
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsProcessing(false);
            }
        }
    };


    const puedeProcesar = user?.rol === 'Administrador' || user?.rol === 'Almacenista';

    if (isLoading) return <CircularProgress />;
    if (error && !orden) return <Alert severity="error">{error}</Alert>;
    if (!orden) return <Alert severity="warning">Orden de compra no encontrada.</Alert>;

    return (
        <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <div>
                    <Typography variant="h4" component="h1">Orden de Compra #{orden.id_orden_compra}</Typography>
                    <Chip label={orden.estado} color={getStatusChipColor(orden.estado)} sx={{ mt: 1 }} />
                </div>
            </Box>
            <Divider sx={{ my: 2 }} />

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="h6">Proveedor</Typography>
                    <Typography variant="body1">{orden.proveedor.nombre_proveedor}</Typography>
                    {/* Aquí podrías añadir más detalles del proveedor si los necesitas */}
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="h6">Fechas</Typography>
                    <Typography variant="body2"><strong>Emisión:</strong> {new Date(orden.fecha_emision).toLocaleDateString()}</Typography>
                    <Typography variant="body2"><strong>Entrega Esperada:</strong> {orden.fecha_entrega_esperada ? new Date(orden.fecha_entrega_esperada).toLocaleDateString() : 'N/A'}</Typography>
                </Grid>
            </Grid>

            <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Productos Solicitados</Typography>
            <TableContainer component={Paper} variant="outlined">
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Producto (SKU)</TableCell>
                            <TableCell align="right">Costo Unitario</TableCell>
                            <TableCell align="right">Cant. Solicitada</TableCell>
                            <TableCell align="right">Cant. Recibida</TableCell>
                            <TableCell align="right">Subtotal</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {orden.detalles.map((detalle) => (
                            <TableRow key={detalle.id_detalle_orden}>
                                <TableCell>{detalle.producto.nombre_producto} ({detalle.producto.sku})</TableCell>
                                <TableCell align="right">${Number(detalle.costo_unitario).toFixed(2)}</TableCell>
                                <TableCell align="right">{detalle.cantidad_solicitada}</TableCell>
                                <TableCell align="right">{detalle.cantidad_recibida}</TableCell>
                                <TableCell align="right">${(detalle.cantidad_solicitada * Number(detalle.costo_unitario)).toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Box sx={{ width: '300px' }}>
                    <Typography variant="body1" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Subtotal:</span>
                        <span>${Number(orden.subtotal).toFixed(2)}</span>
                    </Typography>
                    <Typography variant="body1" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Impuestos:</span>
                        <span>${Number(orden.impuestos).toFixed(2)}</span>
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="h6" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Total:</span>
                        <span>${Number(orden.total).toFixed(2)}</span>
                    </Typography>
                </Box>
            </Box>

            {/* --- SECCIÓN DE ACCIONES --- */}
            <Divider sx={{ my: 3 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button variant="outlined" component={RouterLink} to="/ordenes-compra" startIcon={<ArrowBackIcon />}>
                    Volver a la lista
                </Button>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    {/* Botón para cambiar estado a 'Enviada' */}
                    {puedeProcesar && orden.estado === 'Borrador' && (
                        <Button 
                            variant="contained" 
                            color="primary" 
                            startIcon={<SendIcon />} 
                            onClick={() => handleUpdateEstado('Enviada')} 
                            disabled={isProcessing}
                        >
                            Marcar como Enviada
                        </Button>
                    )}

                    {/* Botón para Registrar Recepción */}
                    {puedeProcesar && ['Enviada', 'Recibida Parcialmente'].includes(orden.estado) && (
                        <Button 
                            variant="contained" 
                            color="success" 
                            startIcon={<ShoppingCartCheckoutIcon />} 
                            onClick={handleOpenReceptionModal} 
                            disabled={isProcessing}
                        >
                            Registrar Recepción
                        </Button>
                    )}

                    {/* Botón para Cancelar Orden */}
                    {puedeProcesar && ['Borrador', 'Enviada', 'Recibida Parcialmente'].includes(orden.estado) && (
                         <Button 
                            variant="contained" 
                            color="error" 
                            startIcon={<CancelIcon />} 
                            onClick={() => handleUpdateEstado('Cancelada')} 
                            disabled={isProcessing}
                        >
                            Cancelar Orden
                        </Button>
                    )}
                </Box>
            </Box>
            {error && <Alert severity="error" sx={{mt: 2}}>{error}</Alert>}

            {/* --- MODAL (DIALOG) PARA REGISTRAR RECEPCIÓN --- */}
            <Dialog open={receptionModalOpen} onClose={() => setReceptionModalOpen(false)} fullWidth maxWidth="md">
                <DialogTitle>Registrar Recepción para OC #{orden.id_orden_compra}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Ingrese las cantidades que están llegando físicamente para cada producto.
                    </DialogContentText>
                    <TableContainer sx={{mt: 2}}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Producto</TableCell>
                                    <TableCell align="center">Solicitado</TableCell>
                                    <TableCell align="center">Ya Recibido</TableCell>
                                    <TableCell align="center">Pendiente</TableCell>
                                    <TableCell align="center">Cantidad a Recibir Ahora</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {orden.detalles.map(d => {
                                    const pendiente = d.cantidad_solicitada - d.cantidad_recibida;
                                    return (
                                        <TableRow key={d.id_detalle_orden}>
                                            <TableCell>{d.producto.nombre_producto}</TableCell>
                                            <TableCell align="center">{d.cantidad_solicitada}</TableCell>
                                            <TableCell align="center">{d.cantidad_recibida}</TableCell>
                                            <TableCell align="center">{pendiente}</TableCell>
                                            <TableCell align="center">
                                                {pendiente > 0 ? (
                                                     <TextField
                                                        type="number"
                                                        size="small"
                                                        value={receivedQuantities[d.id_detalle_orden] || ''}
                                                        onChange={(e) => handleQuantityChange(d.id_detalle_orden, e.target.value)}
                                                        InputProps={{ inputProps: { min: 0, max: pendiente } }}
                                                        sx={{ width: '80px' }}
                                                    />
                                                ) : (
                                                    'Completado'
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setReceptionModalOpen(false)}>Cancelar</Button>
                    <Button onClick={handleReceptionSubmit} variant="contained" color="success" disabled={isProcessing}>
                        {isProcessing ? 'Procesando...' : 'Confirmar Recepción'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default OrdenCompraDetailPage;
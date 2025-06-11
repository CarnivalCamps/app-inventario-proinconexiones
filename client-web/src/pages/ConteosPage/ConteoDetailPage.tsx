// client-web/src/pages/ConteosPage/ConteoDetailPage.tsx
import React, { useState, useEffect } from 'react';
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
import { useAuth } from '../../contexts/AuthContext';

// Imports de MUI
import {
    Paper, Box, Typography, Grid, TextField, Button, Select, MenuItem,
    InputLabel, FormControl, CircularProgress, Alert, Chip,
    // CORRECIÓN: Se añaden los componentes de tabla que faltaban
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
// CORRECIÓN: Se importa el icono que faltaba
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// Función de ayuda para el color del Chip
const getStatusChipColor = (status: string): 'success' | 'warning' | 'info' | 'error' | 'default' => {
    switch (status) {
        case 'Ajustes Aplicados': return 'success';
        case 'Iniciado': case 'En Progreso': return 'warning';
        case 'Registrado': return 'info';
        case 'Cancelado': return 'error';
        default: return 'default';
    }
};

const ConteoDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [conteo, setConteo] = useState<ConteoFisicoFrontend | null>(null);
    const [productos, setProductos] = useState<ProductoFrontend[]>([]);
    const [newDetail, setNewDetail] = useState<{ id_producto_fk: string; cantidad: string; notas: string }>({ id_producto_fk: '', cantidad: '', notas: '' });
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const numericId = parseInt(id || '0', 10);

    const fetchConteoAndProducts = async () => {
        if (numericId > 0) {
            try {
                setError(null);
                const [conteoData, productosData] = await Promise.all([
                    getConteoById(numericId),
                    getProductos()
                ]);
                setConteo(conteoData);
                setProductos(productosData);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        } else {
            setError("ID de conteo inválido.");
            setIsLoading(false);
        }
    };
    // CORRECIÓN: Se eliminó una llave '}' extra que estaba aquí y rompía el componente.

    useEffect(() => {
        fetchConteoAndProducts();
    }, [id]);

    const handleNewDetailChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
        const { name, value } = e.target;
        setNewDetail(prev => ({ ...prev, [name]: value }));
    };

    const handleAddDetailSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!newDetail.id_producto_fk || !newDetail.cantidad) {
            setError("Por favor, seleccione un producto e ingrese una cantidad.");
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
            setNewDetail({ id_producto_fk: '', cantidad: '', notas: '' });
            await fetchConteoAndProducts();
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

    if (isLoading) return <CircularProgress />;
    if (error && !conteo) return <Alert severity="error">{error}</Alert>;
    if (!conteo) return <Alert severity="warning">Conteo no encontrado.</Alert>;

    return (
        <Paper elevation={3} sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h4" component="h1">
                    Detalle de Conteo Físico #{conteo.id_conteo}
                </Typography>
                <Chip label={conteo.estado_conteo} color={getStatusChipColor(conteo.estado_conteo)} />
            </Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6 }}><Typography><strong>Responsable:</strong> {conteo.usuario_responsable.nombre_usuario}</Typography></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><Typography><strong>Fecha Inicio:</strong> {new Date(conteo.fecha_inicio_conteo).toLocaleString()}</Typography></Grid>
                {conteo.descripcion_motivo_conteo && <Grid size={{ xs: 12 }}><Typography><strong>Motivo:</strong> {conteo.descripcion_motivo_conteo}</Typography></Grid>}
            </Grid>

            <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Productos Registrados</Typography>
            <TableContainer component={Paper} elevation={2}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                            {/* CORRECIÓN: Se usan TableCell en lugar de <th> para las cabeceras */}
                            <TableCell sx={{ fontWeight: 'bold' }}>Producto (SKU)</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} align="center">Stock Teórico</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} align="center">Stock Físico</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} align="center">Diferencia</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Notas</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {conteo.detalles_conteo.length > 0 ? (
                            conteo.detalles_conteo.map(detalle => (
                                <TableRow key={detalle.id_detalle_conteo} hover>
                                    <TableCell>{detalle.producto.nombre_producto} ({detalle.producto.sku})</TableCell>
                                    <TableCell align="center">{detalle.stock_teorico_primaria}</TableCell>
                                    <TableCell align="center">{detalle.stock_fisico_contado_primaria}</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold', color: detalle.diferencia_primaria === 0 ? 'inherit' : (detalle.diferencia_primaria > 0 ? 'success.main' : 'error.main') }}>
                                        {detalle.diferencia_primaria > 0 ? `+${detalle.diferencia_primaria}` : detalle.diferencia_primaria}
                                    </TableCell>
                                    <TableCell>{detalle.notas_detalle_conteo || '-'}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={5} align="center">Aún no se han añadido productos a este conteo.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {puedeProcesar && (conteo.estado_conteo === 'Iniciado' || conteo.estado_conteo === 'En Progreso') && (
                <Paper variant="outlined" sx={{ p: 2, mt: 3 }}>
                    <Typography variant="h6" gutterBottom>Añadir o Actualizar Producto</Typography>
                    <Box component="form" onSubmit={handleAddDetailSubmit} noValidate>
                        <Grid container spacing={2} alignItems="center">
                            <Grid size={{ xs: 12, md: 5 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Producto</InputLabel>
                                    <Select label="Producto" name="id_producto_fk" value={newDetail.id_producto_fk} onChange={handleNewDetailChange} required>
                                        {productos.map(p => <MenuItem key={p.id_producto} value={p.id_producto.toString()}>{p.nombre_producto}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, md: 3 }}>
                                <TextField label="Cantidad Contada" type="number" name="cantidad" value={newDetail.cantidad} onChange={handleNewDetailChange} required fullWidth size="small" InputProps={{ inputProps: { min: 0 } }}/>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField label="Notas (opcional)" name="notas" value={newDetail.notas} onChange={handleNewDetailChange} fullWidth size="small"/>
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ mt: 1 }}>
                                    {isSubmitting ? 'Guardando...' : 'Añadir/Actualizar Detalle'}
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                </Paper>
            )}

            <Box sx={{ mt: 3, p: 2, border: '1px dashed grey', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>Acciones del Conteo General</Typography>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {puedeProcesar && (conteo.estado_conteo === 'Iniciado' || conteo.estado_conteo === 'En Progreso') && (
                        <Button onClick={handleFinalizar} variant="contained" color="info" disabled={isSubmitting}>Finalizar Conteo</Button>
                    )}
                    {puedeProcesar && conteo.estado_conteo === 'Registrado' && (
                        <Button onClick={handleAplicarAjustes} variant="contained" color="success" disabled={isSubmitting}>Aplicar Ajustes al Stock</Button>
                    )}
                    {conteo.estado_conteo === 'Ajustes Aplicados' && (
                        <Typography sx={{ display: 'flex', alignItems: 'center', color: 'success.main' }}><CheckCircleIcon sx={{ mr: 1 }}/> Ajustes aplicados.</Typography>
                    )}
                </Box>
            </Box>

            {/* CORRECIÓN: Se usa 'Link' de react-router-dom y se coloca el botón dentro del 'Paper' principal. */}
            <Button component={Link} to="/conteos" startIcon={<ArrowBackIcon />} sx={{ mt: 3 }}>
                Volver a la lista de conteos
            </Button>
        </Paper>
    );
};

export default ConteoDetailPage;
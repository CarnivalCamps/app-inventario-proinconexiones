// client-web/src/pages/SolicitudesPage/CreateSolicitudPage.tsx
import React, { useState, useEffect} from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { createSolicitud } from '../../services/solicitudService';
import type { CreateSolicitudPayload, DetalleSolicitudInput } from '../../services/solicitudService';
import { getProductos } from '../../services/productService';
import type { ProductoFrontend } from '../../services/productService';
import { getUnidadesMedida } from '../../services/unidadMedidaService';
import type { UnidadMedidaFrontend } from '../../services/productService';
// import './CreateSolicitudPage.css';

// Imports de MUI
import {
    Paper, Box, Typography, Grid, TextField, Button, Select, MenuItem,
    InputLabel, FormControl, CircularProgress, Alert, Divider, IconButton,
    Tooltip, Chip,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';

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
    const [detalles, setDetalles] = useState<Partial<DetalleSolicitudInput>[]>([{}]);

    const [productos, setProductos] = useState<ProductoFrontend[]>([]);
    const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedidaFrontend[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadDropdownData = async () => {
            try {
                const [prodsData, umsData] = await Promise.all([getProductos(), getUnidadesMedida()]);
                setProductos(prodsData);
                setUnidadesMedida(umsData);
            } catch (err: any) {
                setError("Error cargando datos para el formulario.");
            } finally {
                setPageLoading(false);
            }
        };
        loadDropdownData();
    }, []);

    // CORRECCIÓN: Ajustamos el tipo del evento para que acepte tanto Input como TextArea
    const handleDetalleChange = (index: number, e: SelectChangeEvent<number> | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const newDetalles = [...detalles];
        const detalle = { ...newDetalles[index] };
        (detalle as any)[name] = value;
        newDetalles[index] = detalle;
        setDetalles(newDetalles);
    };

    const addDetalle = () => {
        setDetalles([...detalles, {}]);
    };

    const removeDetalle = (index: number) => {
        if (detalles.length > 1) {
            setDetalles(detalles.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        if (!proposito.trim()) {
            setError("El propósito de la solicitud es requerido.");
            return;
        }
        if (detalles.some(d => !d.id_producto_fk || !d.id_unidad_medida_solicitada_fk || !d.cantidad_solicitada || d.cantidad_solicitada <= 0)) {
            setError("Todos los detalles deben tener producto, unidad de medida y cantidad válida (>0) seleccionados.");
            return;
        }
        setIsLoading(true);
        try {
            const payload: CreateSolicitudPayload = {
                proposito_solicitud: proposito,
                fecha_requerida_entrega: fechaRequerida || null,
                justificacion_detallada: justificacion || null,
                detalles: detalles as DetalleSolicitudInput[],
            };
            const nuevaSolicitud = await createSolicitud(payload);
            alert(`Solicitud #${nuevaSolicitud.id_solicitud} creada exitosamente.`);
            navigate('/solicitudes');
        } catch (err: any) {
            setError(err.message || "Ocurrió un error al crear la solicitud.");
        } finally {
            setIsLoading(false);
        }
    };

    if (pageLoading) return <CircularProgress />;

    return (
        <Paper elevation={3} sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Button component={RouterLink} to="/solicitudes" sx={{ minWidth: 'auto', mr: 2 }} aria-label="Volver a la lista">
                    <ArrowBackIcon />
                </Button>
                <Typography variant="h4" component="h1">Crear Nueva Solicitud de Reserva</Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Box component="form" onSubmit={handleSubmit} noValidate>
                <Typography variant="h6" gutterBottom>Información General</Typography>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 8 }}><TextField label="Propósito de la Solicitud" value={proposito} onChange={(e) => setProposito(e.target.value)} required fullWidth /></Grid>
                    <Grid size={{ xs: 12, md: 4 }}><TextField label="Fecha Requerida de Entrega" type="date" value={fechaRequerida} onChange={(e) => setFechaRequerida(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid size={{ xs: 12 }}><TextField label="Justificación Detallada (Opcional)" value={justificacion} onChange={(e) => setJustificacion(e.target.value)} multiline rows={2} fullWidth /></Grid>
                </Grid>

                <Divider sx={{ my: 3 }}><Chip label="Productos Solicitados" /></Divider>

                {detalles.map((detalle, index) => (
                    <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid size={{ xs: 12, md: 5 }}>
                                <FormControl fullWidth required>
                                    <InputLabel id={`producto-label-${index}`}>Producto</InputLabel>
                                    <Select labelId={`producto-label-${index}`} label="Producto" name="id_producto_fk" value={detalle.id_producto_fk || ''} onChange={(e) => handleDetalleChange(index, e)}>
                                        {productos.map(p => <MenuItem key={p.id_producto} value={p.id_producto}>{p.nombre_producto} (Stock: {p.stock_actual})</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 6, md: 2 }}>
                                <TextField label="Cantidad" type="number" name="cantidad_solicitada" value={detalle.cantidad_solicitada || ''} onChange={(e) => handleDetalleChange(index, e)} required fullWidth InputProps={{ inputProps: { min: 1 } }} />
                            </Grid>
                            <Grid size={{ xs: 6, md: 4 }}>
                                <FormControl fullWidth required>
                                    <InputLabel id={`unidad-label-${index}`}>Unidad</InputLabel>
                                    <Select labelId={`unidad-label-${index}`} label="Unidad" name="id_unidad_medida_solicitada_fk" value={detalle.id_unidad_medida_solicitada_fk || ''} onChange={(e) => handleDetalleChange(index, e)}>
                                        {unidadesMedida.map(u => <MenuItem key={u.id_unidad_medida} value={u.id_unidad_medida}>{u.nombre_unidad}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, md: 1 }} sx={{ textAlign: { xs: 'right', md: 'center' } }}>
                                {detalles.length > 1 &&
                                    <Tooltip title="Eliminar Producto">
                                        <IconButton onClick={() => removeDetalle(index)} color="error">
                                            <DeleteIcon />
                                        </IconButton>
                                    </Tooltip>
                                }
                            </Grid>
                        </Grid>
                    </Paper>
                ))}

                <Button variant="outlined" startIcon={<AddCircleOutlineIcon />} onClick={addDetalle} sx={{ mt: 1 }}>
                    Añadir Otro Producto
                </Button>

                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                    <Button type="submit" variant="contained" disabled={isLoading}>
                        {isLoading ? <CircularProgress size={24} /> : 'Crear Solicitud'}
                    </Button>
                    <Button variant="text" component={RouterLink} to="/solicitudes" disabled={isLoading}>Cancelar</Button>
                </Box>
            </Box>
        </Paper>
    );
};

export default CreateSolicitudPage;
// client-web/src/pages/OrdenesCompraPage/CreateOrdenCompraPage.tsx
import React, { useState, useEffect } from 'react';
import type {FormEvent} from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { createOrdenCompra } from '../../services/ordenCompraService';
import type { CreateOrdenCompraPayload, DetalleOrdenInput } from '../../services/ordenCompraService';
import {getProductos } from '../../services/productService';
import type { ProductoFrontend } from '../../services/productService';
import { getProveedores } from '../../services/proveedorService';
import type { ProveedorFrontend } from '../../services/proveedorService';

// Imports de MUI
import {
    Paper, Box, Typography, Grid, TextField, Button, Select, MenuItem,
    InputLabel, FormControl, CircularProgress, Alert, Divider, IconButton, Tooltip, Chip
} from '@mui/material';

import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const CreateOrdenCompraPage: React.FC = () => {
    const navigate = useNavigate();
    // Estado para la cabecera
    const [idProveedor, setIdProveedor] = useState('');
    const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split('T')[0]); // Fecha de hoy por defecto
    const [fechaEntrega, setFechaEntrega] = useState('');
    const [notas, setNotas] = useState('');
    // Estado para los detalles
    const [detalles, setDetalles] = useState<Partial<DetalleOrdenInput>[]>([{}]);

    // Datos para los dropdowns
    const [proveedores, setProveedores] = useState<ProveedorFrontend[]>([]);
    const [productos, setProductos] = useState<ProductoFrontend[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [provsData, prodsData] = await Promise.all([getProveedores(), getProductos()]);
                setProveedores(provsData);
                setProductos(prodsData);
            } catch (err: any) { setError("Error cargando datos (proveedores/productos)."); }
            finally { setPageLoading(false); }
        };
        loadData();
    }, []);

    const handleDetalleChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const newDetalles = [...detalles];
        (newDetalles[index] as any)[name] = value;
        setDetalles(newDetalles);
    };

    const handleSelectChange = (index: number, fieldName: string, value: unknown) => {
        const newDetalles = [...detalles];
        (newDetalles[index] as any)[fieldName] = value;
        setDetalles(newDetalles);
    };

    const addDetalle = () => setDetalles([...detalles, {}]);
    const removeDetalle = (index: number) => {
        if (detalles.length > 1) setDetalles(detalles.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        if (!idProveedor || !fechaEmision || detalles.some(d => !d.id_producto_fk || !d.cantidad_solicitada || !d.costo_unitario)) {
            setError("Proveedor, fecha de emisión y todos los campos de los detalles son requeridos.");
            return;
        }

        setIsLoading(true);
        const payload: CreateOrdenCompraPayload = {
            id_proveedor_fk: Number(idProveedor),
            fecha_emision: fechaEmision,
            fecha_entrega_esperada: fechaEntrega || null,
            notas: notas || null,
            detalles: detalles.map(d => ({
                id_producto_fk: Number(d.id_producto_fk),
                cantidad_solicitada: Number(d.cantidad_solicitada),
                costo_unitario: Number(d.costo_unitario),
            }))
        };

        try {
            const nuevaOrden = await createOrdenCompra(payload);
            alert(`Orden de Compra #${nuevaOrden.id_orden_compra} creada exitosamente.`);
            navigate('/ordenes-compra');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (pageLoading) return <CircularProgress />;

    return (
        <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Button component={RouterLink} to="/ordenes-compra" sx={{ minWidth: 'auto', mr: 2 }}>
                    <ArrowBackIcon />
                </Button>
                <Typography variant="h4" component="h1">
                    Crear Nueva Orden de Compra
                </Typography>
            </Box>
            
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            <Box component="form" onSubmit={handleSubmit} noValidate>
                <Typography variant="h6" gutterBottom>
                    Información General
                </Typography>
                
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth required>
                            <InputLabel>Proveedor</InputLabel>
                            <Select 
                                label="Proveedor" 
                                value={idProveedor} 
                                onChange={(e) => setIdProveedor(e.target.value as string)}
                            >
                                {proveedores.map(p => (
                                    <MenuItem key={p.id_proveedor} value={p.id_proveedor.toString()}>
                                        {p.nombre_proveedor}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    
                    <Grid size={{ xs: 12, md: 3 }}>
                        <TextField 
                            label="Fecha de Emisión" 
                            type="date" 
                            value={fechaEmision} 
                            onChange={(e) => setFechaEmision(e.target.value)} 
                            required 
                            fullWidth 
                            InputLabelProps={{ shrink: true }} 
                        />
                    </Grid>
                    
                    <Grid size={{ xs: 12, md: 3 }}>
                        <TextField 
                            label="Fecha Entrega Esperada" 
                            type="date" 
                            value={fechaEntrega} 
                            onChange={(e) => setFechaEntrega(e.target.value)} 
                            fullWidth 
                            InputLabelProps={{ shrink: true }} 
                        />
                    </Grid>
                </Grid>
                
                <Divider sx={{ my: 3 }}>
                    <Chip label="Productos a Solicitar" />
                </Divider>
                
                {detalles.map((detalle, index) => (
                    <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2, position: 'relative' }}>
                        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                            <Grid size={{ xs: 12, md: 5 }}>
                                <FormControl fullWidth required>
                                    <InputLabel>Producto</InputLabel>
                                    <Select 
                                        label="Producto" 
                                        name="id_producto_fk" 
                                        value={detalle.id_producto_fk || ''} 
                                        onChange={(e) => handleSelectChange(index, 'id_producto_fk', e.target.value)}
                                    >
                                        {productos.map(p => (
                                            <MenuItem key={p.id_producto} value={p.id_producto}>
                                                {p.nombre_producto} ({p.sku})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            
                            <Grid size={{ xs: 6, md: 3 }}>
                                <TextField 
                                    label="Cantidad" 
                                    type="number" 
                                    name="cantidad_solicitada" 
                                    value={detalle.cantidad_solicitada || ''} 
                                    onChange={(e) => handleDetalleChange(index, e)} 
                                    required 
                                    fullWidth 
                                    InputProps={{ inputProps: { min: 1 } }} 
                                />
                            </Grid>
                            
                            <Grid size={{ xs: 6, md: 3 }}>
                                <TextField 
                                    label="Costo Unitario" 
                                    type="number" 
                                    name="costo_unitario" 
                                    value={detalle.costo_unitario || ''} 
                                    onChange={(e) => handleDetalleChange(index, e)} 
                                    required 
                                    fullWidth 
                                    InputProps={{ inputProps: { min: 0, step: "0.01" } }} 
                                />
                            </Grid>
                            
                            <Grid size={{ xs: 12, md: 1 }} sx={{ textAlign: 'right' }}>
                                {detalles.length > 1 && (
                                    <Tooltip title="Eliminar Producto">
                                        <IconButton onClick={() => removeDetalle(index)} color="error">
                                            <DeleteIcon />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </Grid>
                        </Grid>
                    </Paper>
                ))}
                
                <Button 
                    variant="outlined" 
                    startIcon={<AddCircleOutlineIcon />} 
                    onClick={addDetalle} 
                    sx={{ mt: 1 }}
                >
                    Añadir Producto
                </Button>
                
                <Divider sx={{ my: 3 }} />
                
                <TextField 
                    label="Notas (opcional)" 
                    name="notas" 
                    value={notas} 
                    onChange={(e) => setNotas(e.target.value)} 
                    multiline 
                    rows={3} 
                    fullWidth 
                />
                
                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                    <Button type="submit" variant="contained" disabled={isLoading}>
                        {isLoading ? <CircularProgress size={24} /> : 'Crear Orden de Compra'}
                    </Button>
                    <Button variant="text" component={RouterLink} to="/ordenes-compra">
                        Cancelar
                    </Button>
                </Box>
            </Box>
        </Paper>
    );
};

export default CreateOrdenCompraPage;
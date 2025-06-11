// client-web/src/pages/HistorialMovimientosPage/HistorialMovimientosPage.tsx
import React, { useState, useEffect } from 'react';
import { getMovimientos } from '../../services/movimientoService';
import type { MovimientoInventarioFrontend } from '../../services/movimientoService';
import { getProductos} from '../../services/productService';
import type { ProductoFrontend } from '../../services/productService';
// import './HistorialMovimientosPage.css';

// Imports de MUI
import {
    Button, Typography, Paper, CircularProgress, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';

const HistorialMovimientosPage: React.FC = () => {
    const [movimientos, setMovimientos] = useState<MovimientoInventarioFrontend[]>([]);
    const [productos, setProductos] = useState<ProductoFrontend[]>([]); // Para el filtro
    const [filtroProductoId, setFiltroProductoId] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMovimientos = async (productId?: number) => {
        try {
            setIsLoading(true);
            setError(null);
            const params = productId ? { id_producto_fk: productId } : {};
            const data = await getMovimientos(params);
            setMovimientos(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const prodsData = await getProductos();
                setProductos(prodsData);
                await fetchMovimientos(); // Cargar todos los movimientos inicialmente
            } catch (err: any) {
                setError(err.message || "Error al cargar datos iniciales.");
                setIsLoading(false);
            }
        };

        loadInitialData();
    }, []);

    const handleFilterChange = (event: SelectChangeEvent<string>) => {
        setFiltroProductoId(event.target.value as string);
    };

    const handleApplyFilter = () => {
        const numericId = filtroProductoId ? parseInt(filtroProductoId, 10) : undefined;
        fetchMovimientos(numericId);
    };

    const clearFilter = () => {
        setFiltroProductoId('');
        fetchMovimientos(); // Vuelve a cargar todos
    };

    return (
        <Paper elevation={3} sx={{ padding: '24px' }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Historial de Movimientos de Inventario
            </Typography>

            {/* --- SECCIÓN DE FILTROS --- */}
            <Paper variant="outlined" sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <FormControl sx={{ minWidth: 240 }} size="small">
                    <InputLabel id="filtro-producto-label">Filtrar por Producto</InputLabel>
                    <Select
                        labelId="filtro-producto-label"
                        label="Filtrar por Producto"
                        value={filtroProductoId}
                        onChange={handleFilterChange}
                    >
                        <MenuItem value=""><em>-- Todos los Productos --</em></MenuItem>
                        {productos.map(p => (
                            <MenuItem key={p.id_producto} value={p.id_producto.toString()}>
                                {p.nombre_producto} ({p.sku})
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Button variant="contained" onClick={handleApplyFilter} startIcon={<FilterListIcon />}>Filtrar</Button>
                <Button variant="outlined" onClick={clearFilter}>Limpiar Filtro</Button>
            </Paper>

            {isLoading && <CircularProgress sx={{ display: 'block', margin: 'auto' }} />}
            {error && <Alert severity="error">{error}</Alert>}

            {/* --- TABLA DE HISTORIAL --- */}
            {!isLoading && (
                <TableContainer component={Paper} elevation={2}>
                    <Table stickyHeader>
                        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell>Fecha</TableCell>
                                <TableCell>Producto (SKU)</TableCell>
                                <TableCell>Tipo Movimiento</TableCell>
                                <TableCell align="right">Cantidad</TableCell>
                                <TableCell align="right">Stock Anterior</TableCell>
                                <TableCell align="right">Stock Nuevo</TableCell>
                                <TableCell>Usuario</TableCell>
                                <TableCell>Referencia</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {movimientos.length > 0 ? (
                                movimientos.map((mov) => (
                                    <tr key={mov.id_movimiento}>
                                        <td style={{border: '1px solid #ddd', padding: '8px'}}>{new Date(mov.fecha_movimiento).toLocaleString()}</td>
                                        <td style={{border: '1px solid #ddd', padding: '8px'}}>{mov.producto.nombre_producto} ({mov.producto.sku})</td>
                                        <td style={{border: '1px solid #ddd', padding: '8px'}}>{mov.tipo_movimiento.nombre_tipo}</td>
                                        <td style={{ fontWeight: 'bold', color: mov.tipo_movimiento.efecto_stock === 1 ? 'green' : 'red' }}>
                                            {mov.tipo_movimiento.efecto_stock === 1 ? '+' : '-'}
                                            {mov.cantidad_convertida_a_primaria} {mov.producto.unidad_medida_primaria.abreviatura}
                                        </td>
                                        <td style={{border: '1px solid #ddd', padding: '8px'}}>{mov.stock_anterior_primaria}</td>
                                        <td style={{border: '1px solid #ddd', padding: '8px'}}>{mov.stock_nuevo_primaria}</td>
                                        <td style={{border: '1px solid #ddd', padding: '8px'}}>{mov.usuario.nombre_usuario}</td>
                                        <td style={{border: '1px solid #ddd', padding: '8px'}}>{mov.referencia_documento || '-'}</td>
                                    </tr>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} align="center">No hay movimientos para mostrar con los filtros seleccionados.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Paper>
    );
};

export default HistorialMovimientosPage;
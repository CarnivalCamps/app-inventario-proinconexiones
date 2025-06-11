// client-web/src/pages/ProductsPage/ProductsPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProductos, deleteProducto} from '../../services/productService';
import type{ ProductoFrontend } from '../../services/productService';

// Imports de MUI
import {
    Box, Button, Typography, Paper, Tooltip, IconButton, CircularProgress, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';

const ProductsPage: React.FC = () => {
    const [productos, setProductos] = useState<ProductoFrontend[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    

    const fetchProductos = async () => {
        try {
            const data = await getProductos();
            setProductos(data);
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error desconocido.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProductos();
    }, []);

    const handleDelete = async (id: number, nombre: string) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar el producto "${nombre}"?`)) {
            try {
                setError(null);
                await deleteProducto(id);
                alert('Producto eliminado exitosamente.');
                // Recargar la lista de productos después de eliminar
                setLoading(true); // Mostrar feedback de carga
                await fetchProductos();
            } catch (err: any) {
                setError(err.message);
            }
        }
    };

    if (loading && productos.length === 0) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Paper elevation={3} sx={{ padding: '24px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" component="h1">
                    Gestión de Productos
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    component={Link}
                    to="/productos/nuevo"
                >
                    Nuevo Producto
                </Button>
            </Box>

            <TableContainer component={Paper} elevation={2}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell>SKU</TableCell>
                            <TableCell>Nombre</TableCell>
                            <TableCell align="right">Stock Actual</TableCell>
                            <TableCell>Categoría</TableCell>
                            <TableCell>Unidad Primaria</TableCell>
                            <TableCell align="center">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {productos.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">No hay productos para mostrar.</TableCell>
                            </TableRow>
                        ) : (
                            productos.map((producto) => (
                                <TableRow key={producto.id_producto} hover>
                                    <TableCell component="th" scope="row">
                                        {producto.sku}
                                    </TableCell>
                                    <TableCell>{producto.nombre_producto}</TableCell>
                                    <TableCell align="right">{producto.stock_actual}</TableCell>
                                    <TableCell>{producto.categoria?.nombre_categoria || 'N/A'}</TableCell>
                                    <TableCell>{producto.unidad_medida_primaria.abreviatura}</TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="Ver Detalles">
                                            <IconButton component={Link} to={`/productos/${producto.id_producto}`} color="default">
                                                <VisibilityIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Editar">
                                            <IconButton component={Link} to={`/productos/${producto.id_producto}/editar`} color="primary">
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Eliminar">
                                            <IconButton onClick={() => handleDelete(producto.id_producto, producto.nombre_producto)} color="error">
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
};

export default ProductsPage;
// client-web/src/pages/OrdenesCompraPage/OrdenesCompraListPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getOrdenesCompra} from '../../services/ordenCompraService';
import type { OrdenCompraFrontend } from '../../services/ordenCompraService';

// Imports de MUI
import {
    Box, Button, Typography, Paper, Tooltip, IconButton, CircularProgress, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';

const getStatusChipColor = (status: string) => {
    switch (status) {
        case 'Recibida Totalmente': return 'success';
        case 'Enviada': case 'Recibida Parcialmente': return 'info';
        case 'Borrador': return 'default';
        case 'Cancelada': return 'error';
        default: return 'secondary';
    }
};

const OrdenesCompraListPage: React.FC = () => {
    const [ordenes, setOrdenes] = useState<OrdenCompraFrontend[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrdenes = async () => {
            try {
                const data = await getOrdenesCompra();
                setOrdenes(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchOrdenes();
    }, []);

    if (isLoading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" component="h1">
                    Órdenes de Compra
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    component={Link}
                    to="/ordenes-compra/nueva" // Ruta que crearemos después
                >
                    Nueva Orden de Compra
                </Button>
            </Box>

            <TableContainer component={Paper} elevation={2}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Proveedor</TableCell>
                            <TableCell>Fecha Emisión</TableCell>
                            <TableCell>Total</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell align="center">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {ordenes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">No hay órdenes de compra para mostrar.</TableCell>
                            </TableRow>
                        ) : (
                            ordenes.map((oc) => (
                                <TableRow key={oc.id_orden_compra} hover>
                                    <TableCell>#{oc.id_orden_compra}</TableCell>
                                    <TableCell>{oc.proveedor.nombre_proveedor}</TableCell>
                                    <TableCell>{new Date(oc.fecha_emision).toLocaleDateString()}</TableCell>
                                    <TableCell align="right">{oc.total ? `$${Number(oc.total).toFixed(2)}` : '-'}</TableCell>
                                    <TableCell>
                                        <Chip label={oc.estado} color={getStatusChipColor(oc.estado)} size="small" />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="Ver Detalles">
                                            <IconButton component={Link} to={`/ordenes-compra/${oc.id_orden_compra}`} color="default">
                                                <VisibilityIcon />
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

export default OrdenesCompraListPage;
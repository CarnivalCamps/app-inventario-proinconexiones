// client-web/src/pages/SolicitudesPage/SolicitudesListPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSolicitudes} from '../../services/solicitudService';
import type { SolicitudReservaFrontend } from '../../services/solicitudService';

// Imports de MUI
import {
    Box, Button, Typography, Paper, Tooltip, IconButton, CircularProgress, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';

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

const SolicitudesListPage: React.FC = () => {
    const [solicitudes, setSolicitudes] = useState<SolicitudReservaFrontend[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSolicitudes = async () => {
            try {
                const data = await getSolicitudes();
                setSolicitudes(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSolicitudes();
    }, []);

    if (isLoading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Paper elevation={3} sx={{ padding: '24px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" component="h1">
                    Solicitudes de Reserva
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    component={Link}
                    to="/solicitudes/nueva"
                >
                    Nueva Solicitud
                </Button>
            </Box>

            <TableContainer component={Paper} elevation={2}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Fecha Solicitud</TableCell>
                            <TableCell>Propósito</TableCell>
                            <TableCell>Solicitante</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell align="center">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {solicitudes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">No hay solicitudes para mostrar.</TableCell>
                            </TableRow>
                        ) : (
                            solicitudes.map((sol) => (
                                <TableRow key={sol.id_solicitud} hover>
                                    <TableCell>#{sol.id_solicitud}</TableCell>
                                    <TableCell>{new Date(sol.fecha_solicitud).toLocaleDateString()}</TableCell>
                                    <TableCell>{sol.proposito_solicitud}</TableCell>
                                    <TableCell>{sol.vendedor?.nombre_usuario || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Chip label={sol.estado_solicitud} color={getStatusChipColor(sol.estado_solicitud)} size="small" />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="Ver Detalles">
                                            <IconButton component={Link} to={`/solicitudes/${sol.id_solicitud}`} color="default">
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

export default SolicitudesListPage;
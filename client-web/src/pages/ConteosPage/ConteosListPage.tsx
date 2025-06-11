// client-web/src/pages/ConteosPage/ConteosListPage.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getConteos, iniciarConteo } from '../../services/conteoService';
import type { ConteoFisicoFrontend } from '../../services/conteoService';

// Imports de MUI
import {
    Box, Button, Typography, Paper, Tooltip, IconButton, CircularProgress, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';

// Función de ayuda para dar color al estado del conteo
const getStatusChipColor = (status: string) => {
    switch (status) {
        case 'Ajustes Aplicados':
            return 'success';
        case 'Iniciado':
        case 'En Progreso':
            return 'warning';
        case 'Registrado':
            return 'info';
        case 'Cancelado':
            return 'error';
        default:
            return 'default';
    }
};


const ConteosListPage: React.FC = () => {
    const [conteos, setConteos] = useState<ConteoFisicoFrontend[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const fetchConteos = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await getConteos();
            setConteos(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    

    useEffect(() => {
        fetchConteos();
    }, []);

    const handleIniciarConteo = async () => {
        if (!window.confirm("¿Estás seguro de que deseas iniciar un nuevo conteo físico?")) return;

        setIsLoading(true);
        try {
            const nuevoConteo = await iniciarConteo({ descripcion_motivo_conteo: `Conteo iniciado el ${new Date().toLocaleString()}`});
            alert(`Conteo #${nuevoConteo.id_conteo} iniciado exitosamente.`);
            navigate(`/conteos/${nuevoConteo.id_conteo}`);
        } catch (err: any) {
            setError(err.message);
            setIsLoading(false); // Detener loading si hay error
        }
        // No ponemos setIsLoading(false) aquí en caso de éxito porque la navegación desmontará el componente
    };

    if (isLoading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Paper elevation={3} sx={{ padding: '24px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" component="h1">
                    Conteos Físicos de Inventario
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleIniciarConteo}
                    disabled={isLoading}
                >
                    {isLoading ? 'Iniciando...' : 'Iniciar Nuevo Conteo'}
                </Button>
            </Box>

            <TableContainer component={Paper} elevation={2}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell>ID Conteo</TableCell>
                            <TableCell>Fecha Inicio</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell>Responsable</TableCell>
                            <TableCell align="center">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {conteos.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center">No hay conteos para mostrar.</TableCell>
                            </TableRow>
                        ) : (
                            conteos.map((conteo) => (
                                <TableRow key={conteo.id_conteo} hover>
                                    <TableCell>#{conteo.id_conteo}</TableCell>
                                    <TableCell>{new Date(conteo.fecha_inicio_conteo).toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Chip label={conteo.estado_conteo} color={getStatusChipColor(conteo.estado_conteo)} size="small" />
                                    </TableCell>
                                    <TableCell>{conteo.usuario_responsable?.nombre_usuario || 'N/A'}</TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="Ver y Procesar Conteo">
                                            <IconButton component={Link} to={`/conteos/${conteo.id_conteo}`} color="default">
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

export default ConteosListPage;
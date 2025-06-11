// client-web/src/pages/UnidadesMedidaPage/UnidadesMedidaPage.tsx
import React, { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import {
    getUnidadesMedida,
    createUnidadMedida,
    updateUnidadMedida,
    deleteUnidadMedida,
} from '../../services/unidadMedidaService';
import type { UnidadMedidaFrontend, CreateUnidadMedidaPayload } from '../../services/unidadMedidaService';

// Imports de MUI
import {
    Box, Button, TextField, Typography, Paper, Collapse, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const UnidadesMedidaPage: React.FC = () => {
    const [unidades, setUnidades] = useState<UnidadMedidaFrontend[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [isFormVisible, setIsFormVisible] = useState<boolean>(false);
    const [editingUnidad, setEditingUnidad] = useState<UnidadMedidaFrontend | null>(null);
    const [formData, setFormData] = useState<CreateUnidadMedidaPayload>({ nombre_unidad: '', abreviatura: '' });

    const fetchUnidades = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await getUnidadesMedida();
            setUnidades(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUnidades();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!formData.nombre_unidad.trim() || !formData.abreviatura.trim()) {
            setError("El nombre y la abreviatura son requeridos.");
            return;
        }
        setError(null);
        setIsLoading(true);

        try {
            if (editingUnidad) {
                await updateUnidadMedida(editingUnidad.id_unidad_medida, formData);
                alert("Unidad de medida actualizada exitosamente!");
            } else {
                await createUnidadMedida(formData);
                alert("Unidad de medida creada exitosamente!");
            }
            setFormData({ nombre_unidad: '', abreviatura: '' });
            setEditingUnidad(null);
            setIsFormVisible(false);
            await fetchUnidades();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (unidad: UnidadMedidaFrontend) => {
        setEditingUnidad(unidad);
        setFormData({
            nombre_unidad: unidad.nombre_unidad,
            abreviatura: unidad.abreviatura
        });
        setIsFormVisible(true);
        setError(null);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm("¿Estás seguro de que deseas eliminar esta unidad de medida? Podría estar en uso.")) {
            try {
                setError(null);
                setIsLoading(true);
                await deleteUnidadMedida(id);
                alert("Unidad de medida eliminada exitosamente!");
                await fetchUnidades();
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const openCreateForm = () => {
        setEditingUnidad(null);
        setFormData({ nombre_unidad: '', abreviatura: '' });
        setIsFormVisible(true);
        setError(null);
    };

    const toggleForm = () => {
        if (isFormVisible) {
            setIsFormVisible(false);
            setEditingUnidad(null);
            setError(null);
        } else {
            openCreateForm();
        }
    };

    // Mostrar loading solo cuando no hay datos y está cargando
    if (isLoading && unidades.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                <CircularProgress />
            </Box>
        );
    }

    // Mostrar error solo si no hay datos y no está visible el formulario
    if (error && !isFormVisible && unidades.length === 0) {
        return <Alert severity="error">{error}</Alert>;
    }

    return (
        <Paper elevation={3} sx={{ padding: '24px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" component="h1">
                    Gestión de Unidades de Medida
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={toggleForm}
                >
                    {isFormVisible ? 'Ocultar Formulario' : 'Nueva Unidad de Medida'}
                </Button>
            </Box>

            <Collapse in={isFormVisible}>
                <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        {editingUnidad ? 'Editar Unidad de medida' : 'Crear Nueva Unidad de Medida'}
                    </Typography>
                    <Box component="form" onSubmit={handleFormSubmit} noValidate>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="nombre_unidad"
                            label="Nombre de la Unidad de Medida"
                            name="nombre_unidad"
                            value={formData.nombre_unidad}
                            onChange={handleInputChange}
                            autoFocus
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="abreviatura"
                            label="Abreviatura"
                            name="abreviatura"
                            value={formData.abreviatura}
                            onChange={handleInputChange}
                        />
                        
                        {error && isFormVisible && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                        
                        <Box sx={{ mt: 2 }}>
                            <Button type="submit" variant="contained" disabled={isLoading}>
                                {isLoading ? 'Guardando...' : (editingUnidad ? 'Actualizar Unidad' : 'Crear Unidad')}
                            </Button>
                            {editingUnidad && (
                                <Button 
                                    onClick={() => { 
                                        setIsFormVisible(false); 
                                        setEditingUnidad(null); 
                                        setError(null);
                                    }} 
                                    sx={{ ml: 1 }}
                                >
                                    Cancelar Edición
                                </Button>
                            )}
                        </Box>
                    </Box>
                </Paper>
            </Collapse>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Lista de Unidades Existentes
            </Typography>

            <TableContainer component={Paper} elevation={2}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Nombre</TableCell>
                            <TableCell>Abreviatura</TableCell>
                            <TableCell align="right">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {unidades.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    No hay unidades de medida para mostrar.
                                </TableCell>
                            </TableRow>
                        ) : (
                            unidades.map((unidad) => (
                                <TableRow key={unidad.id_unidad_medida} hover>
                                    <TableCell>{unidad.id_unidad_medida}</TableCell>
                                    <TableCell>{unidad.nombre_unidad}</TableCell>
                                    <TableCell>{unidad.abreviatura}</TableCell>
                                    <TableCell align="right">
                                        <IconButton 
                                            onClick={() => handleEdit(unidad)} 
                                            color="primary" 
                                            title="Editar"
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton 
                                            onClick={() => handleDelete(unidad.id_unidad_medida)} 
                                            color="error" 
                                            title="Eliminar"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
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

export default UnidadesMedidaPage;
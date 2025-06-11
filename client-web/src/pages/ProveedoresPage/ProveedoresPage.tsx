// client-web/src/pages/ProveedoresPage/ProveedoresPage.tsx
import React, { useState, useEffect} from 'react';
import type { FormEvent } from 'react';
import {
    getProveedores,
    createProveedor,
    updateProveedor,
    deleteProveedor,
} from '../../services/proveedorService';
import type { ProveedorFrontend, CreateProveedorPayload } from '../../services/proveedorService';

// Imports de MUI
import {
    Box, Button, TextField, Typography, Paper, Collapse, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const ProveedoresPage: React.FC = () => {
    const [proveedores, setProveedores] = useState<ProveedorFrontend[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [isFormVisible, setIsFormVisible] = useState<boolean>(false);
    const [editingProveedor, setEditingProveedor] = useState<ProveedorFrontend | null>(null);

    const initialFormState: CreateProveedorPayload = {
        nombre_proveedor: '',
        contacto_nombre: '',
        contacto_email: '',
        contacto_telefono: '',
        direccion: '',
        notas: ''
    };
    const [formData, setFormData] = useState<CreateProveedorPayload>(initialFormState);

    const fetchProveedores = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await getProveedores();
            setProveedores(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProveedores();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!formData.nombre_proveedor.trim()) {
            setError("El nombre del proveedor es requerido.");
            return;
        }
        setError(null);
        setIsLoading(true);

        try {
            const payloadToSend = { ...formData };
            // Convertir campos opcionales vacíos a null si es necesario para el backend
            for (const key in payloadToSend) {
                if (payloadToSend[key as keyof CreateProveedorPayload] === '') {
                    payloadToSend[key as keyof CreateProveedorPayload] == '';
                }
            }


            if (editingProveedor) {
                await updateProveedor(editingProveedor.id_proveedor, payloadToSend);
                alert("Proveedor actualizado exitosamente!");
            } else {
                await createProveedor(payloadToSend);
                alert("Proveedor creado exitosamente!");
            }
            setFormData(initialFormState);
            setEditingProveedor(null);
            setIsFormVisible(false);
            await fetchProveedores();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (proveedor: ProveedorFrontend) => {
        setEditingProveedor(proveedor);
        setFormData({
            nombre_proveedor: proveedor.nombre_proveedor,
            contacto_nombre: proveedor.contacto_nombre || '',
            contacto_email: proveedor.contacto_email || '',
            contacto_telefono: proveedor.contacto_telefono || '',
            direccion: proveedor.direccion || '',
            notas: proveedor.notas || ''
        });
        setIsFormVisible(true);
        setError(null);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm("¿Estás seguro de que deseas eliminar este proveedor? Verifique que no esté en uso.")) {
            try {
                setError(null);
                setIsLoading(true);
                await deleteProveedor(id);
                alert("Proveedor eliminado exitosamente!");
                await fetchProveedores();
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const openCreateForm = () => {
        setEditingProveedor(null);
        setFormData(initialFormState);
        setIsFormVisible(true);
        setError(null);
    };

    const toggleForm = () => {
        if (isFormVisible) {
            setIsFormVisible(false);
            setEditingProveedor(null);
            setError(null);
        } else {
            openCreateForm();
        }
    };

    // Mostrar loading solo cuando no hay datos y está cargando
    if (isLoading && proveedores.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                <CircularProgress />
            </Box>
        );
    }

    // Mostrar error solo si no hay datos y no está visible el formulario
    if (error && !isFormVisible && proveedores.length === 0) {
        return <Alert severity="error">{error}</Alert>;
    }

    return (
        <Paper elevation={3} sx={{ padding: '24px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" component="h1">
                    Gestión de Proveedores
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={toggleForm}
                >
                    {isFormVisible ? 'Ocultar Formulario' : 'Nuevo Proveedor'}
                </Button>
            </Box>

            <Collapse in={isFormVisible}>
                <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                    {editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                    </Typography>

                    <Box component="form" onSubmit={handleFormSubmit} noValidate>
                    <TextField
                        fullWidth
                        required
                        margin="normal"
                        id="nombre_proveedor"
                        label="Nombre del Proveedor"
                        name="nombre_proveedor"
                        value={formData.nombre_proveedor}
                        onChange={handleInputChange}
                    />

                    <TextField
                        fullWidth
                        margin="normal"
                        id="contacto_nombre"
                        label="Nombre del Contacto"
                        name="contacto_nombre"
                        value={formData.contacto_nombre || ''}
                        onChange={handleInputChange}
                    />

                    <TextField
                        fullWidth
                        margin="normal"
                        type="email"
                        id="contacto_email"
                        label="Email del Contacto"
                        name="contacto_email"
                        value={formData.contacto_email || ''}
                        onChange={handleInputChange}
                    />

                    <TextField
                        fullWidth
                        margin="normal"
                        id="contacto_telefono"
                        label="Teléfono del Contacto"
                        name="contacto_telefono"
                        value={formData.contacto_telefono || ''}
                        onChange={handleInputChange}
                    />

                    <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        margin="normal"
                        id="direccion"
                        label="Dirección"
                        name="direccion"
                        value={formData.direccion || ''}
                        onChange={handleInputChange}
                    />

                    <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        margin="normal"
                        id="notas"
                        label="Notas"
                        name="notas"
                        value={formData.notas || ''}
                        onChange={handleInputChange}
                    />

                    {error && isFormVisible && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                        </Alert>
                    )}

                    <Box sx={{ mt: 2 }}>
                        <Button type="submit" variant="contained" disabled={isLoading}>
                        {isLoading
                            ? 'Guardando...'
                            : editingProveedor
                            ? 'Actualizar Proveedor'
                            : 'Crear Proveedor'}
                        </Button>

                        {editingProveedor && (
                        <Button
                            onClick={() => {
                            setIsFormVisible(false);
                            setEditingProveedor(null);
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
                Lista de Proveedores Existentes
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
                        {proveedores.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    No hay proveedores para mostrar
                                </TableCell>
                            </TableRow>
                        ) : (
                            proveedores.map((unidad) => (
                                <TableRow key={unidad.id_proveedor} hover>
                                    <TableCell>{unidad.id_proveedor}</TableCell>
                                    <TableCell>{unidad.nombre_proveedor}</TableCell>
                                    <TableCell>{unidad.contacto_nombre}</TableCell>
                                    <TableCell>{unidad.contacto_email}</TableCell>
                                    <TableCell>{unidad.contacto_telefono}</TableCell>
                                    <TableCell align="right">
                                        <IconButton 
                                            onClick={() => handleEdit(unidad)} 
                                            color="primary" 
                                            title="Editar"
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton 
                                            onClick={() => handleDelete(unidad.id_proveedor)} 
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

export default ProveedoresPage;
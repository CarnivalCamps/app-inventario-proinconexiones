// client-web/src/pages/CategoriesPage/CategoriesPage.tsx
import React, { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import {
    getCategorias,
    createCategoria,
    updateCategoria,
    deleteCategoria,
    
} from '../../services/categoriaService';
import type { CategoriaFrontend, CreateCategoriaPayload } from '../../services/categoriaService';

// Imports de MUI
import {
    Box, Button, TextField, Typography, Paper, Collapse, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const CategoriesPage: React.FC = () => {
    const [categorias, setCategorias] = useState<CategoriaFrontend[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [isFormVisible, setIsFormVisible] = useState<boolean>(false);
    const [editingCategory, setEditingCategory] = useState<CategoriaFrontend | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const [formData, setFormData] = useState<CreateCategoriaPayload>({
        nombre_categoria: '',
        descripcion_categoria: ''
    });

    const fetchCategorias = async () => {
        try {
            // No mostrar loading en recargas para una mejor UX
            if (categorias.length === 0) setIsLoading(true);
            setError(null);
            const data = await getCategorias();
            setCategorias(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCategorias();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!formData.nombre_categoria.trim()) {
            setError("El nombre de la categoría es requerido.");
            return;
        }
        setError(null);
        setIsSubmitting(true);

        try {
            if (editingCategory) {
                await updateCategoria(editingCategory.id_categoria, formData);
                alert("Categoría actualizada exitosamente!");
            } else {
                await createCategoria(formData);
                alert("Categoría creada exitosamente!");
            }
            setFormData({ nombre_categoria: '', descripcion_categoria: '' });
            setEditingCategory(null);
            setIsFormVisible(false);
            await fetchCategorias();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (categoria: CategoriaFrontend) => {
        setEditingCategory(categoria);
        setFormData({ 
            nombre_categoria: categoria.nombre_categoria, 
            descripcion_categoria: categoria.descripcion_categoria || '' 
        });
        setIsFormVisible(true);
        setError(null);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm("¿Estás seguro de que deseas eliminar esta categoría?")) {
            try {
                setError(null);
                await deleteCategoria(id);
                alert("Categoría eliminada exitosamente!");
                await fetchCategorias();
            } catch (err: any) {
                setError(err.message);
            }
        }
    };

    const openCreateForm = () => {
        setEditingCategory(null);
        setFormData({ nombre_categoria: '', descripcion_categoria: '' });
        setIsFormVisible(!isFormVisible); // Alternar visibilidad
        setError(null);
    };

    if (isLoading) return <CircularProgress />;
    if (error && categorias.length === 0) return <Alert severity="error">{error}</Alert>;

    return (
        <Paper elevation={3} sx={{ padding: '24px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" component="h1">
                    Gestión de Categorías
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={openCreateForm}
                >
                    {isFormVisible && !editingCategory ? 'Ocultar Formulario' : 'Nueva Categoría'}
                </Button>
            </Box>

            <Collapse in={isFormVisible}>
                <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        {editingCategory ? 'Editar Categoría' : 'Crear Nueva Categoría'}
                    </Typography>
                    <Box component="form" onSubmit={handleFormSubmit} noValidate>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="nombre_categoria"
                            label="Nombre de la Categoría"
                            name="nombre_categoria"
                            value={formData.nombre_categoria}
                            onChange={handleInputChange}
                            autoFocus
                        />
                        <TextField
                            margin="normal"
                            fullWidth
                            multiline
                            rows={3}
                            id="descripcion_categoria"
                            label="Descripción (Opcional)"
                            name="descripcion_categoria"
                            value={formData.descripcion_categoria || ''}
                            onChange={handleInputChange}
                        />
                        {error && isFormVisible && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                        <Box sx={{ mt: 2 }}>
                            <Button type="submit" variant="contained" disabled={isSubmitting}>
                                {isSubmitting ? 'Guardando...' : (editingCategory ? 'Actualizar' : 'Crear')}
                            </Button>
                            {editingCategory && (
                                <Button onClick={() => { setIsFormVisible(false); setEditingCategory(null); }} sx={{ ml: 1 }}>
                                    Cancelar
                                </Button>
                            )}
                        </Box>
                    </Box>
                </Paper>
            </Collapse>

            <TableContainer component={Paper} elevation={2}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Nombre</TableCell>
                            <TableCell>Descripción</TableCell>
                            <TableCell align="right">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {categorias.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center">No hay categorías para mostrar.</TableCell>
                            </TableRow>
                        ) : (
                            categorias.map((cat) => (
                                <TableRow key={cat.id_categoria} hover>
                                    <TableCell>{cat.id_categoria}</TableCell>
                                    <TableCell>{cat.nombre_categoria}</TableCell>
                                    <TableCell>{cat.descripcion_categoria || '-'}</TableCell>
                                    <TableCell align="right">
                                        <IconButton onClick={() => handleEdit(cat)} color="primary" title="Editar">
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton onClick={() => handleDelete(cat.id_categoria)} color="error" title="Eliminar">
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

export default CategoriesPage;
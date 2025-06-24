// client-web/src/pages/UbicacionesPage/UbicacionesPage.tsx
import React, { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { 
    getUbicacionesTree, 
    createUbicacion, 
    updateUbicacion, 
    deleteUbicacion, 
} from '../../services/ubicacionService';
import type { UbicacionFrontend, CreateUbicacionPayload, UbicacionConStock } from '../../services/ubicacionService';
import { getUbicacionesConStock } from '../../services/ubicacionService'; // Importar la nueva función
import MapaAlmacen from '../../components/MapaAlmacen/MapaAlmacen';

// Imports de MUI
import { 
    Paper, 
    Box, 
    Typography, 
    Button, 
    TextField, 
    CircularProgress, 
    Alert, 
    List, 
    ListItem, 
    ListItemText, 
    IconButton, 
    Collapse, 
    Tooltip, 
    Divider, 
    Grid,
    Card,
    CardContent,
    CardHeader
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ChevronRight from '@mui/icons-material/ChevronRight';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MapIcon from '@mui/icons-material/Map';

// Componente recursivo para renderizar el árbol de ubicaciones
const UbicacionItem: React.FC<{ 
    ubicacion: UbicacionFrontend; 
    level: number; 
    onAdd: (padre: UbicacionFrontend) => void;
    onEdit: (ubicacion: UbicacionFrontend) => void;
    onDelete: (id: number, nombre: string) => void;
}> = ({ ubicacion, level, onAdd, onEdit, onDelete }) => {
    const [open, setOpen] = useState(true);
    
    return (
        <>
            <ListItem 
                sx={{ 
                    pl: level * 2, 
                    borderLeft: level > 0 ? '1px solid #eee' : 'none', 
                    ml: level > 0 ? 2 : 0 
                }}
                secondaryAction={
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Añadir Sub-ubicación">
                            <IconButton 
                                size="small" 
                                onClick={() => onAdd(ubicacion)}
                            >
                                <AddIcon fontSize="inherit"/>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                            <IconButton 
                                size="small" 
                                onClick={() => onEdit(ubicacion)}
                            >
                                <EditIcon fontSize="inherit"/>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                            <IconButton 
                                size="small" 
                                onClick={() => onDelete(ubicacion.id_ubicacion, ubicacion.nombre)}
                            >
                                <DeleteIcon fontSize="inherit" color="error"/>
                            </IconButton>
                        </Tooltip>
                    </Box>
                }
            >
                <IconButton 
                    size="small" 
                    onClick={() => setOpen(!open)} 
                    disabled={!ubicacion.hijos || ubicacion.hijos.length === 0} 
                    sx={{ mr: 1 }}
                >
                    {ubicacion.hijos && ubicacion.hijos.length > 0 ? 
                        (open ? <ExpandMore /> : <ChevronRight />) : 
                        <span style={{width: '24px'}} />
                    }
                </IconButton>
                <ListItemText 
                    primary={ubicacion.nombre} 
                    secondary={
                        <Box component="span">
                            <Typography component="span" variant="caption" display="block">
                                Tipo: {ubicacion.tipo || 'N/A'} | Código: {ubicacion.codigo_legible || 'N/A'}
                            </Typography>
                            {(ubicacion.pos_x !== null && ubicacion.pos_y !== null) && (
                                <Typography component="span" variant="caption" color="primary" display="block">
                                    📍 Posición: ({ubicacion.pos_x}, {ubicacion.pos_y})
                                    {ubicacion.width && ubicacion.height && 
                                        ` | Tamaño: ${ubicacion.width}x${ubicacion.height}`
                                    }
                                </Typography>
                            )}
                        </Box>
                    }
                />
            </ListItem>
            <Collapse in={open} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                    {ubicacion.hijos?.map(hijo => (
                        <UbicacionItem 
                            key={hijo.id_ubicacion} 
                            ubicacion={hijo} 
                            level={level + 1} 
                            onAdd={onAdd} 
                            onEdit={onEdit} 
                            onDelete={onDelete} 
                        />
                    ))}
                </List>
            </Collapse>
        </>
    );
};

const UbicacionesPage: React.FC = () => {
    const [ubicaciones, setUbicaciones] = useState<UbicacionFrontend[]>([]);
    const [ubicacionesConStockData, setUbicacionesConStockData] = useState<UbicacionConStock[]>([]); // Nuevo estado
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [editingUbicacion, setEditingUbicacion] = useState<UbicacionFrontend | null>(null);
    const [formData, setFormData] = useState<Partial<CreateUbicacionPayload>>({});

    const fetchUbicaciones = async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            const dataConStock = await getUbicacionesConStock();
            
            // 🔍 DEBUG: Ver qué datos llegan del backend
            console.log("=== DEBUG FETCH ===");
            console.log("Datos recibidos del backend:", dataConStock);
            console.log("Primera ubicación como ejemplo:", dataConStock[0]);
            if (dataConStock.length > 0) {
                const primerUbicacion = dataConStock[0];
                console.log("Campos de coordenadas en primera ubicación:");
                console.log("- pos_x:", primerUbicacion.pos_x, typeof primerUbicacion.pos_x);
                console.log("- pos_y:", primerUbicacion.pos_y, typeof primerUbicacion.pos_y);
                console.log("- width:", primerUbicacion.width, typeof primerUbicacion.width);
                console.log("- height:", primerUbicacion.height, typeof primerUbicacion.height);
            }
            console.log("==================");
            
            setUbicacionesConStockData(dataConStock);
            setUbicaciones(dataConStock); 
        } catch (err: any) { 
            console.error('Error fetching ubicaciones:', err);
            setError(err.message || 'Error al cargar las ubicaciones'); 
        } finally { 
            setIsLoading(false); 
        }
    };

    useEffect(() => { 
        fetchUbicaciones(); 
    }, []);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        let processedValue: string | number | null = value;

        // Convertir campos numéricos
        if (type === 'number') {
            processedValue = (value === '' || value === null) ? null : Number(value);
        }

        setFormData(prev => ({...prev, [name]: processedValue}));
    };

    const handleEditClick = (ubicacion: UbicacionFrontend) => {
        setEditingUbicacion(ubicacion);
        setFormData({
            nombre: ubicacion.nombre,
            tipo: ubicacion.tipo,
            descripcion: ubicacion.descripcion,
            codigo_legible: ubicacion.codigo_legible,
            capacidad: ubicacion.capacidad,
            id_ubicacion_padre_fk: ubicacion.padre?.id_ubicacion,
            // Campos del mapa
            pos_x: ubicacion.pos_x,
            pos_y: ubicacion.pos_y,
            width: ubicacion.width,
            height: ubicacion.height
        });
    };

    const handleAddClick = (padre: UbicacionFrontend | null) => {
        setEditingUbicacion(null);
        setFormData({ 
            id_ubicacion_padre_fk: padre?.id_ubicacion,
            // Valores por defecto para el mapa
            pos_x: null,
            pos_y: null,
            width: null,
            height: null
        });
    };

    const clearForm = () => {
        setEditingUbicacion(null);
        setFormData({});
    };

    const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if(!formData.nombre?.trim()) {
            setError("El nombre de la ubicación es requerido");
            return;
        }

        // Validación de campos del mapa
        const hasMapData = (formData.pos_x !== null && formData.pos_x !== undefined) || 
                        (formData.pos_y !== null && formData.pos_y !== undefined) || 
                        (formData.width !== null && formData.width !== undefined) || 
                        (formData.height !== null && formData.height !== undefined);
        
        if (hasMapData) {
            if ((formData.pos_x === null || formData.pos_x === undefined) || 
                (formData.pos_y === null || formData.pos_y === undefined)) {
                setError("Si defines datos del mapa, debes especificar al menos la posición X e Y");
                return;
            }
            if (formData.width !== null && formData.width !== undefined && formData.width <= 0) {
                setError("El ancho debe ser mayor a 0");
                return;
            }
            if (formData.height !== null && formData.height !== undefined && formData.height <= 0) {
                setError("El alto debe ser mayor a 0");
                return;
            }
        }

        setIsSubmitting(true);
        setError(null);
        
        try {
            const payload: CreateUbicacionPayload = {
                ...formData,
                nombre: formData.nombre!,
                capacidad: formData.capacidad ? Number(formData.capacidad) : null,
                pos_x: (formData.pos_x !== null && formData.pos_x !== undefined) ? Number(formData.pos_x) : null,
                pos_y: (formData.pos_y !== null && formData.pos_y !== undefined) ? Number(formData.pos_y) : null,
                width: (formData.width !== null && formData.width !== undefined) ? Number(formData.width) : null,
                height: (formData.height !== null && formData.height !== undefined) ? Number(formData.height) : null,
            };

            // 🔍 DEBUG: Agrega estos logs para ver qué se está enviando
            console.log("=== DEBUG PAYLOAD ===");
            console.log("FormData original:", formData);
            console.log("Payload procesado:", payload);
            console.log("Tipo de datos:");
            console.log("- pos_x:", typeof payload.pos_x, payload.pos_x);
            console.log("- pos_y:", typeof payload.pos_y, payload.pos_y);
            console.log("- width:", typeof payload.width, payload.width);
            console.log("- height:", typeof payload.height, payload.height);
            console.log("====================");

            let response;
            if (editingUbicacion) {
                console.log("Actualizando ubicación ID:", editingUbicacion.id_ubicacion);
                response = await updateUbicacion(editingUbicacion.id_ubicacion, payload);
            } else {
                console.log("Creando nueva ubicación");
                response = await createUbicacion(payload);
            }
            
            // 🔍 DEBUG: Log de la respuesta del servidor
            console.log("Respuesta del servidor:", response);
            
            alert(editingUbicacion ? "Ubicación actualizada exitosamente" : "Ubicación creada exitosamente");
            
            clearForm();
            await fetchUbicaciones();
        } catch (err: any) { 
            console.error('Error saving ubicacion:', err);
            // 🔍 DEBUG: Información detallada del error
            console.log("Error completo:", err);
            console.log("Error response:", err.response?.data);
            console.log("Error status:", err.response?.status);
            setError(err.message || 'Error al guardar la ubicación'); 
        } finally { 
            setIsSubmitting(false); 
        }
    };

    const handleDelete = async (id: number, nombre: string) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar la ubicación "${nombre}"? Se eliminarán todas sus sub-ubicaciones.`)) {
            try {
                setError(null);
                await deleteUbicacion(id);
                alert("Ubicación eliminada exitosamente.");
                await fetchUbicaciones();
            } catch (err: any) { 
                console.error('Error deleting ubicacion:', err);
                setError(err.message || 'Error al eliminar la ubicación'); 
            }
        }
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
                <Typography variant="body1" sx={{ ml: 2 }}>
                    Cargando ubicaciones...
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Panel principal de gestión */}
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Gestión de Ubicaciones
                </Typography>
                
                {error && <Alert severity="error" sx={{mb: 2}}>{error}</Alert>}
                
                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Typography variant="h6">
                            {editingUbicacion ? 
                                `Editando: ${editingUbicacion.nombre}` : 
                                'Crear Nueva Ubicación'
                            }
                        </Typography>
                        
                        <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                            <Box component="form" onSubmit={handleFormSubmit} noValidate>
                                {editingUbicacion ? (
                                    <Alert severity="info" sx={{mb: 2}}>
                                        Estás editando: <strong>{editingUbicacion.nombre}</strong>
                                    </Alert>
                                ) : formData.id_ubicacion_padre_fk ? (
                                    <Alert severity="info" sx={{mb: 2}}>
                                        Creando sub-ubicación.
                                    </Alert>
                                ) : (
                                    <Alert severity="info" sx={{mb: 2}}>
                                        Creando ubicación de nivel superior (ej. un Almacén).
                                    </Alert>
                                )}
                                
                                {/* Campos básicos */}
                                <TextField 
                                    label="Nombre *" 
                                    name="nombre" 
                                    onChange={handleFormChange} 
                                    value={formData.nombre || ''} 
                                    required 
                                    fullWidth 
                                    margin="dense" 
                                />
                                
                                <TextField 
                                    label="Tipo (ej. ESTANTERIA, ZONA, PASILLO)" 
                                    name="tipo" 
                                    onChange={handleFormChange} 
                                    value={formData.tipo || ''} 
                                    fullWidth 
                                    margin="dense" 
                                />
                                
                                <TextField 
                                    label="Código Legible" 
                                    name="codigo_legible" 
                                    onChange={handleFormChange} 
                                    value={formData.codigo_legible || ''} 
                                    fullWidth 
                                    margin="dense" 
                                />
                                
                                <TextField 
                                    label="Capacidad (opcional)" 
                                    type="number" 
                                    name="capacidad" 
                                    onChange={handleFormChange} 
                                    value={formData.capacidad || ''} 
                                    fullWidth 
                                    margin="dense"
                                    inputProps={{ min: 0 }}
                                />
                                
                                <TextField 
                                    label="Descripción" 
                                    name="descripcion" 
                                    onChange={handleFormChange} 
                                    value={formData.descripcion || ''} 
                                    multiline 
                                    rows={2} 
                                    fullWidth 
                                    margin="dense" 
                                />
                                
                                <Divider sx={{ my: 2 }}>
                                    <Typography variant="caption">
                                        Datos para el Mapa Visual (Opcional)
                                    </Typography>
                                </Divider>
                                
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    💡 <strong>Opcional:</strong> Completa estos campos solo si quieres que 
                                    esta ubicación aparezca en el mapa visual del almacén.
                                </Alert>
                                
                                <Grid container spacing={2}>
                                    <Grid size={{xs: 6}}>
                                        <TextField 
                                            label="Posición X" 
                                            type="number" 
                                            name="pos_x" 
                                            onChange={handleFormChange} 
                                            value={formData.pos_x === null || formData.pos_x === undefined ? '' : formData.pos_x} 
                                            fullWidth 
                                            margin="dense"
                                            inputProps={{ min: 0 }}
                                        />
                                    </Grid>
                                    <Grid size={{xs: 6}}>
                                        <TextField 
                                            label="Posición Y" 
                                            type="number" 
                                            name="pos_y" 
                                            onChange={handleFormChange} 
                                            value={formData.pos_y === null || formData.pos_y === undefined ? '' : formData.pos_y} 
                                            fullWidth 
                                            margin="dense"
                                            inputProps={{ min: 0 }}
                                        />
                                    </Grid>
                                    <Grid size={{xs: 6}}>
                                        <TextField 
                                            label="Ancho" 
                                            type="number" 
                                            name="width" 
                                            onChange={handleFormChange} 
                                            value={formData.width === null || formData.width === undefined ? '' : formData.width} 
                                            fullWidth 
                                            margin="dense"
                                            inputProps={{ min: 1 }}
                                        />
                                    </Grid>
                                    <Grid size={{xs: 6}}>
                                        <TextField 
                                            label="Alto" 
                                            type="number" 
                                            name="height" 
                                            onChange={handleFormChange} 
                                            value={formData.height === null || formData.height === undefined ? '' : formData.height} 
                                            fullWidth 
                                            margin="dense"
                                            inputProps={{ min: 1 }}
                                        />
                                    </Grid>
                                </Grid>
                                
                                <Box sx={{mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap'}}>
                                    <Button 
                                        type="submit" 
                                        variant="contained" 
                                        disabled={isSubmitting}
                                        startIcon={isSubmitting ? <CircularProgress size={20} /> : undefined}
                                    >
                                        {isSubmitting ? 'Guardando...' : 
                                        (editingUbicacion ? 'Guardar Cambios' : 'Crear Ubicación')
                                        }
                                    </Button>
                                    <Button onClick={clearForm} disabled={isSubmitting}>
                                        Limpiar / Cancelar
                                    </Button>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>
                    
                    <Grid size={{ xs: 12, md: 7 }}>
                        <Typography variant="h6">Estructura de Ubicaciones</Typography>
                        <Paper variant="outlined" sx={{ mt: 1, p: 1 }}>
                            <List component="nav" dense>
                                {ubicaciones.length === 0 ? (
                                    <ListItem>
                                        <ListItemText primary="No hay ubicaciones creadas." />
                                    </ListItem>
                                ) : (
                                    ubicaciones.map(ubicacion => (
                                        <UbicacionItem 
                                            key={ubicacion.id_ubicacion} 
                                            ubicacion={ubicacion} 
                                            level={0} 
                                            onAdd={handleAddClick} 
                                            onEdit={handleEditClick} 
                                            onDelete={handleDelete} 
                                        />
                                    ))
                                )}
                            </List>
                        </Paper>
                        
                        <Button 
                            variant="text" 
                            onClick={() => handleAddClick(null)} 
                            sx={{mt:1}} 
                            startIcon={<AddIcon />}
                            disabled={isSubmitting}
                        >
                            Crear ubicación de nivel superior
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Panel del mapa */}
            {ubicaciones.length > 0 && (
                <Card elevation={3}>
                    <CardHeader 
                        avatar={<MapIcon color="primary" />}
                        title="Vista del Mapa del Almacén"
                        subheader="Visualización de las ubicaciones con coordenadas definidas"
                    />
                    <CardContent>
                        <Box sx={{ 
                            border: '1px solid #e0e0e0', 
                            borderRadius: '8px', 
                            overflow: 'hidden',
                            backgroundColor: '#fafafa'
                        }}>
                            <MapaAlmacen 
                                ubicaciones={ubicaciones}
                                ubicacionesConStock={ubicacionesConStockData} // Pasar los datos con stock
                                width={800}
                                height={400}
                            />
                        </Box>
                        
                        <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                            <Typography variant="body2" color="text.secondary">
                                💡 <strong>Información:</strong> Este mapa muestra todas las ubicaciones que tienen 
                                coordenadas definidas (pos_x, pos_y). Las ubicaciones con productos se resaltan.
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
};

export default UbicacionesPage;

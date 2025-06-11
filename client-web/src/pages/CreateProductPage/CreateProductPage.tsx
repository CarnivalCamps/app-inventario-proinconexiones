// client-web/src/pages/CreateProductPage/CreateProductPage.tsx
import React, { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { createProducto } from '../../services/productService';
import type { CreateProductPayload} from '../../services/productService';
import { getCategorias } from '../../services/categoriaService';
import type { CategoriaFrontend } from '../../services/categoriaService';
import { getUnidadesMedida } from '../../services/unidadMedidaService';
import type { UnidadMedidaFrontend } from '../../services/unidadMedidaService';
import { getProveedores } from '../../services/proveedorService';
import type { ProveedorFrontend} from '../../services/proveedorService';

// Imports de MUI
import {
    Paper, Box, Typography, Grid, TextField, Button, Select, MenuItem,
    InputLabel, FormControl, CircularProgress, Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import type { SelectChangeEvent } from '@mui/material';

const initialFormData: Partial<CreateProductPayload> = {
    sku: '',
    nombre_producto: '',
    id_unidad_medida_primaria_fk: undefined,
    stock_minimo: 0,
    descripcion_corta: '',
    descripcion_larga: '',
    id_categoria_fk: undefined,
    stock_maximo: undefined,
    ubicacion_almacen: '',
    imagen_url: '',
    id_proveedor_preferido_fk: undefined,
    id_unidad_conteo_alternativa_fk: undefined,
    cantidad_por_unidad_alternativa: undefined,
};

const CreateProductPage: React.FC = () => {
    const [formData, setFormData] = useState<Partial<CreateProductPayload>>(initialFormData);
    const [categorias, setCategorias] = useState<CategoriaFrontend[]>([]);
    const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedidaFrontend[]>([]);
    const [proveedores, setProveedores] = useState<ProveedorFrontend[]>([]);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [cats, ums, provs] = await Promise.all([getCategorias(), getUnidadesMedida(), getProveedores()]);
                setCategorias(cats);
                setUnidadesMedida(ums);
                setProveedores(provs);
            } catch (err: any) {
                setError(err.message || "Error cargando datos para el formulario.");
            } finally {
                setPageLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (e: SelectChangeEvent<string | number>) => {
        const { name, value } = e.target;
        const processedValue = value === '' ? undefined : Number(value);
        
        if (name === 'id_unidad_conteo_alternativa_fk' && !processedValue) {
            setFormData(prev => ({
                ...prev,
                id_unidad_conteo_alternativa_fk: undefined,
                cantidad_por_unidad_alternativa: undefined
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: processedValue }));
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        if (!formData.sku || !formData.nombre_producto || !formData.id_unidad_medida_primaria_fk) {
            setError("SKU, Nombre del producto y Unidad de Medida Primaria son obligatorios.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...formData,
                stock_minimo: Number(formData.stock_minimo) || 0,
                stock_maximo: formData.stock_maximo ? Number(formData.stock_maximo) : null,
                cantidad_por_unidad_alternativa: formData.cantidad_por_unidad_alternativa ? Number(formData.cantidad_por_unidad_alternativa) : null,
            } as CreateProductPayload;

            const nuevoProducto = await createProducto(payload);
            alert(`Producto "${nuevoProducto.nombre_producto}" creado exitosamente!`);
            navigate('/productos');
        } catch (err: any) {
            setError(err.message || "Ocurrió un error al crear el producto.");
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) return <CircularProgress />;

    return (
        <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Button component={RouterLink} to="/productos" sx={{ minWidth: 'auto', mr: 2 }} aria-label="Volver a la lista">
                    <ArrowBackIcon />
                </Button>
                <Typography variant="h4" component="h1">
                    Crear Nuevo Producto
                </Typography>
            </Box>
            
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Box component="form" onSubmit={handleSubmit} noValidate>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}><TextField label="SKU" name="sku" value={formData.sku || ''} onChange={handleChange} required fullWidth /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><TextField label="Nombre del Producto" name="nombre_producto" value={formData.nombre_producto || ''} onChange={handleChange} required fullWidth /></Grid>
                    <Grid size={{ xs: 12 }}><TextField label="Descripción Corta" name="descripcion_corta" value={formData.descripcion_corta || ''} onChange={handleChange} fullWidth /></Grid>
                    <Grid size={{ xs: 12 }}><TextField label="Descripción Larga" name="descripcion_larga" value={formData.descripcion_larga || ''} onChange={handleChange} multiline rows={3} fullWidth /></Grid>
                    
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControl fullWidth>
                            <InputLabel id="categoria-label">Categoría</InputLabel>
                            <Select labelId="categoria-label" label="Categoría" name="id_categoria_fk" value={formData.id_categoria_fk || ''} onChange={handleSelectChange}>
                                <MenuItem value=""><em>-- Sin Categoría --</em></MenuItem>
                                {categorias.map(cat => <MenuItem key={cat.id_categoria} value={cat.id_categoria}>{cat.nombre_categoria}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControl fullWidth required>
                            <InputLabel id="unidad-primaria-label">Unidad Primaria</InputLabel>
                            <Select labelId="unidad-primaria-label" label="Unidad Primaria" name="id_unidad_medida_primaria_fk" value={formData.id_unidad_medida_primaria_fk || ''} onChange={handleSelectChange}>
                                <MenuItem value="" disabled><em>-- Seleccione una unidad --</em></MenuItem>
                                {unidadesMedida.map(um => <MenuItem key={um.id_unidad_medida} value={um.id_unidad_medida}>{um.nombre_unidad} ({um.abreviatura})</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}><TextField label="Stock Mínimo" type="number" name="stock_minimo" value={formData.stock_minimo || 0} onChange={handleChange} fullWidth /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><TextField label="Stock Máximo (opcional)" type="number" name="stock_maximo" value={formData.stock_maximo || ''} onChange={handleChange} fullWidth /></Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControl fullWidth>
                            <InputLabel id="unidad-alt-label">Unidad Alternativa (opcional)</InputLabel>
                            <Select labelId="unidad-alt-label" label="Unidad Alternativa (opcional)" name="id_unidad_conteo_alternativa_fk" value={formData.id_unidad_conteo_alternativa_fk || ''} onChange={handleSelectChange}>
                                <MenuItem value=""><em>-- Ninguna --</em></MenuItem>
                                {unidadesMedida.map(um => <MenuItem key={um.id_unidad_medida} value={um.id_unidad_medida}>{um.nombre_unidad} ({um.abreviatura})</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    {formData.id_unidad_conteo_alternativa_fk && 
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField label="Cantidad por Und. Alternativa" type="number" name="cantidad_por_unidad_alternativa" value={formData.cantidad_por_unidad_alternativa || ''} onChange={handleChange} required fullWidth InputProps={{ inputProps: { min: 1 } }}/>
                        </Grid>
                    }

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControl fullWidth>
                            <InputLabel id="proveedor-label">Proveedor Preferido (opcional)</InputLabel>
                            <Select labelId="proveedor-label" label="Proveedor Preferido (opcional)" name="id_proveedor_preferido_fk" value={formData.id_proveedor_preferido_fk || ''} onChange={handleSelectChange}>
                                <MenuItem value=""><em>-- Ninguno --</em></MenuItem>
                                {proveedores.map(p => <MenuItem key={p.id_proveedor} value={p.id_proveedor}>{p.nombre_proveedor}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><TextField label="Ubicación en Almacén (opcional)" name="ubicacion_almacen" value={formData.ubicacion_almacen || ''} onChange={handleChange} fullWidth /></Grid>
                    <Grid size={{ xs: 12 }}><TextField label="URL de Imagen (opcional)" name="imagen_url" value={formData.imagen_url || ''} onChange={handleChange} fullWidth /></Grid>
                </Grid>

                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                    <Button type="submit" variant="contained" disabled={loading || pageLoading}>
                        {loading ? <CircularProgress size={24} /> : 'Crear Producto'}
                    </Button>
                    <Button variant="outlined" component={RouterLink} to="/productos">
                        Cancelar
                    </Button>
                </Box>
            </Box>
        </Paper>
    );
};

export default CreateProductPage;
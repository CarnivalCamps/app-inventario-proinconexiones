// client-web/src/pages/UnidadesMedidaPage/UnidadesMedidaPage.tsx
import React, { useState, useEffect} from 'react';
import type { FormEvent } from 'react';
import {
    getUnidadesMedida,
    createUnidadMedida,
    updateUnidadMedida,
    deleteUnidadMedida,
    
} from '../../services/unidadMedidaService';
import type { UnidadMedidaFrontend, CreateUnidadMedidaPayload } from '../../services/unidadMedidaService';

// import './UnidadesMedidaPage.css'; // Para estilos

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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    

    if (isLoading && unidades.length === 0) return <p>Cargando unidades de medida...</p>;
    if (error && !isFormVisible && unidades.length === 0) return <p style={{ color: 'red' }}>Error: {error}</p>;

    return (
        <div>
            <h2>Gestión de Unidades de Medida</h2>
            <button onClick={openCreateForm} style={{ marginBottom: '20px', padding: '10px' }}>
                {isFormVisible && !editingUnidad ? 'Cerrar Formulario' : 'Crear Nueva Unidad'}
            </button>

            {isFormVisible && (
                <div style={{ border: '1px solid #ccc', padding: '20px', marginTop: '20px', marginBottom: '20px' }}>
                    <h3>{editingUnidad ? 'Editar Unidad de Medida' : 'Nueva Unidad de Medida'}</h3>
                    <form onSubmit={handleFormSubmit}>
                        <div style={{ marginBottom: '10px' }}>
                            <label htmlFor="nombre_unidad" style={{display: 'block'}}>Nombre:</label>
                            <input type="text" id="nombre_unidad" name="nombre_unidad" value={formData.nombre_unidad} onChange={handleInputChange} required style={{width: '90%', padding: '8px'}}/>
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <label htmlFor="abreviatura" style={{display: 'block'}}>Abreviatura:</label>
                            <input type="text" id="abreviatura" name="abreviatura" value={formData.abreviatura} onChange={handleInputChange} required style={{width: '90%', padding: '8px'}}/>
                        </div>
                        {error && isFormVisible && <p style={{ color: 'red' }}>{error}</p>}
                        <button type="submit" style={{ padding: '5px 10px' }} disabled={isLoading}>
                            {isLoading ? 'Guardando...' : (editingUnidad ? 'Actualizar Unidad' : 'Crear Unidad')}
                        </button>
                        {editingUnidad && (
                            <button type="button" onClick={() => { setIsFormVisible(false); setEditingUnidad(null); setError(null);}} style={{ padding: '5px 10px', marginLeft: '5px' }}>
                                Cancelar Edición
                            </button>
                        )}
                    </form>
                </div>
            )}

            <h3>Lista de Unidades Existentes</h3>
            {unidades.length === 0 && !isLoading ? (
                <p>No hay unidades de medida para mostrar.</p>
            ) : (
                <table border={1} style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                    <thead>
                        <tr>
                            <th style={{border: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>ID</th>
                            <th style={{border: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>Nombre</th>
                            <th style={{border: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>Abreviatura</th>
                            <th style={{border: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {unidades.map((um) => (
                            <tr key={um.id_unidad_medida}>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{um.id_unidad_medida}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{um.nombre_unidad}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{um.abreviatura}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>
                                    <button onClick={() => handleEdit(um)} style={{ marginRight: '5px', padding: '5px 10px' }}>Editar</button>
                                    <button onClick={() => handleDelete(um.id_unidad_medida)} style={{padding: '5px 10px', backgroundColor: 'salmon'}}>Eliminar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default UnidadesMedidaPage;
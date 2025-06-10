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

    

    if (isLoading && proveedores.length === 0) return <p>Cargando proveedores...</p>;
    if (error && !isFormVisible && proveedores.length === 0) return <p style={{ color: 'red' }}>Error: {error}</p>;

    return (
        <div>
            <h2>Gestión de Proveedores</h2>
            <button onClick={openCreateForm} style={{ marginBottom: '20px', padding: '10px' }}>
                {isFormVisible && !editingProveedor ? 'Cerrar Formulario' : 'Crear Nuevo Proveedor'}
            </button>

            {isFormVisible && (
                <div style={{ border: '1px solid #ccc', padding: '20px', marginTop: '20px', marginBottom: '20px' }}>
                    <h3>{editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
                    <form onSubmit={handleFormSubmit}>
                        <div style={{ marginBottom: '10px' }}>
                            <label htmlFor="nombre_proveedor" style={{display: 'block'}}>Nombre Proveedor:</label>
                            <input type="text" id="nombre_proveedor" name="nombre_proveedor" value={formData.nombre_proveedor} onChange={handleInputChange} required style={{width: '90%', padding: '8px'}}/>
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <label htmlFor="contacto_nombre" style={{display: 'block'}}>Nombre Contacto:</label>
                            <input type="text" id="contacto_nombre" name="contacto_nombre" value={formData.contacto_nombre || ''} onChange={handleInputChange} style={{width: '90%', padding: '8px'}}/>
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <label htmlFor="contacto_email" style={{display: 'block'}}>Email Contacto:</label>
                            <input type="email" id="contacto_email" name="contacto_email" value={formData.contacto_email || ''} onChange={handleInputChange} style={{width: '90%', padding: '8px'}}/>
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <label htmlFor="contacto_telefono" style={{display: 'block'}}>Teléfono Contacto:</label>
                            <input type="text" id="contacto_telefono" name="contacto_telefono" value={formData.contacto_telefono || ''} onChange={handleInputChange} style={{width: '90%', padding: '8px'}}/>
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <label htmlFor="direccion" style={{display: 'block'}}>Dirección:</label>
                            <textarea id="direccion" name="direccion" value={formData.direccion || ''} onChange={handleInputChange} style={{width: '90%', padding: '8px'}} rows={2}/>
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <label htmlFor="notas" style={{display: 'block'}}>Notas:</label>
                            <textarea id="notas" name="notas" value={formData.notas || ''} onChange={handleInputChange} style={{width: '90%', padding: '8px'}} rows={3}/>
                        </div>
                        {error && isFormVisible && <p style={{ color: 'red' }}>{error}</p>}
                        <button type="submit" style={{ padding: '5px 10px' }} disabled={isLoading}>
                            {isLoading ? 'Guardando...' : (editingProveedor ? 'Actualizar Proveedor' : 'Crear Proveedor')}
                        </button>
                        {editingProveedor && (
                            <button type="button" onClick={() => { setIsFormVisible(false); setEditingProveedor(null); setError(null);}} style={{ padding: '5px 10px', marginLeft: '5px' }}>
                                Cancelar Edición
                            </button>
                        )}
                    </form>
                </div>
            )}

            <h3>Lista de Proveedores Existentes</h3>
            {proveedores.length === 0 && !isLoading ? (
                <p>No hay proveedores para mostrar.</p>
            ) : (
                <table border={1} style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                    <thead>
                        <tr>
                            <th style={{border: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>ID</th>
                            <th style={{border: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>Nombre</th>
                            <th style={{border: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>Contacto</th>
                            <th style={{border: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>Email</th>
                            <th style={{border: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>Teléfono</th>
                            <th style={{border: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {proveedores.map((prov) => (
                            <tr key={prov.id_proveedor}>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{prov.id_proveedor}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{prov.nombre_proveedor}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{prov.contacto_nombre || '-'}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{prov.contacto_email || '-'}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>{prov.contacto_telefono || '-'}</td>
                                <td style={{border: '1px solid #ddd', padding: '8px'}}>
                                    <button onClick={() => handleEdit(prov)} style={{ marginRight: '5px', padding: '5px 10px' }}>Editar</button>
                                    <button onClick={() => handleDelete(prov.id_proveedor)} style={{padding: '5px 10px', backgroundColor: 'salmon'}}>Eliminar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ProveedoresPage;
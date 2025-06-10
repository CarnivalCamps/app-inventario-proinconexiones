// client-web/src/pages/ConteosPage/ConteosListPage.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getConteos, iniciarConteo} from '../../services/conteoService';
import type { ConteoFisicoFrontend } from '../../services/conteoService';

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

        try {
            setIsLoading(true);
            const nuevoConteo = await iniciarConteo({ descripcion_motivo_conteo: `Conteo iniciado el ${new Date().toLocaleString()}`});
            alert(`Conteo #${nuevoConteo.id_conteo} iniciado exitosamente.`);
            navigate(`/conteos/${nuevoConteo.id_conteo}`); // Navegar a la página de detalle del nuevo conteo
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <p>Cargando conteos...</p>;
    if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

    return (
        <div>
            <h2>Conteos Físicos de Inventario</h2>
            <button onClick={handleIniciarConteo} style={{ marginBottom: '20px', padding: '10px' }} disabled={isLoading}>
                {isLoading ? 'Iniciando...' : 'Iniciar Nuevo Conteo'}
            </button>

            {conteos.length === 0 ? (
                <p>No hay conteos para mostrar.</p>
            ) : (
                <table border={1} style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                    <thead>
                        <tr>
                            <th>ID Conteo</th>
                            <th>Fecha Inicio</th>
                            <th>Estado</th>
                            <th>Responsable</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {conteos.map((conteo) => (
                            <tr key={conteo.id_conteo}>
                                <td>#{conteo.id_conteo}</td>
                                <td>{new Date(conteo.fecha_inicio_conteo).toLocaleString()}</td>
                                <td>{conteo.estado_conteo}</td>
                                <td>{conteo.usuario_responsable?.nombre_usuario || 'N/A'}</td>
                                <td>
                                    <Link to={`/conteos/${conteo.id_conteo}`}>
                                        <button>Ver Detalles</button>
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ConteosListPage;
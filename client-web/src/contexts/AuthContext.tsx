// client-web/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode'; // Para decodificar el token
import { useNavigate } from 'react-router-dom';

interface DecodedToken {
    id: number;
    nombre_usuario: string;
    rol: string;
    iat: number;
    exp: number;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: DecodedToken | null;
    token: string | null;
    isLoading: boolean; // Para saber si estamos verificando el token inicial
    login: (newToken: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
    const [user, setUser] = useState<DecodedToken | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true); // Empezamos cargando
    const navigate = useNavigate();

    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
            try {
                const decoded = jwtDecode<DecodedToken>(storedToken);
                // Verificar si el token ha expirado
                if (decoded.exp * 1000 > Date.now()) {
                    setToken(storedToken);
                    setUser(decoded);
                    setIsAuthenticated(true);
                } else {
                    // Token expirado
                    localStorage.removeItem('authToken');
                    setUser(null);
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error("Error decodificando token al inicio:", error);
                localStorage.removeItem('authToken'); // Token inválido
                setUser(null);
                setIsAuthenticated(false);
            }
        }
        setIsLoading(false); // Terminamos la carga inicial
    }, []);

    const login = (newToken: string) => {
        try {
            const decoded = jwtDecode<DecodedToken>(newToken);
            localStorage.setItem('authToken', newToken);
            setToken(newToken);
            setUser(decoded);
            setIsAuthenticated(true);
            navigate('/dashboard'); // O a donde quieras redirigir después del login
        } catch (error) {
            console.error("Error procesando el token en login:", error);
            // Manejar el error, quizás limpiando el estado
            logout();
        }
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        navigate('/login'); // Redirigir a login al cerrar sesión
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, token, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};
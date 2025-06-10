// client-web/src/pages/LoginPage/LoginPage.tsx
import React, { useState } from 'react';
import type { FormEvent } from 'react';

import { loginUser } from '../../services/authService';
import type { LoginPayload } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';

import { 
    Container, 
    Box, 
    TextField, 
    Button, 
    Typography, 
    CircularProgress, 
    Alert,
    Paper
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Avatar from '@mui/material/Avatar';

const LoginPage: React.FC = () => {
    const [nombreUsuario, setNombreUsuario] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setLoading(true);

        const payload: LoginPayload = {
            nombre_usuario: nombreUsuario,
            password: password,
        };

        try {
            const response = await loginUser(payload);
            login(response.token);
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error inesperado.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 2,
            }}
        >
            <Container component="main" maxWidth="xs">
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    {/* Title outside the card */}
                    <Typography
                        variant="h4"
                        sx={{
                            color: 'white',
                            fontWeight: 'bold',
                            marginBottom: 4,
                            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                            textAlign: 'center',
                        }}
                    >
                        Almacenes
                    </Typography>
                    
                    <Paper
                        elevation={20}
                        sx={{
                            borderRadius: 3,
                            padding: 4,
                            width: '100%',
                            background: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                        }}
                    >
                        {/* Login Form Section */}
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                            }}
                        >
                            <Avatar 
                                sx={{ 
                                    mb: 2, 
                                    width: 56,
                                    height: 56,
                                    background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                                    boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)',
                                }}
                            >
                                <LockOutlinedIcon sx={{ fontSize: 28 }} />
                            </Avatar>
                            
                            <Typography 
                                component="h1" 
                                variant="h5"
                                sx={{
                                    color: '#1f2937',
                                    fontWeight: 600,
                                    marginBottom: 3,
                                }}
                            >
                                Iniciar Sesión
                            </Typography>

                            <Box 
                                component="form" 
                                onSubmit={handleSubmit} 
                                noValidate 
                                sx={{ width: '100%' }}
                            >
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    id="nombreUsuario"
                                    label="Nombre de Usuario"
                                    name="nombreUsuario"
                                    autoComplete="username"
                                    autoFocus
                                    value={nombreUsuario}
                                    onChange={(e) => setNombreUsuario(e.target.value)}
                                    disabled={loading}
                                    error={!!error}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            '& fieldset': {
                                                borderColor: '#d1d5db',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: '#3b82f6',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#1e3a8a',
                                            },
                                        },
                                        '& .MuiInputLabel-root': {
                                            color: '#6b7280',
                                            '&.Mui-focused': {
                                                color: '#1e3a8a',
                                            },
                                        },
                                    }}
                                />
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    name="password"
                                    label="Contraseña"
                                    type="password"
                                    id="password"
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                    error={!!error}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            '& fieldset': {
                                                borderColor: '#d1d5db',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: '#3b82f6',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#1e3a8a',
                                            },
                                        },
                                        '& .MuiInputLabel-root': {
                                            color: '#6b7280',
                                            '&.Mui-focused': {
                                                color: '#1e3a8a',
                                            },
                                        },
                                    }}
                                />

                                {error && (
                                    <Alert 
                                        severity="error" 
                                        sx={{ 
                                            width: '100%', 
                                            mt: 2,
                                            borderRadius: 2,
                                        }}
                                    >
                                        {error}
                                    </Alert>
                                )}

                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    disabled={loading}
                                    sx={{
                                        mt: 3,
                                        mb: 2,
                                        py: 1.5,
                                        borderRadius: 2,
                                        fontSize: '1rem',
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                                        boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
                                            boxShadow: '0 6px 20px rgba(59, 130, 246, 0.6)',
                                            transform: 'translateY(-1px)',
                                        },
                                        '&:disabled': {
                                            background: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
                                        },
                                        transition: 'all 0.3s ease',
                                    }}
                                >
                                    {loading ? (
                                        <CircularProgress size={24} color="inherit" />
                                    ) : (
                                        'Ingresar'
                                    )}
                                </Button>
                            </Box>

                            {/* Footer */}
                            <Typography
                                variant="body2"
                                sx={{
                                    color: '#6b7280',
                                    textAlign: 'center',
                                    mt: 2,
                                    fontSize: '0.9rem',
                                }}
                            >
                                © 2025 Proival Group
                            </Typography>
                        </Box>
                    </Paper>
                </Box>
            </Container>
        </Box>
    );
};

export default LoginPage;
// server/src/controllers/auth.controller.ts
import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { Role } from "../entities/Role";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const register = async (req: Request, res: Response): Promise<void> => {
    const { nombre_completo, nombre_usuario, password, id_rol } = req.body;

    try {
        // Validar que los datos necesarios están presentes
        if (!nombre_usuario || !password || !nombre_completo || !id_rol) {
            res.status(400).json({ message: "Todos los campos son requeridos." });
            return;
        }

        const userRepository = AppDataSource.getRepository(User);
        const roleRepository = AppDataSource.getRepository(Role);

        // Verificar si el usuario ya existe
        const userExists = await userRepository.findOneBy({ nombre_usuario: nombre_usuario });
        if (userExists) {
            res.status(400).json({ message: "El nombre de usuario ya está en uso." });
            return;
        }

        // Verificar si el rol existe
        const roleExists = await roleRepository.findOneBy({ id_rol: id_rol });
        if (!roleExists) {
            res.status(404).json({ message: "El rol especificado no existe." });
            return;
        }

        // Crear una nueva instancia de usuario
        const user = new User();
        user.nombre_completo = nombre_completo;
        user.nombre_usuario = nombre_usuario;
        user.rol = roleExists; // Asignar la entidad Role completa

        // Encriptar la contraseña
        const salt = await bcrypt.genSalt(10);
        user.contrasena_hash = await bcrypt.hash(password, salt);

        // Guardar el nuevo usuario en la base de datos
        await userRepository.save(user);

        // Devolver una respuesta exitosa (sin la contraseña)
        res.status(201).json({ message: "Usuario registrado exitosamente." });
        return;

    } catch (error) {
        console.error(error);
        // Asegurarse de que el error sea un objeto Error
        if (error instanceof Error) {
            res.status(500).json({ message: "Error interno del servidor.", error: error.message });
            return;
        }
        res.status(500).json({ message: "Error interno del servidor." });
        return;
    }
};

// --- FUNCIÓN LOGIN CORREGIDA ---
export const login = async (req: Request, res: Response): Promise<void> => {
    const { nombre_usuario, password } = req.body;

    try {
        if (!nombre_usuario || !password) {
            res.status(400).json({ message: "Nombre de usuario y contraseña son requeridos." });
            return;
        }

        const userRepository = AppDataSource.getRepository(User);

        // Buscar al usuario por su nombre de usuario
        const user = await userRepository.findOne({
            where: { nombre_usuario },
            relations: ['rol'] // Incluir la información del rol en la consulta
        });

        if (!user) {
            res.status(401).json({ message: "Credenciales inválidas." }); // No dar pistas si el usuario existe o no
            return;
        }

        // Comparar la contraseña enviada con la guardada en la BD
        const isPasswordCorrect = await bcrypt.compare(password, user.contrasena_hash);

        if (!isPasswordCorrect) {
            res.status(401).json({ message: "Credenciales inválidas." });
            return;
        }

        // Si las credenciales son correctas, generar el token JWT
        const payload = {
            id: user.id_usuario,
            nombre_usuario: user.nombre_usuario,
            rol: user.rol.nombre_rol
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET || 'default_secret', // Usar la clave secreta del .env
            { expiresIn: '8h' } // El token expirará en 8 horas
        );

        // Enviar el token al cliente
        res.status(200).json({
            message: "Inicio de sesión exitoso.",
            token: token
        });
        return;

    } catch (error) {
        console.error(error);
        if (error instanceof Error) {
            res.status(500).json({ message: "Error interno del servidor.", error: error.message });
            return;
        }
        res.status(500).json({ message: "Error interno del servidor." });
        return;
    }
};
import { Request, Response } from 'express';
import { pool } from '../config/database';

// Función para obtener los catálogos de la base de datos (GET)
export const obtenerCatalogos = async (req: Request, res: Response) => {
    try {
        // Consultas a la base de datos para obtener el tipo de comision y los modificadores, mediante su id
        const estilos = await pool.query('SELECT * FROM TIPO_COMISION ORDER BY id_tipo_comision ASC');
        const modificadores = await pool.query('SELECT * FROM MODIFICADOR ORDER BY id_modificador ASC');

        // Devuelve la respuesta al frontend en formato JSON con las 2 consultas anteriores
        res.json({
            exito: true,
            estilos: estilos.rows,
            modificadores: modificadores.rows
        });
    } catch (error) { // Manejo de errores en caso de que la consulta falle
        console.error('Error al obtener catálogos:', error);
        res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
    }
};

// Función para crear un nuevo modificador (POST)
export const crearModificador = async (req: Request, res: Response) => {
    try {
        const { nombre_modificador } = req.body;

        if (!nombre_modificador) {
            return res.status(400).json({ exito: false, mensaje: 'El nombre es obligatorio' });
        }

        // Insertamos el nuevo extra usando el pool de conexiones
        const query = 'INSERT INTO MODIFICADOR (nombre_modificador) VALUES ($1) RETURNING *';
        const result = await pool.query(query, [nombre_modificador]);

        res.status(201).json({
            exito: true,
            mensaje: 'Modificador creado con éxito',
            modificador: result.rows[0]
        });
    } catch (error: any) {
        // Si el nombre ya existe por la restricción UNIQUE, manejamos el caso
        if (error.code === '23505') {
            return res.status(400).json({ exito: false, mensaje: 'Este extra ya existe en el catálogo' });
        }
        console.error(error);
        res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
    }
};
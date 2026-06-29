import { Request, Response } from 'express';
import { pool } from '../config/database';

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
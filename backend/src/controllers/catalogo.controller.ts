import { Request, Response } from 'express';
import { pool } from '../config/database';

type ConfiguracionCatalogo = {
    tabla: 'TIPO_COMISION' | 'MODIFICADOR';
    columnaId: 'id_tipo_comision' | 'id_modificador';
    columnaNombre: 'nombre_estilo' | 'nombre_modificador';
    etiqueta: 'estilo' | 'extra';
};

const configuracionEstilos: ConfiguracionCatalogo = {
    tabla: 'TIPO_COMISION',
    columnaId: 'id_tipo_comision',
    columnaNombre: 'nombre_estilo',
    etiqueta: 'estilo'
};

const configuracionModificadores: ConfiguracionCatalogo = {
    tabla: 'MODIFICADOR',
    columnaId: 'id_modificador',
    columnaNombre: 'nombre_modificador',
    etiqueta: 'extra'
};

const nombreValido = (valor: unknown) => typeof valor === 'string' ? valor.trim() : '';

const idValido = (valor: string | string[]) => {
    if (Array.isArray(valor)) return null;
    const id = Number(valor);
    return Number.isInteger(id) && id > 0 ? id : null;
};

export const obtenerCatalogos = async (_req: Request, res: Response) => {
    try {
        const estilos = await pool.query(`
            SELECT * FROM TIPO_COMISION
            ORDER BY activo DESC, id_tipo_comision ASC
        `);
        const modificadores = await pool.query(`
            SELECT * FROM MODIFICADOR
            ORDER BY activo DESC, id_modificador ASC
        `);

        res.json({
            exito: true,
            estilos: estilos.rows,
            modificadores: modificadores.rows
        });
    } catch (error) {
        console.error('Error al obtener catálogos:', error);
        res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
    }
};

const crearEntrada = async (
    req: Request,
    res: Response,
    configuracion: ConfiguracionCatalogo
) => {
    const nombre = nombreValido(req.body[configuracion.columnaNombre]);

    if (!nombre) {
        return res.status(400).json({ exito: false, mensaje: 'El nombre es obligatorio' });
    }

    if (nombre.length > 80) {
        return res.status(400).json({ exito: false, mensaje: 'El nombre no puede superar los 80 caracteres' });
    }

    try {
        const existente = await pool.query(
            `SELECT * FROM ${configuracion.tabla}
             WHERE LOWER(TRIM(${configuracion.columnaNombre})) = LOWER($1)
             LIMIT 1`,
            [nombre]
        );

        if (existente.rowCount) {
            if (existente.rows[0].activo) {
                return res.status(409).json({
                    exito: false,
                    mensaje: `Este ${configuracion.etiqueta} ya existe en el catálogo`
                });
            }

            const reactivado = await pool.query(
                `UPDATE ${configuracion.tabla}
                 SET ${configuracion.columnaNombre} = $1, activo = TRUE
                 WHERE ${configuracion.columnaId} = $2
                 RETURNING *`,
                [nombre, existente.rows[0][configuracion.columnaId]]
            );

            return res.status(200).json({
                exito: true,
                mensaje: `${configuracion.etiqueta === 'estilo' ? 'Estilo' : 'Extra'} restaurado con éxito`,
                item: reactivado.rows[0]
            });
        }

        const result = await pool.query(
            `INSERT INTO ${configuracion.tabla} (${configuracion.columnaNombre})
             VALUES ($1)
             RETURNING *`,
            [nombre]
        );

        res.status(201).json({
            exito: true,
            mensaje: `${configuracion.etiqueta === 'estilo' ? 'Estilo' : 'Extra'} creado con éxito`,
            item: result.rows[0]
        });
    } catch (error: any) {
        if (error.code === '23505') {
            return res.status(409).json({
                exito: false,
                mensaje: `Este ${configuracion.etiqueta} ya existe en el catálogo`
            });
        }
        console.error(`Error al crear ${configuracion.etiqueta}:`, error);
        res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
    }
};

const actualizarEntrada = async (
    req: Request,
    res: Response,
    configuracion: ConfiguracionCatalogo
) => {
    const id = idValido(req.params.id);
    const nombre = nombreValido(req.body[configuracion.columnaNombre]);
    const activo = typeof req.body.activo === 'boolean' ? req.body.activo : true;

    if (!id) {
        return res.status(400).json({ exito: false, mensaje: 'Identificador inválido' });
    }

    if (!nombre) {
        return res.status(400).json({ exito: false, mensaje: 'El nombre es obligatorio' });
    }

    if (nombre.length > 80) {
        return res.status(400).json({ exito: false, mensaje: 'El nombre no puede superar los 80 caracteres' });
    }

    try {
        const duplicado = await pool.query(
            `SELECT 1 FROM ${configuracion.tabla}
             WHERE LOWER(TRIM(${configuracion.columnaNombre})) = LOWER($1)
               AND ${configuracion.columnaId} <> $2
             LIMIT 1`,
            [nombre, id]
        );

        if (duplicado.rowCount) {
            return res.status(409).json({
                exito: false,
                mensaje: `Ya existe otro ${configuracion.etiqueta} con ese nombre`
            });
        }

        const result = await pool.query(
            `UPDATE ${configuracion.tabla}
             SET ${configuracion.columnaNombre} = $1, activo = $2
             WHERE ${configuracion.columnaId} = $3
             RETURNING *`,
            [nombre, activo, id]
        );

        if (!result.rowCount) {
            return res.status(404).json({ exito: false, mensaje: 'Elemento no encontrado' });
        }

        res.json({
            exito: true,
            mensaje: activo
                ? `${configuracion.etiqueta === 'estilo' ? 'Estilo' : 'Extra'} actualizado con éxito`
                : `${configuracion.etiqueta === 'estilo' ? 'Estilo' : 'Extra'} archivado con éxito`,
            item: result.rows[0]
        });
    } catch (error) {
        console.error(`Error al actualizar ${configuracion.etiqueta}:`, error);
        res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
    }
};

const archivarEntrada = async (
    req: Request,
    res: Response,
    configuracion: ConfiguracionCatalogo
) => {
    const id = idValido(req.params.id);

    if (!id) {
        return res.status(400).json({ exito: false, mensaje: 'Identificador inválido' });
    }

    try {
        const result = await pool.query(
            `UPDATE ${configuracion.tabla}
             SET activo = FALSE
             WHERE ${configuracion.columnaId} = $1
             RETURNING *`,
            [id]
        );

        if (!result.rowCount) {
            return res.status(404).json({ exito: false, mensaje: 'Elemento no encontrado' });
        }

        res.json({
            exito: true,
            mensaje: `${configuracion.etiqueta === 'estilo' ? 'Estilo' : 'Extra'} eliminado del catálogo`,
            item: result.rows[0]
        });
    } catch (error) {
        console.error(`Error al archivar ${configuracion.etiqueta}:`, error);
        res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
    }
};

export const crearEstilo = (req: Request, res: Response) => crearEntrada(req, res, configuracionEstilos);
export const actualizarEstilo = (req: Request, res: Response) => actualizarEntrada(req, res, configuracionEstilos);
export const eliminarEstilo = (req: Request, res: Response) => archivarEntrada(req, res, configuracionEstilos);

export const crearModificador = (req: Request, res: Response) => crearEntrada(req, res, configuracionModificadores);
export const actualizarModificador = (req: Request, res: Response) => actualizarEntrada(req, res, configuracionModificadores);
export const eliminarModificador = (req: Request, res: Response) => archivarEntrada(req, res, configuracionModificadores);

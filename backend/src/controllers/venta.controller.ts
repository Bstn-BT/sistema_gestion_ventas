import { Request, Response } from 'express';
import { pool } from '../config/database';

// Comisiones por plataforma (porcentaje como decimal)
const COMISIONES_PLATAFORMA: Record<string, number> = {
    'VGen': 0.05,
    'Tiktok': 0,
    'Twitter / X': 0,
    'Discord': 0,
    'Instagram': 0,
};

// Comisiones de retiro por método de pago (porcentaje como decimal)
const COMISIONES_RETIRO: Record<string, number> = {
    'PayPal': 0.035,
    'Transferencia Bancaria': 0,
};

export const registrarVenta = async (req: Request, res: Response) => {
    const client = await pool.connect();

    try {
        const {
            nombre_cliente,
            plataforma_origen,
            metodo_pago,
            moneda_origen,
            id_estilo,
            modificadores,
            total_bruto_usd,
        } = req.body;

        // Validaciones
        if (!nombre_cliente?.trim() || !plataforma_origen || !metodo_pago || !id_estilo || !total_bruto_usd) {
            return res.status(400).json({
                exito: false,
                mensaje: 'Faltan datos obligatorios para registrar la comisión'
            });
        }

        const bruto = Number(total_bruto_usd);
        if (isNaN(bruto) || bruto <= 0) {
            return res.status(400).json({
                exito: false,
                mensaje: 'El monto total debe ser un número mayor a 0'
            });
        }

        // Cálculo automático de comisiones en el backend
        const porcentajePlataforma = COMISIONES_PLATAFORMA[plataforma_origen] ?? 0;
        const porcentajeRetiro = COMISIONES_RETIRO[metodo_pago] ?? 0;

        const comision_plataforma_usd = parseFloat((bruto * porcentajePlataforma).toFixed(2));
        const comision_retiro_usd = parseFloat((bruto * porcentajeRetiro).toFixed(2));
        const total_neto_usd = parseFloat((bruto - comision_plataforma_usd - comision_retiro_usd).toFixed(2));

        // Iniciar transacción
        await client.query('BEGIN');

        // Insertar en VENTA
        const queryVenta = `
            INSERT INTO VENTA (
                nombre_cliente,
                plataforma_origen,
                metodo_pago,
                moneda_origen,
                fecha_venta,
                total_bruto_usd,
                comision_plataforma_usd,
                comision_retiro_usd,
                total_neto_usd
            )
            VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6, $7, $8)
            RETURNING id_venta;
        `;

        const resVenta = await client.query(queryVenta, [
            nombre_cliente.trim(),
            plataforma_origen,
            metodo_pago,
            moneda_origen || 'USD',
            bruto,
            comision_plataforma_usd,
            comision_retiro_usd,
            total_neto_usd,
        ]);

        const idVenta = resVenta.rows[0].id_venta;

        // Insertar en DETALLE_VENTA
        const queryDetalle = `
            INSERT INTO DETALLE_VENTA (id_venta, id_tipo_comision, precio_acordado)
            VALUES ($1, $2, $3)
            RETURNING id_detalle;
        `;

        const resDetalle = await client.query(queryDetalle, [idVenta, id_estilo, bruto]);
        const idDetalle = resDetalle.rows[0].id_detalle;

        // Insertar modificadores si hay
        if (modificadores && modificadores.length > 0) {
            const queryModificador = `
                INSERT INTO DETALLE_MODIFICADOR (id_detalle, id_modificador)
                VALUES ($1, $2);
            `;
            for (const mod of modificadores) {
                await client.query(queryModificador, [idDetalle, mod.id]);
            }
        }

        await client.query('COMMIT');

        res.status(201).json({
            exito: true,
            mensaje: '¡Comisión registrada con éxito!',
            id_venta: idVenta,
            resumen: {
                total_bruto_usd: bruto,
                comision_plataforma_usd,
                comision_retiro_usd,
                total_neto_usd,
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al registrar venta:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno al guardar la comisión en la base de datos'
        });
    } finally {
        client.release();
    }
};

export const obtenerVentas = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`
            SELECT 
                v.id_venta,
                v.nombre_cliente,
                v.plataforma_origen,
                v.metodo_pago,
                v.fecha_venta,
                v.total_bruto_usd,
                v.comision_plataforma_usd,
                v.comision_retiro_usd,
                v.total_neto_usd,
                tc.nombre_estilo
            FROM VENTA v
            LEFT JOIN DETALLE_VENTA dv ON v.id_venta = dv.id_venta
            LEFT JOIN TIPO_COMISION tc ON dv.id_tipo_comision = tc.id_tipo_comision
            ORDER BY v.fecha_venta DESC, v.id_venta DESC
        `);

        res.status(200).json({
            exito: true,
            ventas: result.rows
        });
    } catch (error) {
        console.error('Error al obtener ventas:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error al obtener el historial de ventas'
        });
    }
};

export const obtenerVentaPorId = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT 
                v.*,
                tc.nombre_estilo,
                COALESCE(
                    json_agg(m.nombre_modificador) FILTER (WHERE m.nombre_modificador IS NOT NULL),
                    '[]'
                ) AS modificadores
            FROM VENTA v
            LEFT JOIN DETALLE_VENTA dv ON v.id_venta = dv.id_venta
            LEFT JOIN TIPO_COMISION tc ON dv.id_tipo_comision = tc.id_tipo_comision
            LEFT JOIN DETALLE_MODIFICADOR dm ON dv.id_detalle = dm.id_detalle
            LEFT JOIN MODIFICADOR m ON dm.id_modificador = m.id_modificador
            WHERE v.id_venta = $1
            GROUP BY v.id_venta, tc.nombre_estilo
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ exito: false, mensaje: 'Venta no encontrada' });
        }

        res.status(200).json({ exito: true, venta: result.rows[0] });
    } catch (error) {
        console.error('Error al obtener venta:', error);
        res.status(500).json({ exito: false, mensaje: 'Error al obtener la venta' });
    }
};
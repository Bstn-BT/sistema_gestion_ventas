import { Request, Response } from 'express';
import { pool } from '../config/database';

// Comisiones por plataforma (porcentaje como decimal) - se aplica al momento de la venta
const COMISIONES_PLATAFORMA: Record<string, number> = {
    'VGen': 0.05,
    'TikTok': 0,
    'Twitter / X': 0,
    'Discord': 0,
    'Instagram': 0,
    'Facebook': 0,
};

// Comisiones de retiro por método de pago (porcentaje como decimal) - se aplica solo al retirar
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

        const porcentajePlataforma = COMISIONES_PLATAFORMA[plataforma_origen] ?? 0;
        
        // --- LÓGICA DE MONEDAS Y ESTADOS ---
        let bruto_usd = bruto;
        let comision_plataforma_usd = parseFloat((bruto * porcentajePlataforma).toFixed(2));
        let neto_usd = parseFloat((bruto - comision_plataforma_usd).toFixed(2));
        let final_clp = 0; 
        
        let estado_retiro = 'pendiente';

        // Si es transferencia bancaria, intercepta los datos
        if (metodo_pago === 'Transferencia Bancaria') {
            estado_retiro = 'retirado';
            
            // Mueve el valor digitado a CLP y vaciamos los USD para que no se mezclen
            final_clp = bruto; 
            bruto_usd = 0;
            neto_usd = 0;
            comision_plataforma_usd = 0; 
        }

        await client.query('BEGIN');

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
                total_neto_usd,
                total_final_clp,
                estado_retiro,
                fecha_retiro
            )
            VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6, 0, $7, $8, $9, ${estado_retiro === 'retirado' ? 'CURRENT_DATE' : 'NULL'})
            RETURNING id_venta;
        `;

        const resVenta = await client.query(queryVenta, [
            nombre_cliente.trim(),
            plataforma_origen,
            metodo_pago,
            metodo_pago === 'Transferencia Bancaria' ? 'CLP' : (moneda_origen || 'USD'),
            bruto_usd,
            comision_plataforma_usd,
            neto_usd,
            final_clp,
            estado_retiro
        ]);

        const idVenta = resVenta.rows[0].id_venta;

        const queryDetalle = `
            INSERT INTO DETALLE_VENTA (id_venta, id_tipo_comision, precio_acordado)
            VALUES ($1, $2, $3)
            RETURNING id_detalle;
        `;

        const resDetalle = await client.query(queryDetalle, [idVenta, id_estilo, bruto]);
        const idDetalle = resDetalle.rows[0].id_detalle;

        if (modificadores && modificadores.length > 0) {
            const queryModificador = `
                INSERT INTO DETALLE_MODIFICADOR (id_detalle, id_modificador, precio_acordado)
                VALUES ($1, $2, $3);
            `;
            for (const mod of modificadores) {
                const precioMod = parseFloat(mod.precio) || 0;
                await client.query(queryModificador, [idDetalle, mod.id, precioMod]);
            }
        }

        await client.query('COMMIT');

        res.status(201).json({
            exito: true,
            mensaje: estado_retiro === 'retirado' 
                ? '¡Comisión registrada! Al ser transferencia, se guardó directamente en CLP y está marcada como retirada.' 
                : '¡Comisión registrada con éxito! Recuerda marcarla como "retirada" cuando muevas el dinero a tu banco.',
            id_venta: idVenta,
            resumen: {
                total_bruto_usd: bruto_usd,
                comision_plataforma_usd,
                total_neto_usd: neto_usd,
                total_final_clp: final_clp,
                estado_retiro
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

export const marcarComoRetirada = async (req: Request, res: Response) => {
    const client = await pool.connect();

    try {
        const { id } = req.params;

        const ventaActual = await client.query(
            'SELECT total_bruto_usd, metodo_pago, estado_retiro FROM VENTA WHERE id_venta = $1',
            [id]
        );

        if (ventaActual.rows.length === 0) {
            return res.status(404).json({ exito: false, mensaje: 'Venta no encontrada' });
        }

        const venta = ventaActual.rows[0];

        if (venta.estado_retiro === 'retirado') {
            return res.status(400).json({ exito: false, mensaje: 'Esta venta ya fue marcada como retirada' });
        }

        const bruto = parseFloat(venta.total_bruto_usd);
        const porcentajeRetiro = COMISIONES_RETIRO[venta.metodo_pago] ?? 0;
        const comision_retiro_usd = parseFloat((bruto * porcentajeRetiro).toFixed(2));

        const ventaCompleta = await client.query(
            'SELECT comision_plataforma_usd FROM VENTA WHERE id_venta = $1',
            [id]
        );
        const comisionPlataforma = parseFloat(ventaCompleta.rows[0].comision_plataforma_usd);
        const total_neto_usd = parseFloat((bruto - comisionPlataforma - comision_retiro_usd).toFixed(2));

        await client.query(
            `UPDATE VENTA 
             SET comision_retiro_usd = $1, 
                 total_neto_usd = $2, 
                 estado_retiro = 'retirado', 
                 fecha_retiro = CURRENT_DATE
             WHERE id_venta = $3`,
            [comision_retiro_usd, total_neto_usd, id]
        );

        res.status(200).json({
            exito: true,
            mensaje: 'Venta marcada como retirada exitosamente',
            resumen: {
                comision_retiro_usd,
                total_neto_usd,
            }
        });

    } catch (error) {
        console.error('Error al marcar venta como retirada:', error);
        res.status(500).json({ exito: false, mensaje: 'Error al actualizar la venta' });
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
                v.total_final_clp,
                v.estado_retiro,
                v.fecha_retiro,
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
                dv.precio_acordado AS precio_estilo,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'nombre', m.nombre_modificador,
                            'precio', dm.precio_acordado
                        )
                    ) FILTER (WHERE m.nombre_modificador IS NOT NULL),
                    '[]'
                ) AS modificadores
            FROM VENTA v
            LEFT JOIN DETALLE_VENTA dv ON v.id_venta = dv.id_venta
            LEFT JOIN TIPO_COMISION tc ON dv.id_tipo_comision = tc.id_tipo_comision
            LEFT JOIN DETALLE_MODIFICADOR dm ON dv.id_detalle = dm.id_detalle
            LEFT JOIN MODIFICADOR m ON dm.id_modificador = m.id_modificador
            WHERE v.id_venta = $1
            GROUP BY v.id_venta, tc.nombre_estilo, dv.precio_acordado
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
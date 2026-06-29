import { Request, Response } from 'express';
import { pool } from '../config/database';

// Función para registrar una venta (POST)
export const registrarVenta = async (req: Request, res: Response) => {
    // Cliente de la base de datos que se obtiene del pool
    const client = await pool.connect();

    try {
        // Datos de la venta y del detalle que vienen en el cuerpo de la solicitud
        const {
            nombre_cliente,
            plataforma_origen,
            metodo_pago,
            moneda_origen,
            fecha_venta,
            banco_destino,
            total_bruto_usd,
            comision_plataforma_usd,
            comision_paypal_usd,
            total_neto_usd,
            valor_dolar_clp,
            total_final_clp,
            // Datos del detalle de la comision
            id_tipo_comision,
            precio_acordado,
            modificadores // Modificaciones opcionales que el usuario puede seleccionar
        } = req.body;

        // Iniciar la transaccion
        await client.query('BEGIN');

        // Se inserta la venta en la tabla VENTA
        const queryVenta = `
            INSERT INTO VENTA (
                nombre_cliente, plataforma_origen, metodo_pago, moneda_origen, 
                fecha_venta, banco_destino, total_bruto_usd, comision_plataforma_usd, 
                comision_paypal_usd, total_neto_usd, valor_dolar_clp, total_final_clp
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id_venta;
        `;
        
        // Los valores que se van a insertar en la tabla VENTA
        const valoresVenta = [
            nombre_cliente, plataforma_origen, metodo_pago, moneda_origen,
            fecha_venta, banco_destino, total_bruto_usd, comision_plataforma_usd,
            comision_paypal_usd, total_neto_usd, valor_dolar_clp, total_final_clp
        ];

        const resVenta = await client.query(queryVenta, valoresVenta);
        const idVentaGenerado = resVenta.rows[0].id_venta; // Agarra el id_venta generado automáticamente por la base de datos

        // Inserta el detalle de la venta en la tabla DETALLE_VENTA
        const queryDetalle = `
            INSERT INTO DETALLE_VENTA (id_venta, id_tipo_comision, precio_acordado)
            VALUES ($1, $2, $3)
            RETURNING id_detalle;
        `;
        
        const resDetalle = await client.query(queryDetalle, [idVentaGenerado, id_tipo_comision, precio_acordado]);
        const idDetalleGenerado = resDetalle.rows[0].id_detalle;

        // Inserta los modificadores (si es que el cliente seleccionó alguno) en la tabla DETALLE_MODIFICADOR
        if (modificadores && modificadores.length > 0) {
            const queryPuente = `
                INSERT INTO DETALLE_MODIFICADOR (id_detalle, id_modificador)
                VALUES ($1, $2);
            `;
            
            // Recorre el array de modificadores y los inserta uno por uno en la tabla puente
            for (const idModificador of modificadores) {
                await client.query(queryPuente, [idDetalleGenerado, idModificador]);
            }
        }

        // Si todo resulta exitoso, se hace commit de la transacción
        await client.query('COMMIT');

        res.status(201).json({
            exito: true,
            mensaje: 'Venta registrada exitosamente con todos sus componentes',
            id_venta: idVentaGenerado
        });

    } catch (error) {
        // Si falla algo, se hace rollback de la transacción para mantener la integridad de la base de datos
        await client.query('ROLLBACK');
        console.error('Error en la transacción de venta:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error al registrar la venta. Transacción cancelada de forma segura.'
        });
    } finally {
        // Libera el cliente de la base de datos para que pueda ser reutilizado por otras solicitudes
        client.release();
    }
}

// Función para obtener el historial de ventas (GET)
export const obtenerVentas = async (req: Request, res: Response) => {
    try {
        // Consultamos todas las ventas ordenadas por fecha (las más nuevas primero)
        const query = 'SELECT * FROM VENTA ORDER BY fecha_venta DESC, id_venta DESC';
        const result = await pool.query(query);

        res.json({
            exito: true,
            cantidad: result.rowCount,
            ventas: result.rows
        });
    } catch (error) {
        console.error('Error al obtener el historial de ventas:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno al cargar las ventas'
        });
    }
};
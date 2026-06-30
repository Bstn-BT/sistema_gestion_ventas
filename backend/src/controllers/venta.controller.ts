import { Request, Response } from 'express';
// Asegúrate de que la ruta hacia tu configuración de base de datos sea correcta
import { pool } from '../config/database'; 

export const registrarVenta = async (req: Request, res: Response) => {
    // Solicitamos un cliente dedicado para manejar la transacción SQL de forma segura
    const client = await pool.connect();

    try {
        // Extrae todos los campos que envía el Organismo (FormularioComision) de React
        const { 
            total_usd, 
            valor_dolar, 
            total_clp, 
            id_estilo, 
            modificadores,
            nombre_cliente,      
            plataforma_origen,   
            metodo_pago,         
            moneda_origen        
        } = req.body;

        // Validaciones básicas para asegurar la integridad de la base de datos
        if (!total_usd || !valor_dolar || !id_estilo || !nombre_cliente || !plataforma_origen || !metodo_pago) {
            return res.status(400).json({ exito: false, mensaje: 'Faltan datos obligatorios para registrar la comisión' });
        }

        // INICIA LA TRANSACCIÓN
        await client.query('BEGIN'); 

        // Inserta en la tabla VENTA (Cabecera financiera)
        const queryVenta = `
            INSERT INTO VENTA (
                nombre_cliente,
                plataforma_origen,
                metodo_pago,
                moneda_origen
            )
            VALUES (CURRENT_DATE, $1, $2, $3, $4, $5, $6, $7)
            RETURNING id_venta;
        `;
        
        const resVenta = await client.query(queryVenta, [
            total_usd, 
            valor_dolar, 
            total_clp, 
            nombre_cliente, 
            plataforma_origen, 
            metodo_pago, 
            moneda_origen || 'USD' // Fallback de seguridad
        ]);
        const idVenta = resVenta.rows[0].id_venta;

        // Inserta en DETALLE_VENTA (El estilo de dibujo principal y su precio acordado)
        const queryDetalle = `
            INSERT INTO DETALLE_VENTA (id_venta, id_tipo_comision, precio_acordado)
            VALUES ($1, $2, $3)
            RETURNING id_detalle;
        `;
        
        // Agrega total_usd como el tercer parámetro ($3)
        const resDetalle = await client.query(queryDetalle, [idVenta, id_estilo, total_usd]);
        const idDetalle = resDetalle.rows[0].id_detalle;

        // Inserta los Extras en DETALLE_MODIFICADOR (Solo el ID del tipo de extra)
        if (modificadores && modificadores.length > 0) {
            const queryModificador = `
                INSERT INTO DETALLE_MODIFICADOR (id_detalle, id_modificador)
                VALUES ($1, $2);
            `;
            
            for (const mod of modificadores) {
                await client.query(queryModificador, [idDetalle, mod.id]);
            }
        }

        // CONFIRMA LA TRANSACCIÓN (Se guardan las tablas simultáneamente)
        await client.query('COMMIT'); 

        res.status(201).json({
            exito: true,
            mensaje: '¡Comisión registrada con éxito!',
            id_venta: idVenta
        });

    } catch (error) {
        await client.query('ROLLBACK'); 
        console.error('Error al registrar venta (Transacción cancelada):', error);
        res.status(500).json({ 
            exito: false, 
            mensaje: 'Error interno al guardar la comisión en la base de datos' 
        });
    } finally {
        client.release(); 
    }
}

// Función para obtener el historial de ventas (Requerida por venta.routes.ts)
export const obtenerVentas = async (req: Request, res: Response) => {
    try {
        const client = await pool.connect();
        // Trae todas las ventas ordenadas por la más reciente
        const result = await client.query('SELECT * FROM VENTA ORDER BY fecha_venta DESC');
        client.release();
        
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
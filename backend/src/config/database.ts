import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    keepAlive: true,
    max: 10,
    idleTimeoutMillis: 0,
});

export const connectDB = async () => {
    try {
        const client = await pool.connect();
        try {
            await client.query(`
                ALTER TABLE VENTA
                ADD COLUMN IF NOT EXISTS comision_vgen_usd NUMERIC(12, 2) NOT NULL DEFAULT 0
            `);
            await client.query(`
                ALTER TABLE VENTA
                ADD COLUMN IF NOT EXISTS comision_recepcion_paypal_usd NUMERIC(12, 2) NOT NULL DEFAULT 0
            `);
            await client.query(`
                UPDATE VENTA
                SET comision_vgen_usd = comision_plataforma_usd
                WHERE plataforma_origen = 'VGen'
                  AND comision_plataforma_usd > 0
                  AND comision_vgen_usd = 0
                  AND comision_recepcion_paypal_usd = 0
            `);
            console.log('Base de datos conectada y esquema financiero actualizado');
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error al conectar con la base de datos:', error);
        process.exit(1);
    }
};

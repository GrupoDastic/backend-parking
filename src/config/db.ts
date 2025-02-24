import dotenv from 'dotenv';

dotenv.config();

const Pool = require('pg').Pool;

export const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: String(process.env.POSTGRES_PASSWORD),
    ssl: {
        rejectUnauthorized: false
    }
});

export async function testDatabaseConnection() {
    try {
        const client = await pool.connect();
        console.log("✅ Connected to the database successfully!");
        client.release(); // Release connection back to the pool
    } catch (error) {
        console.error("❌ Error connecting to the database:", error);
    }
}

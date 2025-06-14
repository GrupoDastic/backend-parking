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


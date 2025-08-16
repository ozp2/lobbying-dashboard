import { Pool } from 'pg';

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || "5432"),
    max: parseInt(process.env.DB_MAX_CLIENTS || "20"),
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    allowExitOnIdle: false,
});

process.on('SIGINT', async () => {
    await pool.end();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await pool.end();
    process.exit(0);
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

pool.on('connect', () => {
    console.log('New client connected to database');
});

export { pool };

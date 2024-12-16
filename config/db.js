const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',       // PostgreSQL username
    host: 'localhost',      // Database host
    database: 'quiz_app',   // Database name
    password: '123',  // PostgreSQL password
    port: 5432,             // Default PostgreSQL port
});

module.exports = pool;

const mysql = require('mysql2/promise');

let pool;

if (!global.__dbPool) {
    global.__dbPool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS || process.env.DB_PASSWORD, 
        database: process.env.DB_NAME,
        
        connectionLimit: 1,       
        waitForConnections: true, 
        queueLimit: 0,            
        
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
    });
}

pool = global.__dbPool;

pool.getConnection()
    .then(connection => {
        console.log('Database terhubung dengan aman (Serverless Mode)');
        connection.release();
    })
    .catch(err => {
        console.error('Gagal terhubung ke Database:', err.message);
    });

module.exports = pool;
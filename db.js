// db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

let connection;

async function connectDB() {
  try {
    if (!connection) {
      connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
      });
      console.log('✅ Conectado a la base de datos MySQL');
    }
    return connection;
  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
    // Reintento de conexión en 2 segundos si falla
    connection = null;
    await new Promise(res => setTimeout(res, 2000));
    return connectDB();
  }
}

module.exports = connectDB;

// config/connection.js
const { Pool } = require('pg');
require('dotenv').config(); // Optional: if using .env for credentials

const pool = new Pool({
    user: 'anand',
    host: 'localhost',
    database: 'esxapefromnucore_invoice_project_23_04_2025', // Make sure the database name is correct
    password: 'Anand@123',
    port: 5432, // Default PostgreSQL port
});

// Test the connection
pool.connect()
  .then(client => {
    console.log('✅ Connected to PostgreSQL database');
    client.release(); // Release the client back to the pool after use
  })
  .catch(err => {
    console.error('❌ Error connecting to PostgreSQL:', err.stack);
  });

module.exports = pool;

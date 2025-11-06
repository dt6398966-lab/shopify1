// ✅ app/dbMysql.js
import mysql from "mysql2";

// Create a connection pool with proper timeout and retry configuration
const conn = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "dsnew02",
  connectionLimit: 100,
  idleTimeout: 300000,          // 5 minutes idle timeout
  queueLimit: 0,                // No limit on queue
  // Additional connection options
  connectTimeout: 60000,        // 60 seconds connection timeout
  charset: 'utf8mb4',
  timezone: 'Z'
});

// ✅ Enhanced connection test with retry logic
const testConnection = async () => {
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      await new Promise((resolve, reject) => {
        conn.getConnection((err, connection) => {
          if (err) {
            reject(err);
          } else {
            console.log("✅ Connected to MySQL database!");
            connection.release();
            resolve();
          }
        });
      });
      break; // Connection successful, exit retry loop
    } catch (error) {
      retryCount++;
      console.error(`❌ Connection attempt ${retryCount} failed:`, error.message);
      
      if (retryCount < maxRetries) {
        console.log(`⏳ Retrying connection in 2 seconds... (${retryCount}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.error('❌ Failed to connect to database after all retry attempts');
      }
    }
  }
};

// Test connection on startup
testConnection();

// ✅ Enhanced helper function for queries with retry logic
export const mySqlQury = (qry, values = []) => {
  return new Promise((resolve, reject) => {
    const executeQuery = (retryCount = 0) => {
      conn.query(qry, values, (err, results) => {
        if (err) {
          console.error("❌ SQL Error:", err.sqlMessage || err.message);
          
          // Check if it's a connection error that can be retried
          if (err.code === 'ETIMEDOUT' || err.code === 'ECONNRESET' || err.code === 'PROTOCOL_CONNECTION_LOST') {
            if (retryCount < 2) { // Retry up to 2 times
              console.log(`⏳ Retrying query in 1 second... (attempt ${retryCount + 1}/2)`);
              setTimeout(() => executeQuery(retryCount + 1), 1000);
              return;
            }
          }
          
          return reject(err);
        }
        resolve(results);
      });
    };
    
    executeQuery();
  });
};

// Export connection and additional utilities
export { conn, testConnection };

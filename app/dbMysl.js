// ✅ app/dbMysql.js
import mysql from "mysql2";

// Create a connection pool using environment variables
const conn = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "dsnew03",
  port: parseInt(process.env.MYSQL_PORT || "3306", 10),
  connectionLimit: parseInt(process.env.MYSQL_CONNECTION_LIMIT || "100", 10),
});

// ✅ Connection test
conn.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Error connecting to MySQL:", err);
  } else {
    console.log("✅ Connected to MySQL database!");
    connection.release();
  }
});

// ✅ Helper function for queries
export const mySqlQury = (qry, values = []) => {
  return new Promise((resolve, reject) => {
    conn.query(qry, values, (err, results) => {
      if (err) {
        console.error("❌ SQL Error:", err.sqlMessage || err);
        return reject(err);
      }
      resolve(results);
    });
  });
};

// Export connection (optional)
export { conn };

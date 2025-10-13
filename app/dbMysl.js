// ✅ app/dbMysql.js
import mysql from "mysql2";

// Create a connection pool
const conn = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "dispatch",
  connectionLimit: 100,
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

import dotenv from "dotenv";
import pkg from "pg";

dotenv.config(); // Load variables from .env

const { Client } = pkg;

export default async function connectToDB() {
  const client = new Client({
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
  });
  try {
    await client.connect();
    console.log("✅ Connected to PostgreSQL");

    // const res = await client.query('SELECT * FROM your_table_name');
    // console.log('📦 Query Result:', res.rows);
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await client.end();
    console.log("🔌 Connection closed");
  }
}

connectToDB();

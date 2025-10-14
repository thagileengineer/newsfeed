import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '',
  database: 'postgres',
});

export default async function connectToDB (){
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // const res = await client.query('SELECT * FROM your_table_name');
    // console.log('📦 Query Result:', res.rows);
  } catch (err) {
    console.error('❌ Error:', err);
  }
};
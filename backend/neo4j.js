import dotenv from "dotenv";
import neo4j from 'neo4j-driver';

dotenv.config(); // Load variables from .env

const driver = neo4j.driver(process.env.NEO_URI, neo4j.auth.basic(process.env.NEO_USER, process.env.NEO_PASSWORD));

const data = await driver.getServerInfo();

console.log('Server info',data);
// Use driver.getServerInfo() to verify the connection immediately
// or simply use it when running your first query.
// It's important to close the driver when the application exits.
// driver.close()
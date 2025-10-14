import { createClient } from 'redis';

// Create a client
const client = createClient();

client.on('error', err => console.log('Redis Client Error', err));

// Connect to Redis
(async () => {
    await client.connect();
    console.log('Connected to Redis!');

    // Example command: set a key
    await client.set('mykey', 'Hello from Node.js');
    
    // Example command: get a key
    const value = await client.get('mykey');
    console.log('Value:', value); // Output: Value: Hello from Node.js

    // Always close the connection when done (optional for short scripts)
    // await client.quit(); 
})();
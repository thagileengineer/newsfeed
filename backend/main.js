import express from 'express';
import connectToDB from './pg.js';
import './neo4j.js';

const app = express();
const port = 4000;

connectToDB();

app.get('/health', (req, res)=>{
    res.send('Jinda hu main!!')
})

app.listen(port, ()=>{
    console.log("Listening on port http://localhost:"+ port);
})
import express from 'express';

const app = express();
const port = 4000;

app.get('/health', (req, res)=>{
    res.send('Jinda hu main!!')
})

app.listen(port, ()=>{
    console.log("Listening on port http://localhost:"+ port);
    
})
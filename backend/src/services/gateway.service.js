import axios from "axios";
import bodyParser from "body-parser";
import express from "express";
import jwt from 'jsonwebtoken';
import './user.service.js'

const app = express();
app.use(bodyParser.json());

const USER_SERVICE_URL = "http://localhost:4001";
const SECRET = "1234";

app.get('/health', (req, res)=>{
  res.status(200).json({message: 'Alive!!'})
})

app.post("/register", async (req, res) => {
  const { username, firstname, email, password } = req.body;

  try {
    const response = await axios.post(`${USER_SERVICE_URL}/auth/register`, {
      username,
      firstname,
      email,
      password,
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    res.status(500).json({ message: "Service unavailable" });
  }
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const authToken = authHeader && authHeader.split(' ')[1];

  if(authToken == null) return res.status(401).json( {message:'Access token required'});

  jwt.verify(authToken, SECRET, (err, user)=>{
    if(err){
        return res.status(403).json({message: 'Invalid or expired token'});
    }
    req.user = user;
    req.headers['x-user-id'] = user.id;

    next();
  })
};

app.get("/protected/profile", authenticateToken, async (req, res) => {
  res.json({
    message: "Successfully accessed protected resource",
    user: req.user,
    internal_call_header: `X-USER-ID:${req.user.id}`,
  });
});

const GATEWAY_PORT = 3000;
app.listen(GATEWAY_PORT, () => {
    console.log(`API Gateway running on port ${GATEWAY_PORT}`);
});
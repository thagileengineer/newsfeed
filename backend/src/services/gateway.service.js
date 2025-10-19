import axios from "axios";
import bodyParser from "body-parser";
import express from "express";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
import "./user.service.js";
import "./post.service.js";

const app = express();
app.use(bodyParser.json());
dotenv.config();

const USER_SERVICE_URL = "http://localhost:4001";
const POST_SERVICE_URL = "http://localhost:4002";
const JWT_SECRET = process.env.JWT_SECRET;

app.get("/health", (req, res) => {
  res.status(200).json({ message: "Alive!!" });
});

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

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const response = await axios.post(`${USER_SERVICE_URL}/auth/login`, {
      username,
      password,
    });
    
    res.status(response.status).json(response.data)
  } catch (error) {
    if(error.response){
      return res.status(error.response.status).json(error.response.data)
    }
  }
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const authToken = authHeader && authHeader.split(" ")[1];

  if (authToken == null)
    return res.status(401).json({ message: "Access token required" });

  jwt.verify(authToken, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    req.user = user;
    req.headers["x-user-id"] = user.id;

    next();
  });
};

app.get('/users/:userId', authenticateToken , async (req, res)=>{
  const userId = req.params['userId'];
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/users/${userId}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    if(error.response){
      return res.status(error.response.status).json(error.response.data)
    }
  }
})

app.post('/users/follows', authenticateToken, async (req, res)=>{
  try {
    const response = await axios.post(`${USER_SERVICE_URL}/users/follows`, req.body, {
      headers: {
        'x-user-id': req.headers['x-user-id']
      }
    });
    res.status(response.status).json(response.data)
    
  } catch (error) {
     if(error.response){
      return res.status(error.response.status).json(error.response.data)
    }
  }
});



app.post('/posts', authenticateToken,async (req, res)=>{
    try {
      const response = await axios.post(`${POST_SERVICE_URL}/posts`, req.body, {
        headers: {
          "x-user-id": req.headers["x-user-id"],
        },
      });

      res.status(response.status).json(response.data);
    } catch (error) {
      if(error.response){
        return res.status(error.response.status).json(error.response.data)
      }
    }
});


app.get('/posts/by-user', authenticateToken, async (req, res)=>{
   try {
      const response = await axios.get(`${POST_SERVICE_URL}/posts/by-user`, {
        headers: {
          "x-user-id": req.headers["x-user-id"],
        },
      });

      res.status(response.status).json(response.data);
    } catch (error) {
      if(error.response){
        return res.status(error.response.status).json(error.response.data)
      }
    }
});


const GATEWAY_PORT = process.env.GATEWAY_PORT;
app.listen(GATEWAY_PORT, () => {
  console.log(`API Gateway running on port ${GATEWAY_PORT}`);
});

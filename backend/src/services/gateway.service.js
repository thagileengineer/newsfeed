import axios from "axios";
import bodyParser from "body-parser";
import express from "express";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
import "./user.service.js";
import "./post.service.js";
import rateLimiter from "../middlewares/rate-limiter.js";
import userRouter from "../routes/user-routes.js";
import postsRouter from "../routes/posts-route.js";

const app = express();
app.use(bodyParser.json());
dotenv.config();
app.use(rateLimiter)

const USER_SERVICE_URL = `http://localhost:${process.env.USER_SERVICE_PORT}`;
const POST_SERVICE_URL = `http://localhost:${process.env.POST_SERVICE_PORT}`;
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

app.use(authenticateToken)
app.use('/users', userRouter);
app.use('/posts', postsRouter);

app.get('/feed', authenticateToken, async (req, res)=>{
    const { limit } = req.query; // Allow client to pass a limit

   try {
      const followResponse = await axios.get(`${USER_SERVICE_URL}/users/following`, {
        headers: {
          "x-user-id": req.headers["x-user-id"],
        },
      });

       if (followResponse.ok) {
            console.error(`Failed to fetch following list. Status: ${followResponse.status}`);
            return res.status(500).json({ message: 'Could not retrieve social graph information.' });
        }

      let authorIds = followResponse.data.following || [];
      authorIds = [...new Set(authorIds)]; 
      if (authorIds.length === 0) {
          return res.status(200).json({ feed: [], message: 'No posts available. Follow users to see their content!' });
      }
      
      const idsQuery = authorIds.join(',');
      const postResponse = await fetch(`${POST_SERVICE_URL}/posts/from-users?ids=${idsQuery}&limit=${limit || 50}`);
      if (!postResponse.ok) {
            console.error(`Failed to fetch posts. Status: ${postResponse.status}`);
            return res.status(500).json({ message: 'Could not retrieve post data.' });
        }

      const postData = await postResponse.json();
      const posts = postData.posts || [];
      const uniqueAuthorIds = [...new Set(posts.map(post => post.author_id))];

      const authorPromises = uniqueAuthorIds.map(fetchAuthorDetails);
      const authorDetailsArray = await Promise.all(authorPromises);
      const authorMap = authorDetailsArray.reduce((map, author) => {
            map[author.id] = author;
            return map;
        }, {});

      const personalizedFeed = posts.map(post => ({
          ...post,
          author: authorMap[post.author_id] || { username: 'Deleted User', firstName: 'N/A' }
      }));
      res.status(200).json({
            feed: personalizedFeed,
            count: personalizedFeed.length,
            message: 'Personalized newsfeed successfully generated.'
        });
    } catch (error) {
        console.error('[GATEWAY ERROR] Feed orchestration failed:', error);
        res.status(503).json({ message: 'A required downstream service is unavailable.' });
    }
});

/**
 * fetch user details by id
 * @param {number} authorId 
 * @returns {User}
 */
async function fetchAuthorDetails(authorId) {
    try {
        const response = await fetch(`${USER_SERVICE_URL}/users/${authorId}`);
        if (!response.ok) {
            console.error(`Failed to fetch author ${authorId}. Status: ${response.status}`);
            return { username: 'Unknown User', firstName: 'N/A' };
        }
        const user = await response.json();
        return {
            id: user.id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName
        };
    } catch (error) {
        console.error(`Error fetching author details for ${authorId}:`, error);
        return { username: 'Unknown User', firstName: 'N/A' };
    }
}

const GATEWAY_PORT = process.env.GATEWAY_PORT;
app.listen(GATEWAY_PORT, () => {
  console.log(`API Gateway running on port ${GATEWAY_PORT}`);
});

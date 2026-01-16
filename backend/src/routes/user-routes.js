import axios from "axios";
import {Router} from "express";



const USER_SERVICE_URL = `http://localhost:${process.env.USER_SERVICE_PORT}`;
const POST_SERVICE_URL = `http://localhost:${process.env.POST_SERVICE_PORT}`;

const userRouter = Router();

/**
 * @swagger
 * /users/follows:
 *   post:
 *     summary: Follow a user
 *     description: Add a user to your following list
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: ID of the user to follow
 *     responses:
 *       200:
 *         description: Successfully followed user
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
userRouter.post('/follows', async (req, res)=>{
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

/**
 * @swagger
 * /users/following:
 *   get:
 *     summary: Get following list
 *     description: Retrieve the list of users you are following
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Following list retrieved successfully
 *       401:
 *         description: Unauthorized
 */
userRouter.get('/following', async (req, res)=>{
  const userId = req.headers['x-user-id'];
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/users/following`, {
      headers: {
        'x-user-id': userId
      }
    });
    res.status(response.status).json(response.data)
    
  } catch (error) {
     if(error.response){
      return res.status(error.response.status).json(error.response.data)
    }
  }
});

/**
 * @swagger
 * /users/details/{userId}:
 *   get:
 *     summary: Get user details
 *     description: Retrieve details of a specific user by ID
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *       404:
 *         description: User not found
 */
userRouter.get('/details/:userId', async (req, res)=>{
  const userId = req.params['userId'];
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/users/details/${userId}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    if(error.response){
      return res.status(error.response.status).json(error.response.data)
    }
  }
})

/**
 * @swagger
 * /users/followers:
 *   get:
 *     summary: Get followers list
 *     description: Retrieve the list of users following you
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Followers list retrieved successfully
 *       401:
 *         description: Unauthorized
 */
userRouter.get('/followers', async (req, res)=>{
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/users/followers`, {
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

/**
 * @swagger
 * /users/unfollow:
 *   post:
 *     summary: Unfollow a user
 *     description: Remove a user from your following list
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: ID of the user to unfollow
 *     responses:
 *       200:
 *         description: Successfully unfollowed user
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
userRouter.post('/unfollow', async (req, res)=>{
  try {
    const response = await axios.post(`${USER_SERVICE_URL}/users/unfollow`, req.body, {
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

/**
 * @swagger
 * /users/profile/{userId}:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve comprehensive profile information for a user including details, followers, following, and posts
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       400:
 *         description: Invalid or missing user ID
 *       404:
 *         description: User not found
 */
userRouter.get('/profile/:userId', async (req, res)=>{
  const userId = parseInt(req.params['userId']);
  if(!userId || isNaN(userId)){
    return res.status(400).json({message: 'Invalid or missing user id'});
  }

  try {
    //user details
    const userResponse = await axios.get(`${USER_SERVICE_URL}/users/details/${userId}`);
    if(userResponse.status == 404){
      return res.status(404).json({message: `User not found with id:${userId}`});
    }
    const userData = userResponse.data;

    //follower count
    const followerResponse = await axios.get(`${USER_SERVICE_URL}/users/followers`, {
      headers: {
        'x-user-id': req.headers['x-user-id']
      }
    });
    userData.followers = followerResponse.data.count;

    //following
    const followResponse = await axios.get(`${USER_SERVICE_URL}/users/following`, {
      headers: {
        "x-user-id": req.headers["x-user-id"],
      },
    });

    userData.following = followResponse.data.count;

    //posts
    const postsByUserResponse = await axios.get(`${POST_SERVICE_URL}/posts/by-user/${userId}`);
    userData.posts = postsByUserResponse.data.data

    res.status(200).json(userData);

    res.status(response.status).json(response.data);
  } catch (error) {
    if(error.response){
      return res.status(error.response.status).json(error.response.data)
    }
  }
})


/**
 * @swagger
 * /users/suggestions/most-followed:
 *   get:
 *     summary: Get most followed user suggestions
 *     description: Retrieve suggestions of most followed users
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User suggestions retrieved successfully
 *       401:
 *         description: Unauthorized
 */
userRouter.get('/suggestions/most-followed', async (req, res)=>{

  try {
    const response = await axios.get(`${USER_SERVICE_URL}/users/suggestions/most-followed`, {
      headers: {
        'x-user-id': req.headers['x-user-id']
      }
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    if(error.response){
      return res.status(error.response.status).json(error.response.data);
    }
  }
})

export default userRouter;
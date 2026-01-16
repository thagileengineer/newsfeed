import axios from "axios";
import {Router} from "express";

const USER_SERVICE_URL = `http://localhost:${process.env.USER_SERVICE_PORT}`;
const POST_SERVICE_URL = `http://localhost:${process.env.POST_SERVICE_PORT}`;

const postsRouter = Router();

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Create a new post
 *     description: Create a new post with content
 *     tags:
 *       - Posts
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: The post content
 *     responses:
 *       200:
 *         description: Post created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
postsRouter.post('', async (req, res)=>{
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


/**
 * @swagger
 * /posts/by-user/{userId}:
 *   get:
 *     summary: Get posts by user
 *     description: Retrieve all posts created by a specific user
 *     tags:
 *       - Posts
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The user ID
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
 *       404:
 *         description: User not found
 */
postsRouter.get('/by-user/:userId', async (req, res)=>{
  const userId = req.params['userId'] ?? req.headers["x-user-id"];
  try {
    const response = await axios.get(`${POST_SERVICE_URL}/posts/by-user/${userId}`);

    res.status(response.status).json(response.data);
  } catch (error) {
    if(error.response){
      return res.status(error.response.status).json(error.response.data)
    }
  }
});


/**
 * @swagger
 * /posts/{postId}/like:
 *   post:
 *     summary: Like a post
 *     description: Add a like to a specific post
 *     tags:
 *       - Posts
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The post ID
 *     responses:
 *       200:
 *         description: Post liked successfully
 *       400:
 *         description: Valid postId is required
 *       401:
 *         description: Unauthorized
 */
postsRouter.post('/:postId/like', async (req, res)=>{
  const postId = req.params.postId;
  if (!postId || isNaN(parseInt(postId))) {
    return res.status(400).json({ message: "Valid postId is required." });
  }
  try {
    const response = await axios.post(`${POST_SERVICE_URL}/posts/${postId}/like`, {
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
});

/**
 * @swagger
 * /posts/comments/{postId}:
 *   post:
 *     summary: Add a comment to a post
 *     description: Create a new comment on a specific post
 *     tags:
 *       - Posts
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: The comment content
 *     responses:
 *       200:
 *         description: Comment added successfully
 *       400:
 *         description: Invalid post ID or empty comment
 *       401:
 *         description: Unauthorized
 */
postsRouter.post('/comments/:postId', async (req, res)=>{
  const postId = parseInt(req.params.postId);
  const { content } = req.body;

  if(!postId || isNaN(postId)){
    return res.status(400).json({message: 'Post id is missing or invalid.'})
  }

  if(!content.length){
    return res.status(400).json({message: 'Comment cannot be empty.'})
  }

  try {
    const response = await axios.post(`${POST_SERVICE_URL}/posts/comments/${postId}`, req.body, {
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

/**
 * @swagger
 * /posts/{postId}/comments:
 *   get:
 *     summary: Get comments for a post
 *     description: Retrieve all comments on a specific post
 *     tags:
 *       - Posts
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The post ID
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 *       400:
 *         description: Invalid post ID
 *       401:
 *         description: Unauthorized
 */
postsRouter.get('/:postId/comments', async (req, res)=>{
  const postId = parseInt(req.params.postId);

  if(!postId || isNaN(postId)){
    return res.status(400).json({message: 'Post id is missing or invalid.'})
  }

  try {
    const response = await axios.get(`${POST_SERVICE_URL}/posts/${postId}/comments`, {
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

/**
 * @swagger
 * /posts/comments/{commentId}:
 *   get:
 *     summary: Get a specific comment
 *     description: Retrieve a specific comment by ID
 *     tags:
 *       - Posts
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The comment ID
 *     responses:
 *       200:
 *         description: Comment retrieved successfully
 *       400:
 *         description: Invalid comment ID
 *       401:
 *         description: Unauthorized
 */
postsRouter.get('/comments/:commentId', async (req, res)=>{
  const commentId = parseInt(req.params.commentId);

  if(!commentId || isNaN(commentId)){
    return res.status(400).json({message: 'Post id is missing or invalid.'})
  }

  try {
    const response = await axios.get(`${POST_SERVICE_URL}/posts/comments/${commentId}`,{
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

export default postsRouter;
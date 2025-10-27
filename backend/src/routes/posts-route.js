import axios from "axios";
import {Router} from "express";

const USER_SERVICE_URL = `http://localhost:${process.env.USER_SERVICE_PORT}`;
const POST_SERVICE_URL = `http://localhost:${process.env.POST_SERVICE_PORT}`;

const postsRouter = Router();

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

export default postsRouter;
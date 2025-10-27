import axios from "axios";
import {Router} from "express";



const USER_SERVICE_URL = `http://localhost:${process.env.USER_SERVICE_PORT}`;
const POST_SERVICE_URL = `http://localhost:${process.env.POST_SERVICE_PORT}`;

const userRouter = Router();

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
import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { pool } from "./pg.js";

dotenv.config();

const app = express();
app.use(bodyParser.json());
const PAGE_SIZE = 50; // Standard size for newsfeed fetching

const validateInternalSecret = (req, res, next) => {
  const internalSecret = req.headers["x-internal-secret"];

  if (internalSecret !== process.env.INTERNAL_SECRET_KEY)
    return res.status(401).json({ message: "Unauthorizes access." });

  next();

};

app.use(validateInternalSecret);

//new post
app.post('/posts', async (req, res)=>{
    const userId = req.headers["x-user-id"];

    try {
        const newPost = await addNewPost(userId, req.body);
        res.status(201).json({
            postId: newPost.post_id,
            author: newPost.author_id,
            title: newPost.title,
            content: newPost.content,
            mediaUrl: newPost.media_url,
            tags: newPost.tags
        })
    } catch (error) {
        console.error("[DB ERROR] Failed to add new post:", error);
        res
        .status(500)
        .json({ message: "Internal server error during post creation." });
    }
});

/**
 * adds a new post into the posts table
 * @param {number} userId 
 * @param {object} payload
 * @returns {object} new post object
 */
async function addNewPost(userId, {title, content, tags, mediaUrl }){
    const queryText = `
        INSERT INTO posts(author_id, title, content, media_url, tags)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING post_id, author_id, title, content, media_url, tags;
    `;

    const postTags = Array.isArray(tags) ? tags: [];
    const result = await pool.query(queryText, [userId, title, content, mediaUrl, postTags]);
    return result.rows[0];

}


app.get('/posts/by-user/:userId', async (req, res)=>{
    const authorId = parseInt(req.params['userId']);

    try {
        const allPosts = await getAllPostsByAuthorId(authorId);
        res.status(200).json({data: allPosts});
    } catch (error) {
        console.error("[DB ERROR] Failed to fetch user's posts:", error);
        res
        .status(500)
        .json({ message: "Internal server error while fetching posts." });
    }
});


/**
 * get all posts by logged in user.
 * @param {number} authorId 
 * @returns Post array
 */
async function getAllPostsByAuthorId(authorId){
    const queryText = `
        SELECT post_id, author_id, title, content, tags, media_url, created_at
        FROM posts
        WHERE author_id = $1
        ORDER BY created_at DESC;
    `;
    // The query expects the array of IDs as the first parameter ($1)
    const result = await pool.query(queryText, [authorId]);
    return result.rows;
}

/**
 * get all posts by logged in user.
 * @param {number} authorId 
 * @returns Post array
 */
async function getPostsByAuthorIds(authorIds, limit = PAGE_SIZE){
    const queryText = `
        SELECT post_id, author_id, title, content, tags, media_url, created_at
        FROM posts
        WHERE author_id = ANY($1::int[])
        ORDER BY created_at DESC
        LIMIT $2;
    `;
    // The query expects the array of IDs as the first parameter ($1)
    const result = await pool.query(queryText, [authorIds, limit]);
    return result.rows;
}


app.get('/posts/from-users/', async (req, res)=>{
     const { ids, limit } = req.query;
    
    if (!ids) {
        return res.status(400).json({ message: 'Missing required query parameter: ids (list of author IDs).' });
    }

    try {
        // 1. Parse the comma-separated string of IDs into an array of integers
        const authorIds = ids.split(',')
                             .map(id => parseInt(id.trim()))
                             .filter(id => !isNaN(id));
        if (authorIds.length === 0) {
            return res.status(200).json({ posts: [], message: 'No valid author IDs provided.' });
        }

         // 2. Determine limit
        const postLimit = parseInt(limit) || PAGE_SIZE;

         // 3. Fetch the posts
        const posts = await getPostsByAuthorIds(authorIds, postLimit);

        res.status(200).json({ 
            posts: posts,
            count: posts.length,
            message: `Fetched ${posts.length} posts from ${authorIds.length} authors.`
        });

    } catch (error) {
        console.error('[DB ERROR] Failed to fetch posts from users:', error);
        res.status(500).json({ message: 'Internal server error while fetching posts.' });
    }
});

app.post('posts/:postId/like', async (req, res)=>{
    const postId = parseInt(req.params.postId);
    const userId = parseInt(res.headers['x-user-id']);
   
    try {
        await likePost(postId, userId);
        res.status(204).send(); 
    } catch (error) {
        console.error('[DB ERROR] Failed to add like to post', error);
        res.status(500).json({ message: 'Internal server error adding post like.' });
    }

});

async function likePost(postId, userId) {
    const queryText = `
        INSERT INTO post_likes(post_id, user_id)
        VALUES ($1, $2)
        ON CONFLICT (post_id, user_id) DO NOTHING;
    `;
    await pool.query(query, [postId, userId]);
    return { success: true };
}


app.post('/posts/comments/:postId', async (req, res)=>{
    const postId = parseInt(req.params.postId);
    const authorId = req.headers['x-user-id'];
    const { content } = req.body;

    try {
        const newComment = await createComment(postId, authorId, content);
        res.status(201).json({
            id: newComment.comment_id,
            postId: newComment.post_id,
            authorId: newComment.author_id,
            content: newComment.content,
            createdAt: newComment.created_at
        });
    } catch (error) {
        console.error('[DB ERROR] Failed to add new row im comments.', error);
        res.status(500).json({message: 'Failed to add new comment.'})
    }
})


async function createComment(postId, authorId, content) {
    const queryText =  `
        INSERT INTO comments (post_id, author_id, content)
        VALUES ($1, $2, $3)
        RETURNING comment_id, post_id, author_id, content, created_at
    `;

    const result = await pool.query(queryText, [postId, authorId, content]);
    return result.rows[0];
}

app.get('/posts/:postId/comments', async (req, res)=>{
    const postId = parseInt(req.params.postId);

    try {
        const comments = await getCommentByPostId(postId);
        res.status(200).json({data: comments});
    } catch (error) {
        console.error('[DB ERROR] Failed to get comments data for post.', error);
        res.status(500).json({message: 'Failed to fetch comments.'})
    }
})


async function getCommentByPostId(postId) {
    const queryText =  `
        SELECT * from comments
        WHERE post_id = $1;
    `;

    const result = await pool.query(queryText, [postId]);
    return result.rows;
}


app.get('/posts/comments/:commentId', async (req, res)=>{
    const commentId = parseInt(req.params.commentId);

    try {
        const comments = await getCommentDetailById(commentId);
        res.status(200).json({data: comments});
    } catch (error) {
        console.error('[DB ERROR] Failed to get comment by id.', error);
        res.status(500).json({message: 'Failed to fetch comment.'})
    }
})


async function getCommentDetailById(commentId) {
    const queryText =  `
        SELECT * from comments
        WHERE post_id = $1;
    `;

    const result = await pool.query(queryText, [commentId]);
    return result.rows[0];
}


const POST_SERVICE_PORT = process.env.POST_SERVICE_PORT;
app.listen(POST_SERVICE_PORT, () => {
  console.log(`Post Service running on port ${POST_SERVICE_PORT}`);
});

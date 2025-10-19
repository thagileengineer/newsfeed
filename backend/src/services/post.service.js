import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { pool } from "./pg.js";

dotenv.config();

const app = express();
app.use(bodyParser.json());


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


app.get('/posts/by-user', async (req, res)=>{
    const authorId = parseInt(req.headers['x-user-id']);

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
        SELECT * 
        FROM posts
        WHERE author_id = $1;
    `;

    const result = await pool.query(queryText, [authorId]);
    return result.rows;
}

const POST_SERVICE_PORT = process.env.POST_SERVICE_PORT;
app.listen(POST_SERVICE_PORT, () => {
  console.log(`Post Service running on port ${POST_SERVICE_PORT}`);
});

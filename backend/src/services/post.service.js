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

const POST_SERVICE_PORT = process.env.POST_SERVICE_PORT;
app.listen(POST_SERVICE_PORT, () => {
  console.log(`Post Service running on port ${POST_SERVICE_PORT}`);
});

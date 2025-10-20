import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { pool } from "./pg.js";
import axios from "axios";

dotenv.config();

const app = express();
app.use(bodyParser.json());
const USER_SERVICE_URL = `http://localhost:${process.env.USER_SERVICE_PORT}`;
const PAGE_SIZE = 50; // Standard size for newsfeed fetching


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

const POST_SERVICE_PORT = process.env.POST_SERVICE_PORT;
app.listen(POST_SERVICE_PORT, () => {
  console.log(`Post Service running on port ${POST_SERVICE_PORT}`);
});

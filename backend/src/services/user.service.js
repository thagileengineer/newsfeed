import express from "express";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { pool } from "./pg.js";
import logger from "../logger.js";

dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET; // CHANGE THIS IN PRODUCTION
const SALT_ROUNDS = 10;

const app = express();
app.use(bodyParser.json());

const validateInternalSecret = (req, res, next) => {
  const internalSecret = req.headers['x-internal-secret'];

  if (internalSecret !== process.env.INTERNAL_SECRET_KEY)
    return res.status(401).json({ message: "Unauthorizes access." });

  next();
};
app.use(validateInternalSecret);


//------------------------
// USER CREATION
//------------------------
app.post("/auth/register", async (req, res) => {
  const { username, password, firstname, email } = req.body;

  // 1. Basic check
  if (!username || !password || !email || !firstname) {
    return res
      .status(400)
      .json({ message: "First name, Username, password and email required." });
  }

  // 2. Look up user in the DB if username or email exists
  try {
    const existingUser = await checkExistingUser(username, email);

    if (existingUser) {
      const conflictedField =
        existingUser.username === username ? "username" : "email";
      return res.status(409).json({
        message: `${conflictedField} already exists.`,
      });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const newUser = await createUser(req.body, hashedPassword);
    console.log(
      `[USER_SERVICE] New user created: ${newUser.username} (${newUser.user_id})`
    );

    res.status(201).json({
      userId: newUser.user_id,
      username: newUser.username,
      email: newUser.email,
      message: "New user created successfully!",
    });
  } catch (error) {
    console.error("[DB_ERROR] Failed to create new user.", error);
    res
      .status(500)
      .json({ message: "Internal server error during user creation." });
  }
});

/**
 * Checks if a user exists by username OR email.
 * @param {string} username - The username to check.
 * @param {string} email - The email to check.
 * @returns {Promise<object | null>} - The existing user record or null.
 */
async function checkExistingUser(username, email) {
  const queryText = `
        SELECT user_id, username, email
        FROM users
        WHERE username = $1 OR email = $2;
    `;

  const result = await pool.query(queryText, [username, email]);
  return result.rows[0] || null;
}

async function createUser(payload, hashedPassword) {
  const { username, firstname, middlename, lastname, email } = payload;
  const queryText = `
        INSERT INTO users(username, first_name, middle_name, last_name, email, password_hash)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING user_id, username, first_name, email, created_at;
    `;

  const result = await pool.query(queryText, [
    username,
    firstname,
    middlename,
    lastname,
    email,
    hashedPassword,
  ]);
  return result.rows[0];
}

app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await getUserForLogin(username);

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const payload = {
      id: user.user_id,
      username: user.username,
      role: user.role || "user",
    };

    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "2h" });
    res.json({ token });
  } catch (error) {
    console.error("[DB ERROR] Login failed:", error);
    res
      .status(500)
      .json({ message: "Internal server error during authentication." });
  }
});

/**
 * gets user by username for login.
 * @param {string} username
 * @returns {Promise}
 */
async function getUserForLogin(username) {
  const queryText = `
        SELECT user_id, username, password_hash
        FROM users
        WHERE username = $1;
    `;

  const result = await pool.query(queryText, [username]);

  return result.rows[0];
}

/**
 * gets user details by user id
 * @param {number} user_id
 * @returns {Promise<User>}
 */
async function getUserInfoById(user_id) {
  const queryText = `
        SELECT user_id, username, first_name, middle_name, last_name, email
        FROM users
        WHERE user_id = $1;
    `;

  const result = await pool.query(queryText, [user_id]);
  return result.rows[0];
}

app.post("/users/follows", async (req, res) => {
  const followerId = parseInt(req.headers["x-user-id"]);
  const { followingId } = req.body;

  if (!followingId || isNaN(parseInt(followingId))) {
    return res.status(400).json({ message: "Missing or invalid arguments." });
  }

  try {
    const followingIdInt = parseInt(followingId);

    // Check for self-follow constraint
    if (followerId === followingIdInt) {
      return res.status(400).json({ message: "Cannot follow yourself." });
    }

    const followCreated = await addFollowRelationship(
      followerId,
      followingIdInt
    );
    if (!followCreated) {
      const targetUser = await getUserInfoById(followingIdInt);
      if (!targetUser) {
        return res
          .status(404)
          .json({ message: `Target user ID ${followingIdInt} not found.` });
      }
      return res.status(200).json({ message: "Already following this user." });
    }

    res.status(201).json({
      message: `User ${followerId} is now following user ${followingIdInt}.`,
    });
  } catch (error) {
    console.error("[DB ERROR] Failed to add follow relationship:", error);
    res
      .status(500)
      .json({ message: "Internal server error during follow request." });
  }
});

/**
 *  * Creates a follow relationship using UPSERT (ON CONFLICT DO NOTHING).
 * @param {number} followerId
 * @param {number} followingId
 * @returns {boolean} True if a new follow was created, false otherwise.
 */
async function addFollowRelationship(followerId, followingId) {
  const usersExists = await getUserInfoById(followingId);
  if (!usersExists) {
    return false;
  }

  const queryText = `
        INSERT INTO follows(follower_id, following_id)
        VALUES ($1, $2)
        ON CONFLICT (follower_id, following_id) DO NOTHING
        RETURNING follower_id;
    `;

  if (followerId === followingId) {
    throw new Error("Cannot follow yourself.");
  }
  const result = await pool.query(queryText, [followerId, followingId]);
  return result.rowCount > 0;
}

app.get('/users/following', async (req, res)=>{
    const userId = parseInt(req.headers['x-user-id']);
    
    try {
        const followingIds = await getFollowingIds(userId);
        res.status(200).json({
            userId: parseInt(userId),
            following: followingIds,
            count: followingIds.length
        });
    } catch (error) {
      console.error("[DB ERROR] Failed to fetch following users:", error);
      res.status(500).json({ message: "Internal server error fetching users." });
    }
});

app.get("/users/details/:userId", async (req, res) => {
  
  const userId = req.params["userId"];
  logger.info(`Starting order processing for ID: ${userId}`);

  try {
    const userData = await getUserInfoById(userId);
    if (!userData) {
      logger.warn(`UserID ${userId} is missing optional data.`);

      return res.status(404).json({ message: "User not found" });
    }

    logger.debug(`Database query executed successfully for order ${userId}.`);

    res.status(200).json({
      id: userData.user_id,
      username: userData.username,
      firstname: userData.first_name,
      middlename: userData.middle_name,
      lastname: userData.last_name,
      email: userData.email,
    });

        
    logger.info(`User ${userId} processed successfully.`);
  } catch (error) {
    console.error('[DB ERROR] Error white fetching user details.');
    logger.error(`Failed to process order ${userId}: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: "Internal server error while fetching user details." });
  }
});

/**
 * get all the user ids followed by user.
 * @param {number} userId 
 * @returns {boolean}
 */
async function getFollowingIds(userId) {
      const queryText = `
        SELECT following_id
        FROM follows
        WHERE follower_id = $1;
    `;
    const result = await pool.query(queryText, [userId]);
    return result.rows.map(row => row.following_id);
}


app.post("/users/unfollow", async (req, res) => {
  const userId = parseInt(req.headers["x-user-id"]);
  const { followingId } = req.body;

  if (!followingId || isNaN(parseInt(followingId))) {
    return res.status(400).json({ message: "Missing or invalid arguments." });
  }

  try {
    const followingIdInt = parseInt(followingId);

    // Check for self-follow constraint
    if (userId === followingIdInt) {
      return res.status(400).json({ message: "Cannot unfollow yourself." });
    }

    const followRemoved = await removeFollowRelationship(
      userId,
      followingIdInt
    );

    if(!followRemoved){
        return res.status(404).json({message: 'Follower not found.'})
    }

    res.status(204).send();
  } catch (error) {
    console.error("[DB ERROR] Failed to unfollow relationship:", error);
    return res.status(500).json({ message: 'Internal server error during unfollow process.' });
  }
});

async function removeFollowRelationship(followerId, followingId) {
    const queryText = `
        DELETE FROM follows
        WHERE follower_id = $1 AND following_id = $2
        RETURNING follower_id;
    `;

    const result = await pool.query(queryText, [followerId, followingId]);
    return result.rowCount > 0;
}



app.get('/users/followers', async (req, res)=>{
    const userId = parseInt(req.headers['x-user-id']);
    
    try {
        const followerId = await getFollowerIds(userId);
        res.status(200).json({
            userId: parseInt(userId),
            followers: followerId,
            count: followerId.length
        });
    } catch (error) {
      console.error("[DB ERROR] Failed to fetch following users:", error);
      res.status(500).json({ message: "Internal server error fetching users." });
    }
});

/**
 * get all the followers of this user with userId.
 * @param {number} userId 
 * @returns {boolean}
 */
async function getFollowerIds(userId) {
      const queryText = `
        SELECT follower_id
        FROM follows
        WHERE following_id = $1;
    `;
    const result = await pool.query(queryText, [userId]);
    return result.rows.map(row => row.follower_id);
}

app.get('/users/suggestions/most-followed', async (req, res)=>{
  const userId = parseInt(req.headers['x-user-id'])
  try {
    const suggestions = await getTopTenMostFollowedUsers(userId);
    res.status(200).json({data: suggestions});
  } catch (error) {
    console.error('[DB ERROR] Failed to fetch sugesstions', error);
    res.status(500).json({message: 'Failed to give suggestions.'})
  }
})

async function getTopTenMostFollowedUsers(currentUserId){
    const queryText = `
      SELECT u.user_id, u.username, COUNT(f.follower_id) AS follower_count
      FROM users u
      JOIN follows f ON u.user_id = f.following_id
      WHERE u.user_id <> $1
      GROUP BY u.user_id, u.username
      ORDER BY follower_count DESC
      LIMIT 10; 
    `;

    const result = await pool.query(queryText, [currentUserId]);
    return result.rows;
}

// -----------------------------------------------------------------
// B. START THE SERVICE
// -----------------------------------------------------------------
const USER_SERVICE_PORT = process.env.USER_SERVICE_PORT;
app.listen(USER_SERVICE_PORT, () => {
  console.log(`User Service running on port ${USER_SERVICE_PORT}`);
});

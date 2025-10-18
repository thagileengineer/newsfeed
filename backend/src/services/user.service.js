import express from "express";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { pool } from "./pg.js";

dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET; // CHANGE THIS IN PRODUCTION
const SALT_ROUNDS = 10;

const app = express();
app.use(bodyParser.json());

//------------------------
// USER CREATION
//------------------------
app.post("/auth/register", async (req, res) => {
  const { username, password, firstname, email } =
    req.body;

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

// -----------------------------------------------------------------
// B. START THE SERVICE
// -----------------------------------------------------------------
const USER_SERVICE_PORT = 4001;
app.listen(USER_SERVICE_PORT, () => {
  console.log(`User Service running on port ${USER_SERVICE_PORT}`);
});

CREATE TABLE post_likes (
    post_id INTEGER REFERENCES posts(post_id) ON DELETE CASCADE NOT NULL,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
    liked_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

-- Indexing on post_id for quickly calculating the like count for any given post
CREATE INDEX idx_post_likes_post_id ON post_likes (post_id);
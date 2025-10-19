CREATE TABLE posts (
    post_id SERIAL PRIMARY KEY,
    author_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
	title VARCHAR(100) NOT NULL DEFAULT 'Untitled',
    content TEXT NOT NULL,
    media_url VARCHAR(255),
	tags TEXT[],
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Indexing by author_id is essential for quickly fetching all posts for a profile.
CREATE INDEX idx_post_author ON posts (author_id);

-- Indexing by created_at is essential for generating the newsfeed in reverse chronological order.
CREATE INDEX idx_post_created_at ON posts (created_at DESC);
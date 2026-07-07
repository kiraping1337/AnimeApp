CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE user_anime_interactions (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    anime_id VARCHAR(50) NOT NULL, -- ID из внешнего API
    is_favorite BOOLEAN DEFAULT FALSE,
    is_watched BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, anime_id)
);
CREATE TABLE tier_lists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE tier_list_items (
    id SERIAL PRIMARY KEY,
    tier_list_id INTEGER REFERENCES tier_lists(id) ON DELETE CASCADE,
    anime_id VARCHAR(50) NOT NULL, -- ID из внешнего API
    rank VARCHAR(10) NOT NULL, 
    position INTEGER 
);
CREATE TABLE anime_metadata (
    anime_id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255),
    image TEXT,
    url TEXT
);
DROP TABLE IF EXISTS cafes;

CREATE TABLE cafes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    location TEXT,
    description TEXT,
    image_url TEXT
);

INSERT INTO cafes (name, location, description, image_url) VALUES 
('Brew Co.', 'Poblacion, Calamba', 'Brew and Co in Calamba is a great spot if you''re looking for a cozy place to relax, enjoy good coffee, and unwind with friends. The cafe has a warm and modern ambiance that makes it perfect for casual meetups, study sessions, or even a quiet afternoon alone.', '/images/brewco.jpg'),
('Grind', 'Poblacion, Calamba', 'More than just coffee—this is your space to slow down, unwind, and enjoy the moment... for a quick caffeine fix, a quiet night alone, or a long kwentuhan with friends.', '/images/grind.webp'),
('The Elements', 'Poblacion, Calamba', 'Calamba At The Elements, we''re here to make event planning easier with a comfortable venue, delicious catering, and a team ready to help you every step of the way.', '/images/elements.jpg');

-- USERS TABLE FOR SIGNUP & LOGIN
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
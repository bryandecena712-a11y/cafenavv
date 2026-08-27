const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Connect to SQLite Database
const db = new sqlite3.Database(path.join(__dirname, 'cafenav.db'), (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
    } else {
        console.log(' Connected to SQLite database.');
    }
});

// Create tables if they don't exist
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('Error creating table:', err.message);
        } else {
            console.log(' Database initialized successfully.');
        }
    });
});

// ==========================================
// SIGNUP ENDPOINT
// ==========================================
app.post('/api/signup', (req, res) => {
    const { username, email, password } = req.body;

    console.log('Signup request received:', { username, email });

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    const sql = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;
    db.run(sql, [username, email, password], function(err) {
        if (err) {
            console.error('Database insert error:', err.message);
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'Email already registered.' });
            }
            return res.status(500).json({ error: 'Failed to create user account.' });
        }

        console.log(`SUCCESS: User created with ID ${this.lastID}`);
        return res.status(200).json({
            message: 'User registered successfully!',
            userId: this.lastID
        });
    });
});

// ==========================================
// LOGIN ENDPOINT (ADDED FOR OFFERS UI)
// ==========================================
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    console.log('Login attempt for:', email);

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Check if user exists with matching email and password
    const sql = `SELECT * FROM users WHERE email = ? AND password = ?`;
    db.get(sql, [email, password], (err, user) => {
        if (err) {
            console.error('Database query error:', err.message);
            return res.status(500).json({ error: 'Database query failed.' });
        }

        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        console.log(`SUCCESS: User ${user.username} logged in!`);

        // Return user data including the username for frontend display
        return res.status(200).json({
            message: 'Login successful!',
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    });
});

// Store temporary OTPs in memory for verification
const otpStore = {};

// ==========================================
// 1. FORGOT PASSWORD - REQUEST OTP
// ==========================================
app.post('/api/forgot-password', (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required.' });
    }

    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error.' });
        }
        if (!user) {
            return res.status(404).json({ error: 'This email address does not exist!' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore[email] = otp;

        console.log(`PASSWORD RESET OTP FOR ${email}: [ ${otp} ]`);

        return res.status(200).json({ message: 'OTP sent successfully!', otp }); // sending OTP in response for easy test
    });
});

// ==========================================
// 2. VERIFY OTP
// ==========================================
app.post('/api/verify-otp', (req, res) => {
    const { email, otp } = req.body;

    if (otpStore[email] && otpStore[email] === otp) {
        return res.status(200).json({ message: 'OTP verified successfully!' });
    } else {
        return res.status(400).json({ error: 'The code was incorrect!' });
    }
});

// ==========================================
// 3. RESET PASSWORD
// ==========================================
app.post('/api/reset-password', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    const sql = `UPDATE users SET password = ? WHERE email = ?`;
    db.run(sql, [password, email], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to update password.' });
        }

        delete otpStore[email]; // Clear OTP after use
        console.log(`PASSWORD UPDATED FOR: ${email}`);
        return res.status(200).json({ message: 'Password updated successfully!' });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
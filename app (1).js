require('dotenv').config();
const express = require("express");
const winston = require('winston');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors'); 
const sqlite3 = require('sqlite3').verbose();
const cookieParser = require('cookie-parser'); // CSRF ke liye zaroori hai
const csrf = require('csurf'); // CSRF Protection package

const app = express();
let users = []; 

// --- DATABASE SETUP ---
const db = new sqlite3.Database(':memory:'); 
db.serialize(() => {
  db.run("CREATE TABLE db_users (id INT, username TEXT, password TEXT)");
  db.run("INSERT INTO db_users VALUES (1, 'admin', 'admin123')");
  console.log("Database Ready for Week 5!");
});

// --- LOGGING SETUP ---
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'security.log' })
  ]
});

// --- MIDDLEWARES ---
app.use(helmet()); 
app.use(cors());   
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser()); // Cookies read karne ke liye

// CSRF Protection Setup
const csrfProtection = csrf({ cookie: true });

// --- ROUTES ---

// 1. HOME
app.get("/", (req, res) => {
    res.send(`<h1>Welcome To My Internship Project!</h1><a href="/signup">Signup</a> | <a href="/login">Login</a>`);
});

// 2. SIGNUP (GET) - Token Generate karna
app.get("/signup", csrfProtection, (req, res) => {
    // req.csrfToken() se hum aik secret code generate karte hain
    res.send(`
        <h2>Signup (CSRF Protected)</h2>
        <form method="POST" action="/signup">
            <input type="hidden" name="_csrf" value="${req.csrfToken()}">
            <input name="username" placeholder="Username" required><br><br>
            <input name="password" type="password" placeholder="Password" required><br><br>
            <button type="submit">Signup</button>
        </form>
    `);
});

// 3. SIGNUP (POST) - Token Verify karna
app.post("/signup", csrfProtection, (req, res) => {
    users.push({ username: req.body.username, password: req.body.password });
    logger.info(`New secure user registered: ${req.body.username}`);
    res.send(`<h3>User Registered Successfully with CSRF Protection!</h3><a href="/">Go Home</a>`);
});

// 4. SQL INJECTION SECURE ROUTE (From Task 2)
app.get('/api/user-login', (req, res) => {
  const { username, password } = req.query;
  const query = `SELECT * FROM db_users WHERE username = ? AND password = ?`;
  db.get(query, [username, password], (err, row) => {
    if (row) {
      res.send(`<h2>Welcome back, ${row.username}!</h2><p>Status: Secure Login.</p>`);
    } else {
      res.status(401).send("Invalid credentials!");
    }
  });
});

// Error handling for CSRF
app.use(function (err, req, res, next) {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);
  res.status(403).send('<h3>Security Alert: CSRF Attack Detected! (Invalid Token)</h3>');
});

// --- START SERVER ---
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
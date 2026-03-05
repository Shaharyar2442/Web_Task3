require('dotenv').config();

const express = require('express');
const session = require('express-session');
const connectDB = require('./config/db');
const User = require('./models/User');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

// Authentication middleware
function isAuth(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.send(page('Access Denied', '<p>Please login first</p><a href="/login">Go to Login</a>'));
    }
}

// ============ HTML HELPER ============

function page(title, body) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>${title} - Student Login System</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; background: #f0f2f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
            .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); width: 400px; text-align: center; }
            h1 { color: #333; margin-bottom: 20px; }
            input { width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #ddd; border-radius: 5px; font-size: 14px; }
            button { width: 100%; padding: 12px; margin-top: 15px; background: #4CAF50; color: white; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; }
            button:hover { background: #45a049; }
            .link { margin-top: 15px; }
            .link a { color: #4CAF50; text-decoration: none; }
            .msg { padding: 12px; border-radius: 5px; margin-bottom: 15px; }
            .success { background: #d4edda; color: #155724; }
            .error { background: #f8d7da; color: #721c24; }
            .nav { margin-top: 20px; }
            .nav a { margin: 0 10px; color: #4CAF50; text-decoration: none; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>${title}</h1>
            ${body}
        </div>
    </body>
    </html>`;
}

// ============ HTML FORM PAGES ============

// GET / - Home page
app.get('/', (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    res.send(page('Student Login System',
        `<p>Welcome to the Student Login System</p>
         <div class="nav" style="margin-top:25px;">
            <a href="/register"><button style="background:#2196F3;">Register</button></a>
            <a href="/login"><button>Login</button></a>
         </div>`
    ));
});

// GET /register - Show register form
app.get('/register', (req, res) => {
    res.send(page('Register',
        `<form method="POST" action="/register">
            <input type="text" name="username" placeholder="Username" required>
            <input type="password" name="password" placeholder="Password" required>
            <button type="submit">Register</button>
         </form>
         <div class="link"><a href="/login">Already have an account? Login</a></div>`
    ));
});

// GET /login - Show login form
app.get('/login', (req, res) => {
    res.send(page('Login',
        `<form method="POST" action="/login">
            <input type="text" name="username" placeholder="Username" required>
            <input type="password" name="password" placeholder="Password" required>
            <button type="submit">Login</button>
         </form>
         <div class="link"><a href="/register">Don't have an account? Register</a></div>`
    ));
});

// ============ API ROUTES ============

// POST /register - Register a new user
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = new User(username, password);
        const message = await user.register();
        res.send(page('Success',
            `<div class="msg success">${message}</div>
             <a href="/login"><button>Go to Login</button></a>`
        ));
    } catch (err) {
        res.status(500).send(page('Error',
            `<div class="msg error">Error registering user: ${err.message}</div>
             <a href="/register"><button>Try Again</button></a>`
        ));
    }
});

// POST /login - Login user
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = new User(username, password);
        const result = await user.login();
        if (result) {
            req.session.user = username;
            res.send(page('Login Successful',
                `<div class="msg success">Welcome, ${username}!</div>
                 <a href="/dashboard"><button>Go to Dashboard</button></a>`
            ));
        } else {
            res.send(page('Login Failed',
                `<div class="msg error">Invalid credentials</div>
                 <a href="/login"><button>Try Again</button></a>`
            ));
        }
    } catch (err) {
        res.status(500).send(page('Error',
            `<div class="msg error">Error logging in: ${err.message}</div>
             <a href="/login"><button>Try Again</button></a>`
        ));
    }
});

// GET /dashboard - Protected route
app.get('/dashboard', isAuth, (req, res) => {
    res.send(page('Dashboard',
        `<div class="msg success">Welcome ${req.session.user}</div>
         <a href="/logout"><button style="background:#f44336;">Logout</button></a>`
    ));
});

// GET /logout - Logout user
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send(page('Error', '<div class="msg error">Error logging out</div>'));
        }
        res.send(page('Logged Out',
            `<div class="msg success">Logout successful</div>
             <a href="/login"><button>Login Again</button></a>`
        ));
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

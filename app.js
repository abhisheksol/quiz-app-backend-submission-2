const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors')
const app = express();
const PORT = process.env.PORT || 5000;
const userRoutes = require('./routes/userRoutes'); // Adjust path if needed
const quizRoutes = require('./routes/quizRoutes'); // Adjust path if needed

// Middleware for parsing JSON and cookies
app.use(cors())
app.use(express.json());
app.use(cookieParser());

// Session setup
app.use(
    session({
        secret: 'b8a2f9adbe92c9f3fc678d3209d8582c2f388ad040aa6590530a118d21c49a4e', // Replace with a secure key
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }, // Change to true in production with HTTPS
    })
);

// Import routes


// Mount routes
app.use('/api/users', userRoutes); // User-related routes (e.g., register, login, profile)
app.use('/api/quizzes', quizRoutes); // Quiz-related routes (e.g., create, update, delete)
// app.use('/api/auth', authRoutes); // Authentication routes (e.g., login, logout)

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

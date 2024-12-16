const pool = require('../config/db'); // PostgreSQL connection

// Register a new user
exports.registerUser = async (req, res) => {
    const { name, email, password, role } = req.body; // Get role from request body

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Check if the email already exists
        const emailCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Set role to "user" if not provided
        const userRole = role || 'user';

        // Insert the user into the database
        const newUser = await pool.query(
            'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
            [name, email, password, userRole]
        );

        res.status(201).json({
            message: 'User registered successfully',
            user: newUser.rows[0],
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};
// Login user
exports.loginUser = async (req, res) => {
    const { email, password, role } = req.body; // Extract email, password, and role from the request body

    if (!email || !password || !role) {
        return res.status(400).json({ error: 'Email, password, and role are required' });
    }

    try {
        // Check if the user exists
        const userQuery = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userQuery.rows.length === 0) {
            return res.status(400).json({ error: 'User not found' });
        }

        const user = userQuery.rows[0];

        // Validate password
        if (user.password !== password) {
            return res.status(400).json({ error: 'Invalid password' });
        }

        // Validate role
        if (user.role !== role) {
            return res.status(403).json({ error: 'Access denied: Incorrect role' });
        }

        // Set session data
        req.session.userId = user.id;
        req.session.role = user.role;

        res.status(200).json({
            message: 'User logged in successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};
// Get user profile (only if logged in)
exports.getUserProfile = async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const user = await pool.query('SELECT * FROM users WHERE id = $1', [req.session.userId]);

        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            message: 'User profile fetched successfully',
            user: user.rows[0],
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// Logout user (destroy session)
exports.logoutUser = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to logout' });
        }
        res.status(200).json({ message: 'Logged out successfully' });
    });
};


exports.getUserResults = async (req, res) => {
    const { userId } = req.params; // Get user ID from URL parameters

    try {
        // Fetch all quiz results for the given user
        const result = await pool.query(
            `SELECT s.quiz_id, q.title AS quiz_title, s.score, s.total_questions, s.date_taken
            FROM submissions s
            JOIN quizzes q ON s.quiz_id = q.id
            WHERE s.user_id = $1`,
            [userId]  // Query parameter is the user ID
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No results found for this user' });
        }

        res.status(200).json(result.rows); // Return the results as JSON
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};






exports.getAllUserResults = async (req, res) => {
    try {
        // Query to fetch all user results
        const result = await pool.query(
            `SELECT 
                s.user_id,
                u.name AS user_name,
                u.email AS user_email,
                s.quiz_id,
                q.title AS quiz_title,
                s.score,
                s.total_questions,
                s.date_taken
            FROM 
                submissions s
            JOIN 
                users u ON s.user_id = u.id
            JOIN 
                quizzes q ON s.quiz_id = q.id
            ORDER BY 
                s.date_taken DESC`
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No results found' });
        }

        res.status(200).json(result.rows); // Return all user results
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

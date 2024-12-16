const pool = require('../config/db'); // PostgreSQL connection
// const quizModel = require('../models/quizModel'); // Import quiz model

// Create a new quiz (only for admin)
// exports.createQuiz = async (req, res) => {
//     const { title, description, timeLimit, startDate, endDate } = req.body;
//     const adminId = req.session.userId;

//     if (!adminId) {
//         return res.status(401).json({ error: 'Unauthorized: Admin login required' });
//     }

//     try {
//         // Call the createQuiz function from the quiz model
//         const newQuiz = await quizModel.createQuiz(title, description, timeLimit, startDate, endDate, adminId, true);
        
//         res.status(201).json({
//             message: 'Quiz created successfully',
//             quiz: newQuiz,
//         });
//     } catch (err) {
//         console.error(err.message);  // Log the error for debugging
//         res.status(500).json({ error: 'Server error' });
//     }
// };

// Get all quizzes (Admin/User)
exports.getQuizzes = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT q.id, q.title, q.description, COUNT(que.id) AS questions_count, u.name AS created_by, q.is_active, q.start_date, q.end_date, q.time_limit ' +
            'FROM quizzes q ' +
            'LEFT JOIN questions que ON q.id = que.quiz_id ' +
            'JOIN users u ON q.created_by = u.id ' +
            'GROUP BY q.id, u.name'
        );

        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err.message);  // Log the error for debugging
        res.status(500).json({ error: 'Server error' });
    }
};

// Get quiz details by quiz ID
exports.getQuizDetails = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `SELECT 
                q.id AS quiz_id,
                q.title,
                q.description,
                que.id AS question_id,
                que.question_text,
                que.type,
                que.correct_answer,
                JSON_AGG(JSON_BUILD_OBJECT('option_text', o.option_text, 'is_correct', o.is_correct)) AS options
             FROM quizzes q
             JOIN questions que ON q.id = que.quiz_id
             LEFT JOIN options o ON que.id = o.question_id
             WHERE q.id = $1
             GROUP BY q.id, que.id`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Quiz not found" });
        }

        const quiz = {
            quiz_id: result.rows[0].quiz_id,
            title: result.rows[0].title,
            description: result.rows[0].description,
            questions: result.rows.map(row => ({
                question_id: row.question_id,
                question_text: row.question_text,
                type: row.type,
                correct_answer: row.correct_answer, // null for multiple-select
                options: row.options
            }))
        };

        res.status(200).json(quiz);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
};


// Update quiz (only for admin)
exports.updateQuiz = async (req, res) => {
    const { id } = req.params; // Quiz ID from the URL
    const { title, description, timeLimit, startDate, endDate, isActive } = req.body; // Updated quiz details

    try {
        // Update the quiz in the database
        const result = await pool.query(
            `UPDATE quizzes 
             SET title = $1, description = $2, time_limit = $3, start_date = $4, end_date = $5, is_active = $6 
             WHERE id = $7 
             RETURNING *`,
            [title, description, timeLimit, startDate, endDate, isActive, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Quiz not found' });
        }

        res.status(200).json({
            message: 'Quiz updated successfully',
            quiz: result.rows[0],
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};


// Delete quiz (only for admin)
exports.deleteQuiz = async (req, res) => {
    const { id } = req.params; // Quiz ID from the URL

    try {
        // Delete the quiz from the database
        const result = await pool.query(
            `DELETE FROM quizzes 
             WHERE id = $1 
             RETURNING *`,
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Quiz not found' });
        }

        res.status(200).json({
            message: 'Quiz deleted successfully',
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};


// exports.addQuestionToQuiz = async (req, res) => {
//     const { id } = req.params; // Quiz ID from the URL
//     const { question_text, type, correct_answer, options } = req.body; // Question details from the request body

//     if (!question_text || !type || !correct_answer || !options || options.length < 2) {
//         return res.status(400).json({ error: 'All fields are required, and at least two options must be provided.' });
//     }

//     try {
//         // Insert the question into the questions table
//         const questionResult = await pool.query(
//             'INSERT INTO questions (quiz_id, question_text, type, correct_answer) VALUES ($1, $2, $3, $4) RETURNING *',
//             [id, question_text, type, correct_answer]
//         );

//         const questionId = questionResult.rows[0].id;

//         // Insert the options into the options table
//         const optionPromises = options.map((option) =>
//             pool.query('INSERT INTO options (question_id, option_text) VALUES ($1, $2)', [questionId, option])
//         );
//         await Promise.all(optionPromises);

//         res.status(201).json({
//             message: 'Question added successfully',
//             question: {
//                 id: questionId,
//                 quiz_id: id,
//                 question_text,
//                 type,
//                 correct_answer,
//                 options,
//             },
//         });
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).json({ error: 'Server error' });
//     }
// };


exports.submitQuiz = async (req, res) => {
    const { userId, quizId, score, totalQuestions } = req.body;

    // Validate request data
    if (!userId || !quizId || score === undefined || totalQuestions === undefined) {
        return res.status(400).json({ error: 'Missing required fields: userId, quizId, score, or totalQuestions' });
    }

    try {
        // Insert the result into the submissions table
        const result = await pool.query(
            `INSERT INTO submissions (user_id, quiz_id, score, total_questions) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [userId, quizId, score, totalQuestions]
        );

        res.status(201).json({
            message: 'Quiz submitted successfully!',
            submission: result.rows[0], // Return the stored submission
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while submitting the quiz' });
    }
};

// const pool = require('../config/db'); // PostgreSQL connection

exports.createQuizWithQuestions = async (req, res) => {
    const { adminId, title, description, startDate, endDate, timeLimit, questions } = req.body;

    // Validate input
    if (!adminId || !title || !description || !startDate || !endDate || !timeLimit || !questions || questions.length === 0) {
        return res.status(400).json({ error: "All fields including adminId and questions are required" });
    }

    try {
        // Check if the adminId belongs to a valid admin
        const admin = await pool.query('SELECT id FROM users WHERE id = $1 AND role = $2', [adminId, 'admin']);
        if (admin.rows.length === 0) {
            return res.status(403).json({ error: "Unauthorized: Admin ID is invalid" });
        }

        // Begin a transaction
        await pool.query('BEGIN');

        // Insert quiz data
        const quizResult = await pool.query(
            `INSERT INTO quizzes (title, description, start_date, end_date, time_limit, created_by, is_active) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [title, description, startDate, endDate, timeLimit, adminId, true]
        );

        const quizId = quizResult.rows[0].id;

        // Insert questions and options
        for (const question of questions) {
            const questionResult = await pool.query(
                `INSERT INTO questions (quiz_id, question_text, type, correct_answer) 
                 VALUES ($1, $2, $3, $4) RETURNING id`,
                [quizId, question.questionText, question.type, question.type === 'multiple-select' ? null : question.correctAnswer]
            );

            const questionId = questionResult.rows[0].id;

            // Insert options with "is_correct" for multiple-select or MCQ
            if (question.options && question.options.length > 0) {
                for (const option of question.options) {
                    await pool.query(
                        `INSERT INTO options (question_id, option_text, is_correct) 
                         VALUES ($1, $2, $3)`,
                        [questionId, option.optionText, option.isCorrect || false]
                    );
                }
            }
        }

        // Commit transaction
        await pool.query('COMMIT');

        res.status(201).json({ message: "Quiz created successfully with questions!", quizId });
    } catch (err) {
        console.error(err.message);
        await pool.query('ROLLBACK'); // Rollback transaction on error
        res.status(500).json({ error: "Server error while creating the quiz" });
    }
};



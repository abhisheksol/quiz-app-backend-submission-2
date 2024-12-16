const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Register a new user
router.post('/register', userController.registerUser);

// Login user
router.post('/login', userController.loginUser);

// Get user profile (requires login)
router.get('/profile', userController.getUserProfile);

// Logout user
router.post('/logout', userController.logoutUser);

router.get('/:userId/results', userController.getUserResults);

router.get('/results', userController.getAllUserResults);


module.exports = router;

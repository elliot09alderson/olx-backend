import express from 'express';
import { registerUser, loginUser } from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/users/register
router.post('/register', registerUser);

// POST /api/users/login
router.post('/login', loginUser);

// POST /api/users/logout
router.post('/logout', (req, res) => {
  res.clearCookie('auth-token');
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// GET /api/users/me - Get current user (protected route)
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

export default router;
import { authenticateToken } from './auth.js';

export const requireAdmin = async (req, res, next) => {
  // First authenticate the user
  await authenticateToken(req, res, (error) => {
    if (error) return;
    
    // Check if user has admin role
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    next();
  });
};
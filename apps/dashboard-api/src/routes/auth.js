const express = require('express');
const router = express.Router();
const authorization = require('../middlewares/authMiddleware');
const {
    register,
    login,
    changePassword,
    deleteAccount,
    sendOtp,
    verifyOtp,
    forgotPassword,
    resetPassword,
    logout,
    refreshToken,
    getMe
} = require('../controllers/auth.controller');


const { authLimiter } = require('../middlewares/auth_limiter');
const rateLimit = require('express-rate-limit');
const dashboardLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { error: "Dashboard usage limit exceeded. Slow down!" },
    skip: (req) => process.env.NODE_ENV === 'development',
});


// REGISTER ROUTE
router.post('/register', authLimiter, register);

// LOGIN ROUTE
router.post('/login', authLimiter, login);

// Apply more relaxed dashboard limiter to the rest
router.use(dashboardLimiter);

// CHANGE PASSWORD (Protected)
router.put('/change-password', authorization, changePassword);

// DELETE ACCOUNT (Protected - Danger Zone)
router.delete('/delete-account', authorization, deleteAccount);

// OTP (email verification)
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);

// PASSWORD RESET (FIX 5)
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// REFRESH & LOGOUT
router.post('/refresh-token', refreshToken);
router.post('/logout', authorization, logout);

// GET ME
router.get('/me', authorization, getMe);

module.exports = router;

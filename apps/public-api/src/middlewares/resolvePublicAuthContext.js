const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    req.authUser = null;

    if (req.keyRole === 'secret') {
        return next();
    }

    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    const token = authHeader.slice(7).trim();
    if (!token) return next();

    try {
        const decoded = jwt.verify(token, req.project.jwtSecret);
        req.authUser = {
            userId: decoded.userId || decoded._id || decoded.id,
            claims: decoded
        };
    } catch {
        req.authUser = null;
    }

    next();
};

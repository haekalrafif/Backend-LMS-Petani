const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = decoded.user;

            next();
        } catch (error) {
            console.error('Token verification error:', error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const isTeacher = (req, res, next) => {
    if (req.user && (req.user.role === 'teacher' || req.user.role === 'super admin')) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Teacher or Super Admin role required.' });
    }
};

const isSuperAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'super admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Super Admin role required.' });
    }
};

module.exports = { protect, isTeacher, isSuperAdmin };

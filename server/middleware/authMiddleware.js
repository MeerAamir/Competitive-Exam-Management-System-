const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'simple_secret_key_for_demo';

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: 'No token provided' });

    jwt.verify(token.split(' ')[1], SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Unauthorized' });
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    });
};

const verifyAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.userRole === 'admin') {
            next();
        } else {
            res.status(403).json({ error: 'Require Admin Role' });
        }
    });
};

module.exports = { verifyToken, verifyAdmin, SECRET_KEY };

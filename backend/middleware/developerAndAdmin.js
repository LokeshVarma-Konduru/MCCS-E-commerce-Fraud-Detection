// middleware/developerAndAdmin.js

const developerAndAdminMiddleware = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (req.user.role !== 'Developer' && req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Access denied: Developers and Admins only' });
    }
    
    next();
};

export default developerAndAdminMiddleware;


// middleware/storeManagerAndAdmin.js

const storeManagerAndAdminMiddleware = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (req.user.role !== 'StoreManager' && req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Access denied: Store Managers and Admins only' });
    }
    
    next();
};

export default storeManagerAndAdminMiddleware;


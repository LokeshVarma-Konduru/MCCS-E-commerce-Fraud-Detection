import Store from '../models/Store.js';
import Transaction from '../models/TransactionSchema.js';

// Get all stores
export const getAllStores = async (req, res) => {
    try {
        // Filter stores to only include those within US bounds (continental US only)
        // US bounds: lat 25.5-47.5, lng -124.5 to -66.5
        // Using $geoWithin with a bounding box for GeoJSON coordinates
        const stores = await Store.find({
            coordinates: {
                $geoWithin: {
                    $box: [
                        [-124.5, 25.5], // Southwest corner [lng, lat]
                        [-66.5, 47.5]   // Northeast corner [lng, lat]
                    ]
                }
            }
        }).populate('managerId', 'name email role');
        res.status(200).json({
            success: true,
            data: stores,
            count: stores.length
        });
    } catch (error) {
        console.error('Error fetching stores:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching stores',
            error: error.message
        });
    }
};

// Get store by ID
export const getStoreById = async (req, res) => {
    try {
        const { id } = req.params;
        const store = await Store.findById(id).populate('managerId', 'name email role');
        
        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'Store not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: store
        });
    } catch (error) {
        console.error('Error fetching store:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching store',
            error: error.message
        });
    }
};

// Get store by storeID
export const getStoreByStoreId = async (req, res) => {
    try {
        const { storeId } = req.params;
        const store = await Store.findOne({ storeID: storeId }).populate('managerId', 'name email role');
        
        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'Store not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: store
        });
    } catch (error) {
        console.error('Error fetching store:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching store',
            error: error.message
        });
    }
};

// Create new store
export const createStore = async (req, res) => {
    try {
        const {
            storeID,
            storeName,
            storeLocation,
            zipCode,
            coordinates,
            status,
            managerId,
            contactInfo
        } = req.body;

        // Check if store with same storeID already exists
        const existingStore = await Store.findOne({ storeID });
        if (existingStore) {
            return res.status(400).json({
                success: false,
                message: 'Store with this ID already exists'
            });
        }

        const store = new Store({
            storeID,
            storeName,
            storeLocation,
            zipCode,
            coordinates,
            status,
            managerId,
            contactInfo
        });

        await store.save();
        
        res.status(201).json({
            success: true,
            message: 'Store created successfully',
            data: store
        });
    } catch (error) {
        console.error('Error creating store:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating store',
            error: error.message
        });
    }
};

// Update store
export const updateStore = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const store = await Store.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('managerId', 'name email role');

        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'Store not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Store updated successfully',
            data: store
        });
    } catch (error) {
        console.error('Error updating store:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating store',
            error: error.message
        });
    }
};

// Delete store
export const deleteStore = async (req, res) => {
    try {
        const { id } = req.params;
        const store = await Store.findByIdAndDelete(id);

        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'Store not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Store deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting store:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting store',
            error: error.message
        });
    }
};

// Get stores by manager ID
export const getStoresByManager = async (req, res) => {
    try {
        const { managerId } = req.params;
        const stores = await Store.find({ managerId }).populate('managerId', 'name email role');
        
        res.status(200).json({
            success: true,
            data: stores,
            count: stores.length
        });
    } catch (error) {
        console.error('Error fetching stores by manager:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching stores by manager',
            error: error.message
        });
    }
};

// Get stores within a radius (geospatial query)
export const getStoresNearby = async (req, res) => {
    try {
        const { latitude, longitude, radius = 10 } = req.query; // radius in kilometers
        
        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required'
            });
        }

        const stores = await Store.find({
            coordinates: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    $maxDistance: radius * 1000 // Convert km to meters
                }
            }
        }).populate('managerId', 'name email role');

        res.status(200).json({
            success: true,
            data: stores,
            count: stores.length
        });
    } catch (error) {
        console.error('Error fetching nearby stores:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching nearby stores',
            error: error.message
        });
    }
};

// Get stores with fraud statistics
export const getStoresWithFraudStats = async (req, res) => {
    try {
        const { period = '30d' } = req.query;
        
        // Calculate date range based on period
        const endDate = new Date();
        let startDate = new Date();
        
        switch (period) {
            case '7d':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(startDate.getDate() - 30);
                break;
            case '90d':
                startDate.setDate(startDate.getDate() - 90);
                break;
            case '1y':
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            default:
                startDate.setDate(startDate.getDate() - 30);
        }
        
        // Get all stores within US bounds (continental US only)
        // US bounds: lat 25.5-47.5, lng -124.5 to -66.5
        // Using $geoWithin with a bounding box for GeoJSON coordinates
        const stores = await Store.find({
            coordinates: {
                $geoWithin: {
                    $box: [
                        [-124.5, 25.5], // Southwest corner [lng, lat]
                        [-66.5, 47.5]   // Northeast corner [lng, lat]
                    ]
                }
            }
        }).populate('managerId', 'name email role');
        
        // Get fraud statistics for each store
        const storesWithStats = await Promise.all(
            stores.map(async (store) => {
                try {
                    // Get transaction counts for this store
                    const totalTransactions = await Transaction.countDocuments({
                        $or: [
                            { storeRef: store._id },
                            { storeID: store.storeID }
                        ],
                        createdAt: { $gte: startDate, $lte: endDate }
                    });
                    
                    const fraudulentTransactions = await Transaction.countDocuments({
                        $or: [
                            { storeRef: store._id },
                            { storeID: store.storeID }
                        ],
                        predictions: { $in: [1] },
                        createdAt: { $gte: startDate, $lte: endDate }
                    });
                    
                    // Calculate fraud rate
                    const fraudRate = totalTransactions > 0 
                        ? (fraudulentTransactions / totalTransactions) * 100 
                        : 0;
                    
                    // Get total transaction amount for this store
                    const totalAmount = await Transaction.aggregate([
                        {
                            $match: {
                                $or: [
                                    { storeRef: store._id },
                                    { storeID: store.storeID }
                                ],
                                createdAt: { $gte: startDate, $lte: endDate }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                total: { $sum: '$transactionAmount' }
                            }
                        }
                    ]);
                    
                    const transactionVolume = totalAmount.length > 0 ? totalAmount[0].total : 0;
                    
                    // Get high-risk transactions (risk score > 70)
                    const highRiskTransactions = await Transaction.countDocuments({
                        $or: [
                            { storeRef: store._id },
                            { storeID: store.storeID }
                        ],
                        $or: [
                            { riskScore: { $gte: 70 } },
                            { 'probabilities.0.1': { $gte: 0.7 } }
                        ],
                        createdAt: { $gte: startDate, $lte: endDate }
                    });
                    
                    return {
                        ...store.toObject(),
                        fraudStats: {
                            totalTransactions,
                            fraudulentTransactions,
                            fraudRate: parseFloat(fraudRate.toFixed(2)),
                            transactionVolume,
                            highRiskTransactions,
                            period
                        }
                    };
                } catch (error) {
                    console.error(`Error getting stats for store ${store.storeID}:`, error);
                    return {
                        ...store.toObject(),
                        fraudStats: {
                            totalTransactions: 0,
                            fraudulentTransactions: 0,
                            fraudRate: 0,
                            transactionVolume: 0,
                            highRiskTransactions: 0,
                            period
                        }
                    };
                }
            })
        );
        
        res.status(200).json({
            success: true,
            data: storesWithStats,
            count: storesWithStats.length,
            period
        });
    } catch (error) {
        console.error('Error fetching stores with fraud stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching stores with fraud statistics',
            error: error.message
        });
    }
};
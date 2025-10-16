import Store from '../models/Store.js';

// Get all stores
export const getAllStores = async (req, res) => {
    try {
        const stores = await Store.find().populate('managerId', 'name email role');
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
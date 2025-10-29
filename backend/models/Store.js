import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema({
    storeID: { 
        type: String, 
        required: true, 
        unique: true 
    },
    storeName: { 
        type: String, 
        required: true 
    },
    storeLocation: { 
        type: String, 
        required: true 
    },
    zipCode: { 
        type: String, 
        required: true 
    },
    // Additional fields for map functionality - GeoJSON format
    coordinates: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    },
    // Store status
    status: {
        type: String,
        enum: ['active', 'inactive', 'maintenance'],
        default: 'active'
    },
    // Store manager assigned to this store
    managerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Not all stores need to have a manager assigned
    },
    // Store contact information
    contactInfo: {
        phone: String,
        email: String
    }
}, {
    timestamps: true
});

// Index for efficient queries
storeSchema.index({ storeID: 1 });
storeSchema.index({ coordinates: '2dsphere' }); // For geospatial queries
storeSchema.index({ zipCode: 1 });

export default mongoose.model('Store', storeSchema);
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
    // Additional fields for map functionality
    coordinates: {
        latitude: { 
            type: Number, 
            required: true 
        },
        longitude: { 
            type: Number, 
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
// storeID index is automatically created by unique: true above
storeSchema.index({ coordinates: '2dsphere' }); // For geospatial queries
storeSchema.index({ zipCode: 1 });

export default mongoose.model('Store', storeSchema);
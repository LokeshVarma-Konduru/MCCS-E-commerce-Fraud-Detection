import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
    transactionId: { 
        type: String, 
        required: true,
        unique: true 
    },
    customerId: { 
        type: String, 
        required: true 
    },
    transactionAmount: { 
        type: Number, 
        required: true 
    },
    transactionDate: { 
        type: Date, 
        required: true 
    },
    paymentMethod: { 
        type: String, 
        required: true 
    },
    productCategory: { 
        type: String, 
        required: true 
    },
    quantity: { 
        type: Number, 
        required: true 
    },
    customerAge: { 
        type: Number, 
        required: true 
    },
    customerLocation: { 
        type: String, 
        required: true 
    },
    deviceUsed: { 
        type: String, 
        required: true 
    },
    ipAddress: { 
        type: String, 
        required: true 
    },
    shippingAddress: { 
        type: String, 
        required: true 
    },
    billingAddress: { 
        type: String, 
        required: true 
    },
    accountAgeDays: { 
        type: Number, 
        required: true 
    },
    transactionHour: { 
        type: Number, 
        required: true,
        min: 0,
        max: 23
    },
    isFraudulent: { 
        type: Boolean,
        default: null 
    },
    predictionScore: {
        type: Number,
        min: 0,
        max: 1
    },
    predictedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Index for faster queries
TransactionSchema.index({ transactionId: 1 });
TransactionSchema.index({ customerId: 1 });
TransactionSchema.index({ transactionDate: -1 });

export default mongoose.model('Transaction', TransactionSchema);

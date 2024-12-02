import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { 
        type: String, 
        required: true,
        enum: ["Admin", "Developer"],
    },
    status: {
        type: Boolean,
        default: true
    },
    otp: { type: String },
    otpExpiresAt: { type: Date },
},
{ timestamps: true }
);

export default mongoose.model('User', userSchema);

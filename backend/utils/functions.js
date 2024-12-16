import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

//Send Email function
export const sendMail = async (to, subject, message) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail', 
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text: message,
    };

    return transporter.sendMail(mailOptions);
};

// generateOTP
export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Generates a 6-digit OTP
};


export default sendMail;

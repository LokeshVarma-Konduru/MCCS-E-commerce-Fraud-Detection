import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

//Send Email function
export const sendMail = async (to, subject, message, attachments = []) => {
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
        attachments: attachments
    };

    return transporter.sendMail(mailOptions);
};

// Send Email with PDF attachment from base64 data
export const sendMailWithPdfAttachment = async (to, subject, message, pdfData, filename = 'report.pdf', userName = '', userRole = '') => {
    // Create attachment from base64 data
    const attachments = [
        {
            filename: filename,
            content: Buffer.from(pdfData, 'base64'),
            contentType: 'application/pdf'
        }
    ];
    
    // Create a professional HTML email template
    const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    // Format user information if provided
    const userInfo = userName ? 
        `<p style="margin: 0;">Prepared for: <strong>${userName}</strong>${userRole ? ` (${userRole})` : ''}</p>` : '';
    
    const htmlMessage = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2563eb; padding: 20px; color: white; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb; }
            .footer { font-size: 12px; color: #6b7280; text-align: center; margin-top: 20px; }
            .button { display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>MCCS Fraud Detection System</h2>
            </div>
            <div class="content">
                <p>Hello,</p>
                <p>${message}</p>
                ${userInfo}
                <p>Date: ${currentDate}</p>
                <p>Please find the requested report attached to this email. This report contains confidential information about fraud detection metrics and insights.</p>
                <p>If you have any questions regarding this report, please don't hesitate to contact our support team.</p>
                <p>Thank you for using MCCS Fraud Detection System.</p>
                <p>Best regards,<br>MCCS Support Team</p>
            </div>
            <div class="footer">
                <p>This is an automated message. Please do not reply directly to this email.</p>
                <p>&copy; ${new Date().getFullYear()} MCCS Fraud Detection. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
    
    // Use the original sendMail function but with HTML content
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text: message, // Plain text version as fallback
        html: htmlMessage, // HTML version
        attachments: attachments
    };
    
    // Create transporter directly to use HTML content
    const transporter = nodemailer.createTransport({
        service: 'gmail', 
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
    
    return transporter.sendMail(mailOptions);
};

// generateOTP
export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Generates a 6-digit OTP
};


export default sendMail;

import { sendMailWithPdfAttachment } from '../utils/functions.js';

/**
 * Send a report via email with PDF attachment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const sendReportEmail = async (req, res) => {
    try {
        const { email, subject, message, pdfData, filename, userName, userRole } = req.body;
        
        // Validate required fields
        if (!email || !pdfData) {
            return res.status(400).json({
                success: false,
                message: 'Email and PDF data are required'
            });
        }

        // Set default values for optional fields
        const emailSubject = subject || 'MCCS Fraud Detection Report';
        const emailMessage = message || 'Please find attached your fraud detection report.';
        const reportFilename = filename || 'fraud-detection-report.pdf';
        const recipientName = userName || ''; // Optional user name
        const recipientRole = userRole || ''; // Optional user role

        // Send email with PDF attachment including user info if provided
        await sendMailWithPdfAttachment(
            email, 
            emailSubject, 
            emailMessage, 
            pdfData, 
            reportFilename,
            recipientName,
            recipientRole
        );

        return res.status(200).json({
            success: true,
            message: 'Report email sent successfully'
        });
    } catch (error) {
        console.error('Error sending report email:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to send report email',
            error: error.message
        });
    }
};

export default {
    sendReportEmail
};

const nodemailer = require('nodemailer');
require('dotenv').config({ path: '../.env' });

// Create a reusable transporter using Gmail
// It requires EMAIL_PASS (App Password) to be set in .env
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.OWNER_EMAIL || 'utkarshvardhansinha.dev@gmail.com',
        pass: process.env.EMAIL_PASS // The 16-character Google App Password
    }
});

const sendOtpEmail = async (toEmail, otp) => {
    try {
        const mailOptions = {
            from: `"NIT Club Compass" <${process.env.OWNER_EMAIL || 'utkarshvardhansinha.dev@gmail.com'}>`,
            to: toEmail,
            subject: 'Your One-Time Password (OTP) - NIT Club Compass',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #6366f1; text-align: center;">NIT Club Compass</h2>
                    <p style="font-size: 16px;">Hello,</p>
                    <p style="font-size: 16px;">Your One-Time Password (OTP) is:</p>
                    <div style="text-align: center; margin: 20px 0;">
                        <span style="font-size: 24px; font-weight: bold; background-color: #f3f4f6; padding: 10px 20px; border-radius: 5px; letter-spacing: 2px;">
                            ${otp}
                        </span>
                    </div>
                    <p style="font-size: 14px; color: #555;">This OTP is valid for the next 15 minutes. Please do not share it with anyone.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #aaa; text-align: center;">If you didn't request this, you can safely ignore this email.</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[MAILER] OTP sent to ${toEmail}: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`[MAILER ERROR] Failed to send email to ${toEmail}:`, error.message);
        return false;
    }
};

module.exports = {
    sendOtpEmail
};

import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

export const sendSMS = async (to, body) => {
    try {
        const message = await client.messages.create({
            body,
            from: process.env.TWILIO_PHONE,
            to
        });
        console.log(`SMS sent: ${message.sid}`);
        return message;
    } catch (error) {
        console.error('Failed to send SMS:', error.message);
        throw error;
    }
};

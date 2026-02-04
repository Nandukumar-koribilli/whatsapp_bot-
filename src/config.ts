import dotenv from 'dotenv';
dotenv.config();

export const config = {
    openaiApiKey: process.env.OPENAI_API_KEY,
    triggerKeyword: process.env.BOT_TRIGGER_KEYWORD || '',
    allowedContacts: process.env.ALLOWED_CONTACTS ? process.env.ALLOWED_CONTACTS.split(',') : [],
};

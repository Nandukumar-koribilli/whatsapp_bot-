import dotenv from 'dotenv';
dotenv.config();

export type AIProvider = 'mistral' | 'gemini' | 'assemblyai';

export const config = {
    // AI Provider Selection
    selectedAIProvider: (process.env.SELECTED_AI_PROVIDER || 'mistral') as AIProvider,

    // API Keys
    mistralApiKey: process.env.MISTRAL_API_KEY,
    geminiApiKey: process.env.GEMINI_API_KEY,
    assemblyaiApiKey: process.env.ASSEMBLYAI_API_KEY,

    // Bot Settings
    triggerKeyword: process.env.BOT_TRIGGER_KEYWORD || '',
    allowedContacts: process.env.ALLOWED_CONTACTS ? process.env.ALLOWED_CONTACTS.split(',') : [],
    blockedContacts: process.env.BLOCKED_CONTACTS ? process.env.BLOCKED_CONTACTS.split(',') : [],
    specialContact: (process.env.SPECIAL_CONTACT || '917095191249').replace(/\s/g, '').replace('+', ''),
};

// Runtime mutable state for AI provider (can be changed without restart)
export let runtimeAIProvider: AIProvider = config.selectedAIProvider;

export function setRuntimeAIProvider(provider: AIProvider) {
    runtimeAIProvider = provider;
}

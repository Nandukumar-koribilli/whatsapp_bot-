import dotenv from 'dotenv';
dotenv.config();

export type AIProvider = 'mistral' | 'nvidia';

export const config = {
    // AI Provider Selection
    selectedAIProvider: (process.env.SELECTED_AI_PROVIDER || 'mistral') as AIProvider,

    // API Keys
    mistralApiKey: process.env.MISTRAL_API_KEY,
    nvidiaApiKey: process.env.NVIDIA_API_KEY,

    // Bot Settings
    triggerKeyword: process.env.BOT_TRIGGER_KEYWORD || '',
    allowedContacts: process.env.ALLOWED_CONTACTS ? process.env.ALLOWED_CONTACTS.split(',') : [],
    blockedContacts: process.env.BLOCKED_CONTACTS ? process.env.BLOCKED_CONTACTS.split(',') : [],
};

// Runtime mutable state (can be changed without restart)
export let runtimeAIProvider: AIProvider = config.selectedAIProvider;
export let isBotActive = true;

export function setRuntimeAIProvider(provider: AIProvider) {
    runtimeAIProvider = provider;
}

export function setIsBotActive(active: boolean) {
    isBotActive = active;
}

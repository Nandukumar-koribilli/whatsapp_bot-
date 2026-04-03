import OpenAI from 'openai';
import { config, runtimeAIProvider, AIProvider } from './config';

// AI Provider configurations
const AI_PROVIDERS: Record<AIProvider, { apiKey: string | undefined, baseURL: string, model: string }> = {
    mistral: {
        apiKey: config.mistralApiKey,
        baseURL: 'https://api.mistral.ai/v1',
        model: 'mistral-small-latest'
    },
    nvidia: {
        apiKey: config.nvidiaApiKey,
        baseURL: 'https://integrate.api.nvidia.com/v1',
        model: 'nvidia/llama-3.1-nemotron-nano-8b-v1'
    },

};

function isLikelyEnglish(messageBody: string): boolean {
    const letters = messageBody.match(/[a-zA-Z]/g)?.length || 0;
    const words = messageBody.trim().split(/\s+/).filter(Boolean).length || 1;
    const teluguRomanizedHints = /(nuvvu|nenu|meeru|em|enti|ela|enduku|avunu|ledu|ippudu|chala|baga|bagunnava|undi|unna|chestunna|chesta|chesanu|ra|le|maa|naa|neeku|naku|raadu|poyy|vastu|vach|unt|vunn|ante)/i;

    if (teluguRomanizedHints.test(messageBody)) {
        return false;
    }

    return letters / words > 3;
}

function buildPrompt(messageBody: string): string {
    if (isLikelyEnglish(messageBody)) {
        return `
You are a friendly WhatsApp chat buddy.
Reply in natural English only.

Rules:
- Keep it short, human, and casual.
- Do not mention the chat history.
- Do not say "you said", "as you said", or "Nandu:".
- Do not translate the user's message or explain language choices.
- Do not sound formal or robotic.
- Match the user's tone, but stay in English.
- If the user asks who you are or what your name is, reply: "I am Nandu."
`;
    }

    return `
You are a friendly WhatsApp chat buddy.
Reply in natural Telugu written in English script only.

Rules:
- Keep it short, human, and casual.
- Do not mention the chat history.
- Do not say "you said", "as you said", or "Nandu:".
- Do not translate the user's message or explain language choices.
- Do not use Tamil words, Tamil-style slang, or mixed language.
- Use Telugu-in-English words like: nuvvu, nenu, em, enti, ela, enduku, avunu, ledu, ippudu, chala, baga, bagunnava, undi, unna, chestunna, chesanu, ra, raa, le, naku, neeku, meeru.
- Avoid words like: enna, iruka, pannra, poraa, adhu, illa, macha.
- Sound like a real person chatting, not like an assistant.
- If the user asks who you are or what your name is, reply: "I am Nandu."
`;
}

function getAIClient(): { client: OpenAI, model: string } {
    const providerConfig = AI_PROVIDERS[runtimeAIProvider];
    if (!providerConfig) {
        throw new Error(`Unsupported AI provider: ${runtimeAIProvider}`);
    }
    if (!providerConfig.apiKey) {
        throw new Error(`Missing API key for AI provider: ${runtimeAIProvider}`);
    }
    const client = new OpenAI({
        apiKey: providerConfig.apiKey,
        baseURL: providerConfig.baseURL,
    });
    return { client, model: providerConfig.model };
}

export async function generateSmartReply(messageBody: string, senderName: string, chatHistory: { role: 'user' | 'assistant', content: string }[] = [], senderNumber: string = ""): Promise<string> {
    const { client, model } = getAIClient();

    const selectedPrompt = buildPrompt(messageBody);

    try {
        const historyForAi = chatHistory.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        historyForAi.push({ role: "user", content: messageBody });

        console.log(`🧠 Using AI: ${runtimeAIProvider} (${model})`);

        const completion = await client.chat.completions.create({
            messages: [
                { role: "system", content: selectedPrompt },
                ...historyForAi
            ],
            model: model,
            temperature: 0.45,
            max_tokens: 150,
        });

        return completion.choices[0]?.message?.content || "Sorry, I can't think of a reply (AI Error).";
    } catch (error: any) {
        console.error(`AI Error (${runtimeAIProvider}):`, error?.message || error);
        return runtimeAIProvider === 'nvidia'
            ? "Sorry, I couldn't reach the NVIDIA model right now."
            : "Sorry, I'm having trouble connecting to my brain right now.";
    }
}

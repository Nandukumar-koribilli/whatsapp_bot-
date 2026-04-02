import OpenAI from 'openai';
import { config, runtimeAIProvider, AIProvider } from './config';

// AI Provider configurations
const AI_PROVIDERS: Record<AIProvider, { apiKey: string | undefined, baseURL: string, model: string }> = {
    mistral: {
        apiKey: config.mistralApiKey,
        baseURL: 'https://api.mistral.ai/v1',
        model: 'mistral-small-latest'
    },

};

function getAIClient(): { client: OpenAI, model: string } {
    const providerConfig = AI_PROVIDERS[runtimeAIProvider];
    const client = new OpenAI({
        apiKey: providerConfig.apiKey,
        baseURL: providerConfig.baseURL,
    });
    return { client, model: providerConfig.model };
}

const GENERAL_PROMPT = `
You are "Nandu", a friendly and casual guy on WhatsApp.
Your goal is to reply to messages naturally, as yourself.

**STRICT RULES FOR HUMAN-LIKE CHAT:**
- **NO REPETITION:** Never ask the same question twice.
- **FOLLOW INSTRUCTIONS:** If the user says "stop" or is annoyed, change the topic.
- **LANGUAGE:** Mostly **Tanglish** (Telugu in English script). If they write in English, reply in English.
- **TONE:** Casual, brief, and real. Don't be an "assistant". Just be Nandu.
- **VARIETY:** Use different phrases for "Hi", "Ok", and "Whassup".
`;



export async function generateSmartReply(messageBody: string, senderName: string, chatHistory: { role: 'user' | 'assistant', content: string }[] = [], senderNumber: string = ""): Promise<string> {
    const { client, model } = getAIClient();

    // Use the same prompt for everyone
    const selectedPrompt = GENERAL_PROMPT;

    try {
        const historyForAi = chatHistory.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        historyForAi.push({ role: "user", content: `(From ${senderName}): ${messageBody}` });

        console.log(`🧠 Using AI: ${runtimeAIProvider} (${model})`);

        const completion = await client.chat.completions.create({
            messages: [
                { role: "system", content: selectedPrompt },
                ...historyForAi
            ],
            model: model,
            temperature: 0.8,
            max_tokens: 150,
        });

        return completion.choices[0]?.message?.content || "Sorry, I can't think of a reply (AI Error).";
    } catch (error: any) {
        console.error(`AI Error (${runtimeAIProvider}):`, error.message || error);
        return "Sorry, I'm having trouble connecting to my brain right now.";
    }
}

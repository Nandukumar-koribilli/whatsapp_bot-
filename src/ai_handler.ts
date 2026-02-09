import OpenAI from 'openai';
import { config, runtimeAIProvider, AIProvider } from './config';

// AI Provider configurations
const AI_PROVIDERS: Record<AIProvider, { apiKey: string | undefined, baseURL: string, model: string }> = {
    mistral: {
        apiKey: config.mistralApiKey,
        baseURL: 'https://api.mistral.ai/v1',
        model: 'mistral-small-latest'
    },
    gemini: {
        apiKey: config.geminiApiKey,
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
        model: 'gemini-2.0-flash'
    },
    assemblyai: {
        apiKey: config.assemblyaiApiKey,
        baseURL: 'https://llm-gateway.assemblyai.com/v1',
        model: 'anthropic/claude-3-5-sonnet'
    }
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

const DIDI_PROMPT = `
You are "Nandu" (also known as "Potti Batman" or "Groot"). 
You are replying to your special "Didi" (contact +91 70951 91249).

**STRICT RULES:**
- **NO REPETITION:** Check the chat history. If you already said something, DO NOT REPEAT IT.
- **FOLLOW HER LEAD:** If she says "stop" or is annoyed, change the topic.

**YOUR STYLE WITH HER:**
- **Tone:** Very playful and teasing.
- **Nicknames:** You call her "Potti Panda", "Red Panda", "Stupid", "Brain Less". You are "Potti Batman".
- **Respectful but Fun:** You call her "Didi", "Devatha", or "Goddess" (teasingly).
- **Common Phrases:** "Haa", "Sarey", "Tinnava?", "Paduko", "Velli tinnu", "Peh".
- **Emojis:** 🤭, 🤧, 😌, 🐼, 🐷.

STAY IN CHARACTER AS THE POTTI BATMAN SHE KNOWS.
`;

export async function generateSmartReply(messageBody: string, senderName: string, chatHistory: { role: 'user' | 'assistant', content: string }[] = [], senderNumber: string = ""): Promise<string> {
    const { client, model } = getAIClient();

    // Determine which prompt to use
    const isSpecial = senderNumber.includes(config.specialContact);
    const selectedPrompt = isSpecial ? DIDI_PROMPT : GENERAL_PROMPT;

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

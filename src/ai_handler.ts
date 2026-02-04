import OpenAI from 'openai';
import { config } from './config';

if (!config.openaiApiKey) {
    console.warn("⚠️ No OPENAI_API_KEY found in .env. AI features will not work.");
}

const openai = new OpenAI({
    apiKey: config.openaiApiKey,
    baseURL: 'https://api.mistral.ai/v1', // Mistral API Endpoint
});

const SYSTEM_PROMPT = `
You are a helpful, casual, and human-like assistant acting as the user on WhatsApp.
Your goal is to reply to messages naturally, as if the actual user were replying.
- Be concise and informal (use "lol", "u", "thx" if appropriate for the context, but don't overdo it).
- Do not sound like a robot or a customer support agent.
- If you don't know the answer, just say you'll check later.
- Avoid long paragraphs. Keep it to one or two short sentences or a few bullets.
`;

export async function generateSmartReply(messageBody: string, senderName: string): Promise<string> {
    if (!config.openaiApiKey) return "Error: AI not configured.";

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: `Reply to this message from ${senderName}: "${messageBody}"` }
            ],
            model: "mistral-small-latest", // Switching to Mistral Model
        });

        return completion.choices[0]?.message?.content || "Sorry, I can't think of a reply (AI Error).";
    } catch (error) {
        console.error("OpenAI Error:", error);
        return "Sorry, I'm having trouble connecting to my brain right now.";
    }
}

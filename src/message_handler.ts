import { Client, Message } from 'whatsapp-web.js';
import { config, isBotActive } from './config';
import { generateSmartReply } from './ai_handler';

export async function handleIncomingMessage(message: Message, client: Client) {
    try {
        // 1. Validations
        if (message.fromMe) return;

        // Check if bot is turned off
        if (!isBotActive) {
            // console.log("   -> Bot is currently OFF/MUTED. Ignoring message.");
            return;
        }

        if (message.isStatus) {
            console.log("   -> Ignoring status update.");
            return;
        }

        if (message.from.includes('newsletter')) {
            console.log("   -> Ignoring newsletter.");
            return;
        }

        const chat = await message.getChat();

        if (chat.isGroup) {
            console.log(`   -> Ignoring group message from ${chat.name}`);
            return;
        }

        if (config.triggerKeyword && !message.body.toLowerCase().includes(config.triggerKeyword.toLowerCase())) {
            console.log("   -> Ignoring: Missing trigger keyword.");
            return;
        }

        const senderNumber = message.from.replace('@c.us', '');

        // CHECK BLOCKED CONTACTS
        if (config.blockedContacts.length > 0) {
            const isBlocked = config.blockedContacts.some(contact => message.from.includes(contact.trim()));
            if (isBlocked) {
                console.log(`   -> Ignoring: Contact ${senderNumber} is BLOCKED.`);
                return;
            }
        }

        if (config.allowedContacts.length > 0) {
            const isAllowed = config.allowedContacts.some(contact => message.from.includes(contact));
            if (!isAllowed) {
                console.log(`Ignoring message from unauthorized contact: ${senderNumber}`);
                return;
            }
        }

        console.log(`📩 Received message from ${senderNumber}: ${message.body}`);

        // 2. Generate AI Reply
        const contact = await message.getContact();
        const senderName = contact.pushname || contact.name || "Friend";

        await chat.sendStateTyping();

        // Fetch last 20 messages for context
        const historyMessages = await chat.fetchMessages({ limit: 20 });
        const chatHistory = historyMessages.map(msg => ({
            role: msg.fromMe ? 'assistant' as const : 'user' as const,
            content: msg.body
        }));
        if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].content === message.body) {
            chatHistory.pop();
        }

        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

        const aiResponse = await generateSmartReply(message.body, senderName, chatHistory, senderNumber);

        // 3. Send Reply
        await message.reply(aiResponse);
        console.log(`🤖 Replied to ${senderNumber}: ${aiResponse}`);

    } catch (error) {
        console.error("Error handling message:", error);
    }
}

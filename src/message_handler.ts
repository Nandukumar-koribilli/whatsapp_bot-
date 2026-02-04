import { Client, Message } from 'whatsapp-web.js';
import { config } from './config';
import { generateSmartReply } from './ai_handler';

export async function handleIncomingMessage(message: Message, client: Client) {
    try {
        // 1. Validations
        // Ignore messages sent by the bot itself (to prevent loops)
        if (message.fromMe) return;

        // Ignore status updates
        if (message.isStatus) {
            console.log("   -> Ignoring status update.");
            return;
        }

        // Ignore newsletters/channels (prevents crashes)
        if (message.from.includes('newsletter')) {
            console.log("   -> Ignoring newsletter.");
            return;
        }

        const chat = await message.getChat();

        // Ignore Group Chats
        if (chat.isGroup) {
            console.log(`   -> Ignoring group message from ${chat.name}`);
            return;
        }

        // Check for specific trigger keyword if set
        if (config.triggerKeyword && !message.body.toLowerCase().includes(config.triggerKeyword.toLowerCase())) {
            console.log("   -> Ignoring: Missing trigger keyword.");
            return;
        }

        // Check for allowed contacts if set
        const senderNumber = message.from.replace('@c.us', ''); // clean number
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

        // Simulating "typing" state for realism
        await chat.sendStateTyping();

        // Delay slightly for realism (1-3 seconds)
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

        const aiResponse = await generateSmartReply(message.body, senderName);

        // 3. Send Reply
        await message.reply(aiResponse);
        console.log(`🤖 Replied to ${senderNumber}: ${aiResponse}`);

    } catch (error) {
        console.error("Error handling message:", error);
    }
}

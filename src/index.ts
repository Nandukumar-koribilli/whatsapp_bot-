import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { handleIncomingMessage } from './message_handler';

console.log("🚀 Starting WhatsApp Bot...");

// Initialize Client
const client = new Client({
    authStrategy: new LocalAuth(), // Saves session so you don't scan QR every time
    puppeteer: {
        args: ['--no-sandbox'],
    }
});

// Event: QR Code Received
client.on('qr', (qr) => {
    console.log('📱 QR RECEIVED! Scan this with your WhatsApp app:');
    qrcode.generate(qr, { small: true });
});

// Event: Client Ready
client.on('ready', () => {
    console.log('✅ Client is ready! Bot is now online and listening.');
});

// Event: Message Received
client.on('message_create', async (message) => {
    // message_create captures own messages too, 'message' event only captures others.
    // We use message_create to potentially log everything, but handleIncomingMessage filters fromMe.
    await handleIncomingMessage(message, client);
});

// Start the client
client.initialize();

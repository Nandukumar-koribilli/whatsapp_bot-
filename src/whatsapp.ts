import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { handleIncomingMessage } from './message_handler';
import { getIO } from './server';
import fs from 'fs';
import path from 'path';

let whatsappClient: Client | null = null;
let connectionStatus: 'disconnected' | 'qr' | 'connecting' | 'connected' = 'disconnected';
let currentQR: string | null = null;

// Store recent messages for UI
interface ChatMessage {
    id: string;
    from: string;
    to: string;
    body: string;
    fromMe: boolean;
    timestamp: number;
}
const recentMessages: ChatMessage[] = [];

export interface ChatSummary {
    id: string;
    name: string;
    lastMessage: string;
    timestamp: number;
    unreadCount: number;
    isGroup: boolean;
}

export interface ChatHistoryMessage {
    id: string;
    body: string;
    from: string;
    to: string;
    fromMe: boolean;
    timestamp: number;
}

export function getWhatsAppStatus() {
    return { status: connectionStatus, qr: currentQR };
}

export function getRecentMessages() {
    return recentMessages;
}

export async function getWhatsAppChats(): Promise<ChatSummary[]> {
    if (!whatsappClient) {
        return [];
    }

    const chats = await whatsappClient.getChats();
    return chats.map((chat) => ({
        id: chat.id._serialized,
        name: chat.name || chat.id.user || chat.id._serialized,
        lastMessage: chat.lastMessage?.body || 'No messages yet',
        timestamp: chat.lastMessage?.timestamp ? chat.lastMessage.timestamp * 1000 : 0,
        unreadCount: chat.unreadCount || 0,
        isGroup: chat.isGroup,
    }));
}

export async function getWhatsAppChatMessages(chatId: string, limit = 50): Promise<ChatHistoryMessage[]> {
    if (!whatsappClient) {
        return [];
    }

    const chat = await whatsappClient.getChatById(chatId);
    const messages = await chat.fetchMessages({ limit });

    return messages.map((message: Message) => ({
        id: message.id._serialized,
        body: message.body,
        from: message.from.replace('@c.us', '').replace('@g.us', ''),
        to: message.to?.replace('@c.us', '').replace('@g.us', '') || '',
        fromMe: message.fromMe,
        timestamp: message.timestamp * 1000,
    }));
}

export async function sendWhatsAppMessage(chatId: string, body: string): Promise<ChatHistoryMessage | null> {
    if (!whatsappClient) {
        throw new Error('WhatsApp client is not connected');
    }

    const chat = await whatsappClient.getChatById(chatId);
    const sentMessage = await chat.sendMessage(body);

    return {
        id: sentMessage.id._serialized,
        body: sentMessage.body,
        from: sentMessage.from.replace('@c.us', '').replace('@g.us', ''),
        to: sentMessage.to?.replace('@c.us', '').replace('@g.us', '') || '',
        fromMe: sentMessage.fromMe,
        timestamp: sentMessage.timestamp * 1000,
    };
}

export async function startWhatsApp() {
    console.log("🚀 Starting WhatsApp Client...");
    connectionStatus = 'connecting';

    const userDataDir = path.join(__dirname, '../.wwebjs_auth/session');

    // Check if the browser is already running and terminate it
    if (fs.existsSync(userDataDir)) {
        try {
            console.log('🔍 Checking for existing browser session...');
            const lockFile = path.join(userDataDir, 'SingletonLock');
            if (fs.existsSync(lockFile)) {
                console.log('❌ Existing browser session detected. Cleaning up...');
                fs.rmSync(userDataDir, { recursive: true, force: true });
                console.log('✅ Cleaned up existing browser session.');
            }
        } catch (err) {
            console.error('❌ Failed to clean up existing browser session:', err);
        }
    }

    whatsappClient = new Client({
        authStrategy: new LocalAuth({ dataPath: userDataDir }),
        puppeteer: {
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
            headless: true,
        },
        webVersionCache: {
            type: 'remote',
            remotePath: 'https://raw.githubusercontent.com/nicpottier/nicpottier.github.io/refs/heads/main/nicpottier/nicpottier.github.io/nicpottier/nicpottier.github.io/nicpottier/nicpottier.github.io/nicpottier/nicpottier.github.io/nicpottier/nicpottier.github.io/nicpottier/nicpottier.github.io/nicpottier/',
        },
    });

    whatsappClient.on('qr', (qr) => {
        console.log('📱 QR RECEIVED! Scan with WhatsApp:');
        qrcode.generate(qr, { small: true });
        currentQR = qr;
        connectionStatus = 'qr';
        getIO()?.emit('whatsapp-qr', qr);
        getIO()?.emit('whatsapp-status', connectionStatus);
    });

    whatsappClient.on('ready', () => {
        console.log('✅ WhatsApp Client is ready!');
        currentQR = null;
        connectionStatus = 'connected';
        getIO()?.emit('whatsapp-status', connectionStatus);
    });

    whatsappClient.on('message_ack', (msg, ack) => {
        // ACK values: -1 = Message not sent, 0 = Message sent, 1 = Message delivered, 2 = Message read
        const ackStatus = ['Message not sent', 'Message sent', 'Message delivered', 'Message read'];
        console.log(`📩 Message status: ${ackStatus[ack] || 'Unknown'} for message ID: ${msg.id._serialized}`);
    });

    whatsappClient.on('disconnected', () => {
        console.log('❌ WhatsApp disconnected');
        connectionStatus = 'disconnected';
        currentQR = null;
        getIO()?.emit('whatsapp-status', connectionStatus);
    });

    whatsappClient.on('error', (error) => {
        console.error('❌ WhatsApp Client Error:', error);
        connectionStatus = 'disconnected';
        getIO()?.emit('whatsapp-status', connectionStatus);
    });

    whatsappClient.on('message_create', async (message: Message) => {
        try {
            // Store message for UI
            const msgData: ChatMessage = {
                id: message.id._serialized,
                from: message.from.replace('@c.us', ''),
                to: message.to?.replace('@c.us', '') || '',
                body: message.body,
                fromMe: message.fromMe,
                timestamp: message.timestamp * 1000
            };
            recentMessages.push(msgData);
            if (recentMessages.length > 50) recentMessages.shift();
            getIO()?.emit('whatsapp-message', msgData);

            // Handle incoming
            await handleIncomingMessage(message, whatsappClient!);
        } catch (err) {
            console.error('❌ Error handling incoming message:', err);
        }
    });

    try {
        await whatsappClient.initialize();
    } catch (err) {
        console.error('❌ WhatsApp initialization failed:', err);
        console.log('🔄 Retrying in 5 seconds...');
        connectionStatus = 'disconnected';
        getIO()?.emit('whatsapp-status', connectionStatus);
        setTimeout(() => startWhatsApp(), 5000);
    }
}

export async function logoutWhatsApp() {
    if (whatsappClient) {
        try {
            await whatsappClient.logout();
            await whatsappClient.destroy();
        } catch (e) {
            console.log('WhatsApp logout error:', e);
        }
        whatsappClient = null;
    }

    // Clear session files
    const sessionPath = path.join(process.cwd(), '.wwebjs_auth');
    if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true });
    }

    connectionStatus = 'disconnected';
    currentQR = null;
    recentMessages.length = 0;
    getIO()?.emit('whatsapp-status', connectionStatus);

    console.log('🔄 WhatsApp logged out. Restarting...');

    // Restart client
    setTimeout(() => startWhatsApp(), 1000);
}

export function getWhatsAppClient() {
    return whatsappClient;
}

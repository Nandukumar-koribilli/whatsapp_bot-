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

export function getWhatsAppStatus() {
    return { status: connectionStatus, qr: currentQR };
}

export function getRecentMessages() {
    return recentMessages;
}

export async function startWhatsApp() {
    console.log("🚀 Starting WhatsApp Client...");
    connectionStatus = 'connecting';

    whatsappClient = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
            headless: true,
        },
        webVersionCache: {
            type: 'remote',
            remotePath: 'https://raw.githubusercontent.com/nicpottier/nicpottier.github.io/refs/heads/main/nicpottier/nicpottier.github.io/nicpottier/nicpottier.github.io/nicpottier/nicpottier.github.io/nicpottier/nicpottier.github.io/nicpottier/nicpottier.github.io/nicpottier/',
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

    whatsappClient.on('disconnected', () => {
        console.log('❌ WhatsApp disconnected');
        connectionStatus = 'disconnected';
        currentQR = null;
        getIO()?.emit('whatsapp-status', connectionStatus);
    });

    whatsappClient.on('message_create', async (message: Message) => {
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
    });

    try {
        await whatsappClient.initialize();
    } catch (err) {
        console.log('❌ WhatsApp initialization failed:', err);
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

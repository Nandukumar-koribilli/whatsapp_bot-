import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { config, runtimeAIProvider, setRuntimeAIProvider, AIProvider, isBotActive, setIsBotActive } from './config';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// Export io for use in whatsapp.ts
export function getIO() {
    return io;
}

app.use(cors());
app.use(express.json());

// Capture original log for terminal
const originalLog = console.log;

// Store logs for UI
const recentLogs: string[] = [];
function logToUI(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    const formatted = `[${timestamp}] ${message}`;
    recentLogs.push(formatted);
    if (recentLogs.length > 100) recentLogs.shift();
    io.emit('log', formatted);
    originalLog(formatted);
}

// Override console.log
console.log = (...args) => {
    logToUI(args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
};

// --- API Endpoints ---

import { getWhatsAppStatus, getRecentMessages, logoutWhatsApp, startWhatsApp, getWhatsAppChats, getWhatsAppChatMessages, sendWhatsAppMessage } from './whatsapp';

app.get('/api/status', (req, res) => {
    const waStatus = getWhatsAppStatus();
    res.json({
        whatsapp: waStatus.status,
        aiProvider: runtimeAIProvider,
        botActive: isBotActive,
        uptime: process.uptime()
    });
});

app.post('/api/bot-toggle', (req, res) => {
    const { active } = req.body;
    if (typeof active !== 'boolean') return res.status(400).send("Invalid input");
    setIsBotActive(active);
    logToUI(`🤖 Bot is now ${active ? 'ACTIVE' : 'MUTED (Turning Off)'}`);
    res.json({ success: true, active });
});

app.get('/api/whatsapp/status', (req, res) => {
    res.json(getWhatsAppStatus());
});

app.get('/api/whatsapp/messages', (req, res) => {
    res.json(getRecentMessages());
});

app.get('/api/whatsapp/chats', async (req, res) => {
    try {
        res.json(await getWhatsAppChats());
    } catch (error) {
        console.error('Failed to load WhatsApp chats:', error);
        res.status(500).json({ error: 'Failed to load WhatsApp chats' });
    }
});

app.get('/api/whatsapp/chats/:chatId/messages', async (req, res) => {
    try {
        const limit = req.query.limit ? Number(req.query.limit) : 50;
        const messages = await getWhatsAppChatMessages(req.params.chatId, Number.isFinite(limit) ? limit : 50);
        res.json(messages);
    } catch (error) {
        console.error(`Failed to load messages for chat ${req.params.chatId}:`, error);
        res.status(500).json({ error: 'Failed to load chat messages' });
    }
});

app.post('/api/whatsapp/chats/:chatId/messages', async (req, res) => {
    try {
        const { body } = req.body;
        if (typeof body !== 'string' || !body.trim()) {
            return res.status(400).json({ error: 'Message body is required' });
        }

        const sentMessage = await sendWhatsAppMessage(req.params.chatId, body.trim());
        res.json({ success: true, message: sentMessage });
    } catch (error) {
        console.error(`Failed to send message to chat ${req.params.chatId}:`, error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

app.post('/api/whatsapp/logout', async (req, res) => {
    await logoutWhatsApp();
    res.json({ success: true, message: 'Logged out and restarting...' });
});

app.get('/api/ai-provider', (req, res) => {
    res.json({ provider: runtimeAIProvider });
});

app.post('/api/ai-provider', (req, res) => {
    const { provider } = req.body;
    const validProviders: AIProvider[] = ['mistral', 'nvidia'];
    if (!validProviders.includes(provider)) {
        return res.status(400).json({ error: 'Invalid provider' });
    }
    setRuntimeAIProvider(provider);
    logToUI(`🧠 AI Provider switched to: ${provider.toUpperCase()}`);
    res.json({ success: true, provider });
});

app.get('/api/logs', (req, res) => {
    res.json(recentLogs);
});

app.get('/api/skills', (req, res) => {
    const content = fs.readFileSync(path.join(__dirname, 'ai_handler.ts'), 'utf-8');
    const generalMatch = content.match(/const GENERAL_PROMPT = `([\s\S]*?)`;/);
    res.json({
        generalPrompt: generalMatch ? generalMatch[1].trim() : "Error reading prompt",
    });
});

// Serve React Dashboard
const dashboardPath = path.join(__dirname, '..', 'dashboard', 'dist');
app.use(express.static(dashboardPath));
app.get(/^(?!\/api).+/, (req, res) => {
    const indexPath = path.join(dashboardPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send("Dashboard not found. Run 'npm run build' in dashboard/ folder.");
    }
});

// --- Start Server ---

const PORT = 3000;

export function startServer() {
    httpServer.listen(PORT, () => {
        logToUI(`🚀 Backend Server running on http://localhost:${PORT}`);
        startWhatsApp();
    });
}

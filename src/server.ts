import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { config, runtimeAIProvider, setRuntimeAIProvider, AIProvider } from './config';

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

import { getWhatsAppStatus, getRecentMessages, logoutWhatsApp, startWhatsApp } from './whatsapp';

app.get('/api/status', (req, res) => {
    const waStatus = getWhatsAppStatus();
    res.json({
        whatsapp: waStatus.status,
        aiProvider: runtimeAIProvider,
        uptime: process.uptime()
    });
});

app.get('/api/whatsapp/status', (req, res) => {
    res.json(getWhatsAppStatus());
});

app.get('/api/whatsapp/messages', (req, res) => {
    res.json(getRecentMessages());
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
    const validProviders: AIProvider[] = ['mistral', 'gemini', 'assemblyai'];
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
    const didiMatch = content.match(/const DIDI_PROMPT = `([\s\S]*?)`;/);
    res.json({
        generalPrompt: generalMatch ? generalMatch[1].trim() : "Error reading prompt",
        didiPrompt: didiMatch ? didiMatch[1].trim() : "Error reading prompt"
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

import { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { LogOut, QrCode, MessageCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import QRCode from 'react-qr-code';

interface ChatMessage {
    id: string;
    from: string;
    to: string;
    body: string;
    fromMe: boolean;
    timestamp: number;
}

export function WhatsApp() {
    const [status, setStatus] = useState<'disconnected' | 'qr' | 'connecting' | 'connected'>('connecting');
    const [qr, setQR] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loggingOut, setLoggingOut] = useState(false);

    useEffect(() => {
        // Fetch initial status and messages
        axios.get('/api/whatsapp/status').then(r => {
            setStatus(r.data.status);
            setQR(r.data.qr);
        });
        axios.get('/api/whatsapp/messages').then(r => setMessages(r.data));

        // Socket.IO for real-time updates
        const socket = io();
        socket.on('whatsapp-status', (s: typeof status) => {
            setStatus(s);
            if (s === 'connected') setQR(null);
        });
        socket.on('whatsapp-qr', (q: string) => setQR(q));
        socket.on('whatsapp-message', (msg: ChatMessage) => {
            setMessages(prev => [...prev.slice(-49), msg]);
        });

        return () => { socket.disconnect(); };
    }, []);

    async function handleLogout() {
        setLoggingOut(true);
        try {
            await axios.post('/api/whatsapp/logout');
        } catch (e) {
            console.error('Logout failed');
        }
        setLoggingOut(false);
    }

    // Show QR Scanner
    if (status === 'qr' || status === 'disconnected' || status === 'connecting') {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
                <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 text-center max-w-md">
                    <QrCode size={48} className="mx-auto text-green-400 mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Connect WhatsApp</h2>
                    <p className="text-gray-400 mb-6">
                        Scan this QR code with your WhatsApp app to connect
                    </p>

                    {qr ? (
                        <div className="bg-white p-4 rounded-xl inline-block">
                            <QRCode value={qr} size={220} />
                        </div>
                    ) : (
                        <div className="h-[220px] w-[220px] bg-gray-700 rounded-xl mx-auto flex items-center justify-center">
                            <div className="animate-spin h-8 w-8 border-4 border-green-400 border-t-transparent rounded-full"></div>
                        </div>
                    )}

                    <p className="text-gray-500 text-sm mt-4">
                        {status === 'connecting' ? 'Starting WhatsApp...' : 'Waiting for scan...'}
                    </p>
                </div>
            </div>
        );
    }

    // Show Connected View with Messages
    return (
        <div className="space-y-4">
            {/* Header with Logout */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <MessageCircle className="text-green-400" />
                    WhatsApp Messages
                </h2>
                <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-600 text-red-400 rounded-lg hover:bg-red-600/30 transition"
                >
                    <LogOut size={18} />
                    {loggingOut ? 'Logging out...' : 'Logout & Reconnect'}
                </button>
            </div>

            {/* Message Feed */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 h-[calc(100vh-12rem)] overflow-auto">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        No messages yet. Waiting for incoming messages...
                    </div>
                ) : (
                    <div className="p-4 space-y-3">
                        {messages.map(msg => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[70%] p-3 rounded-xl ${msg.fromMe
                                        ? 'bg-green-600/20 border border-green-600/30'
                                        : 'bg-gray-700 border border-gray-600'
                                    }`}>
                                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                                        {msg.fromMe ? (
                                            <>
                                                <span>To: {msg.to}</span>
                                                <ArrowRight size={12} className="text-green-400" />
                                            </>
                                        ) : (
                                            <>
                                                <ArrowLeft size={12} className="text-blue-400" />
                                                <span>From: {msg.from}</span>
                                            </>
                                        )}
                                        <span className="ml-auto">
                                            {new Date(msg.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <p className="text-white">{msg.body}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

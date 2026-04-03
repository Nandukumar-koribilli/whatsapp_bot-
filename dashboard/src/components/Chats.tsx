import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ArrowLeft, MessageSquare, Search, Send, Users } from 'lucide-react';

interface ChatSummary {
    id: string;
    name: string;
    lastMessage: string;
    timestamp: number;
    unreadCount: number;
    isGroup: boolean;
}

interface ChatMessage {
    id: string;
    body: string;
    from: string;
    to: string;
    fromMe: boolean;
    timestamp: number;
}

export function Chats() {
    const [chats, setChats] = useState<ChatSummary[]>([]);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loadingChats, setLoadingChats] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [draftMessage, setDraftMessage] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);

    useEffect(() => {
        let mounted = true;

        async function loadChats() {
            try {
                const response = await axios.get('/api/whatsapp/chats');
                if (!mounted) return;
                setChats(response.data || []);
                if ((response.data || []).length > 0 && !selectedChatId) {
                    setSelectedChatId(response.data[0].id);
                }
            } catch (error) {
                console.error('Failed to load chats', error);
            } finally {
                if (mounted) setLoadingChats(false);
            }
        }

        loadChats();
        return () => {
            mounted = false;
        };
    }, [selectedChatId]);

    useEffect(() => {
        if (!selectedChatId) {
            setMessages([]);
            return;
        }

        let mounted = true;
        setLoadingMessages(true);

        async function loadMessages() {
            try {
                const chatId = selectedChatId;
                if (!chatId) return;
                const response = await axios.get(`/api/whatsapp/chats/${encodeURIComponent(chatId)}/messages?limit=100`);
                if (!mounted) return;
                setMessages(response.data || []);
            } catch (error) {
                console.error('Failed to load chat messages', error);
                if (mounted) setMessages([]);
            } finally {
                if (mounted) setLoadingMessages(false);
            }
        }

        loadMessages();
        return () => {
            mounted = false;
        };
    }, [selectedChatId]);

    async function refreshMessages(chatId: string) {
        try {
            const response = await axios.get(`/api/whatsapp/chats/${encodeURIComponent(chatId)}/messages?limit=100`);
            setMessages(response.data || []);
        } catch (error) {
            console.error('Failed to refresh chat messages', error);
        }
    }

    async function sendMessage() {
        if (!selectedChatId || !draftMessage.trim()) return;

        const chatId = selectedChatId;
        const messageText = draftMessage.trim();
        setSendingMessage(true);
        try {
            await axios.post(`/api/whatsapp/chats/${encodeURIComponent(chatId)}/messages`, {
                body: messageText,
            });
            setDraftMessage('');
            await refreshMessages(chatId);
            await axios.get('/api/whatsapp/chats').then((response) => setChats(response.data || []));
        } catch (error) {
            console.error('Failed to send message', error);
        } finally {
            setSendingMessage(false);
        }
    }

    const filteredChats = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) return chats;
        return chats.filter((chat) => {
            return (
                chat.name.toLowerCase().includes(query) ||
                chat.lastMessage.toLowerCase().includes(query) ||
                chat.id.toLowerCase().includes(query)
            );
        });
    }, [chats, searchTerm]);

    const selectedChat = chats.find((chat) => chat.id === selectedChatId) || null;

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <MessageSquare className="text-green-400" />
                        Chats
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">Browse all WhatsApp chats and open old conversations from your phone.</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-800 border border-gray-700 rounded-full px-4 py-2">
                    <Users size={16} />
                    {chats.length} chats
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 flex-1 min-h-0">
                <aside className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden flex flex-col min-h-0">
                    <div className="p-4 border-b border-gray-700">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search chats"
                                className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-4 py-3 text-sm outline-none focus:border-green-500"
                            />
                        </div>
                    </div>

                    <div className="overflow-auto flex-1">
                        {loadingChats ? (
                            <div className="p-6 text-gray-500">Loading chats...</div>
                        ) : filteredChats.length === 0 ? (
                            <div className="p-6 text-gray-500">No chats found.</div>
                        ) : (
                            <div className="divide-y divide-gray-700">
                                {filteredChats.map((chat) => (
                                    <button
                                        key={chat.id}
                                        onClick={() => setSelectedChatId(chat.id)}
                                        className={`w-full text-left p-4 transition ${selectedChatId === chat.id ? 'bg-green-600/10' : 'hover:bg-gray-700/60'}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="h-11 w-11 rounded-full bg-gray-700 flex items-center justify-center text-green-400 font-bold shrink-0">
                                                {chat.isGroup ? 'G' : chat.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold truncate">{chat.name}</span>
                                                    {chat.unreadCount > 0 && (
                                                        <span className="ml-auto bg-green-500 text-black text-[11px] font-bold px-2 py-0.5 rounded-full">
                                                            {chat.unreadCount}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-400 truncate mt-1">{chat.lastMessage}</p>
                                                <div className="text-xs text-gray-500 mt-2 flex items-center justify-between gap-2">
                                                    <span>{chat.isGroup ? 'Group' : 'Contact'}</span>
                                                    <span>{chat.timestamp ? new Date(chat.timestamp).toLocaleString() : 'No messages yet'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>

                <section className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden flex flex-col min-h-0">
                    {selectedChat ? (
                        <>
                            <div className="p-4 border-b border-gray-700 flex items-center gap-3">
                                <div className="h-11 w-11 rounded-full bg-gray-700 flex items-center justify-center text-green-400 font-bold">
                                    {selectedChat.isGroup ? 'G' : selectedChat.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-semibold">{selectedChat.name}</h3>
                                    <p className="text-xs text-gray-400">{selectedChat.isGroup ? 'Group chat' : 'Direct chat'} • {selectedChat.id}</p>
                                </div>
                            </div>

                            <div className="overflow-auto flex-1 p-4 space-y-3 bg-gray-900/40">
                                {loadingMessages ? (
                                    <div className="text-gray-500">Loading chat history...</div>
                                ) : messages.length === 0 ? (
                                    <div className="text-gray-500 flex items-center gap-2">
                                        <ArrowLeft size={16} />
                                        No messages found for this chat.
                                    </div>
                                ) : (
                                    messages.map((message) => (
                                        <div key={message.id} className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[75%] rounded-2xl px-4 py-3 border ${message.fromMe ? 'bg-green-600/20 border-green-600/30' : 'bg-gray-700 border-gray-600'}`}>
                                                <div className="text-xs text-gray-400 mb-1 flex items-center justify-between gap-3">
                                                    <span>{message.fromMe ? 'You' : message.from || 'Unknown'}</span>
                                                    <span>{new Date(message.timestamp).toLocaleString()}</span>
                                                </div>
                                                <div className="text-sm whitespace-pre-wrap break-words">{message.body || '(media / empty message)'}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="border-t border-gray-700 p-4 bg-gray-800">
                                <div className="flex gap-3 items-end">
                                    <textarea
                                        value={draftMessage}
                                        onChange={(e) => setDraftMessage(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                void sendMessage();
                                            }
                                        }}
                                        rows={2}
                                        placeholder="Type a message and press Enter to send"
                                        className="flex-1 resize-none bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500"
                                    />
                                    <button
                                        onClick={() => void sendMessage()}
                                        disabled={sendingMessage || !draftMessage.trim()}
                                        className="px-4 py-3 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2 font-semibold"
                                    >
                                        <Send size={16} />
                                        {sendingMessage ? 'Sending...' : 'Send'}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    Manual messages work even when the bot is turned off.
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500 p-6 text-center">
                            Select a chat on the left to view its history.
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

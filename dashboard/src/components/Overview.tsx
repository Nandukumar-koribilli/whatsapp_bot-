import { useEffect, useState } from 'react';
import axios from 'axios';
import { CheckCircle, XCircle, Bot, Power, PowerOff } from 'lucide-react';

const AI_PROVIDERS = [
    { id: 'mistral', name: 'Mistral', color: 'text-orange-400' },
];

export function Overview() {
    const [status, setStatus] = useState<any>(null);
    const [selectedProvider, setSelectedProvider] = useState('');
    const [isBotActive, setIsBotActive] = useState(true);
    const [changing, setChanging] = useState(false);

    useEffect(() => {
        axios.get('/api/status').then(r => {
            setStatus(r.data);
            setSelectedProvider(r.data.aiProvider || 'mistral');
            setIsBotActive(r.data.botActive !== false);
        });
        const interval = setInterval(() => {
            axios.get('/api/status').then(r => setStatus(r.data));
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    async function changeProvider(provider: string) {
        setChanging(true);
        try {
            await axios.post('/api/ai-provider', { provider });
            setSelectedProvider(provider);
        } catch (e) {
            console.error('Failed to change AI provider');
        }
        setChanging(false);
    }

    async function toggleBot() {
        setChanging(true);
        try {
            const newState = !isBotActive;
            await axios.post('/api/bot-toggle', { active: newState });
            setIsBotActive(newState);
        } catch (e) {
            console.error('Failed to toggle bot');
        }
        setChanging(false);
    }

    if (!status) return <div className="text-gray-500">Loading system status...</div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatusCard
                    title="WhatsApp"
                    param={status.whatsapp}
                    online={status.whatsapp === 'Online'}
                    color="green"
                />
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col items-center justify-center relative overflow-hidden">
                    <span className="text-gray-400 text-sm uppercase font-bold tracking-wider relative z-10">System Uptime</span>
                    <span className="text-3xl font-mono mt-2 text-blue-400 relative z-10">
                        {Math.floor(status.uptime / 60)}m {Math.floor(status.uptime % 60)}s
                    </span>
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                        <Bot size={80} />
                    </div>
                </div>
            </div>

            {/* Main Control Card */}
            <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-xl overflow-hidden relative">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-full ${isBotActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {isBotActive ? <CheckCircle size={28} /> : <XCircle size={28} />}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Bot Status: {isBotActive ? 'ACTIVE' : 'MUTED'}</h2>
                                <p className="text-gray-400">
                                    {isBotActive
                                        ? "The bot is currently listening and replying to messages."
                                        : "The bot is currently idle and will not respond to any messages."}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={toggleBot}
                            disabled={changing}
                            className={`w-full md:w-auto px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all transform active:scale-95 ${isBotActive
                                ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20'
                                : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20'
                                }`}
                        >
                            {isBotActive ? <PowerOff size={22} /> : <Power size={22} />}
                            {isBotActive ? 'TURN OFF BOT' : 'TURN ON BOT'}
                        </button>
                    </div>

                    <div className="w-px h-32 bg-gray-700 hidden md:block"></div>

                    <div className="flex-1 w-full">
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                            <Bot className="text-purple-400" /> AI Provider
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                            {AI_PROVIDERS.map(provider => (
                                <button
                                    key={provider.id}
                                    onClick={() => changeProvider(provider.id)}
                                    disabled={changing || !isBotActive}
                                    className={`p-3 rounded-lg border-2 transition-all text-sm font-semibold flex flex-col items-center gap-1 ${selectedProvider === provider.id
                                        ? 'border-purple-500 bg-purple-500/20 ' + provider.color
                                        : 'border-gray-600 bg-gray-900 text-gray-500 hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed'
                                        }`}
                                >
                                    {provider.name}
                                    {selectedProvider === provider.id && (
                                        <span className="text-[10px] opacity-60 uppercase tracking-tighter">Active</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Decorative Background Icon */}
                <Bot size={300} className="absolute -bottom-20 -right-20 text-gray-700/5 pointer-events-none" />
            </div>
        </div>
    );
}

function StatusCard({ title, param, online, color }: any) {
    const colors: any = {
        green: 'text-green-500 bg-green-500/10 border-green-500/20',
    };

    return (
        <div className={`p-6 rounded-xl border flex items-center justify-between ${online ? colors[color] : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
            <div>
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="text-sm opacity-80">{param}</p>
            </div>
            {online ? <CheckCircle size={32} /> : <XCircle size={32} />}
        </div>
    );
}

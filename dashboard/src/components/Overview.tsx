import { useEffect, useState } from 'react';
import axios from 'axios';
import { CheckCircle, XCircle, Bot } from 'lucide-react';

const AI_PROVIDERS = [
    { id: 'mistral', name: 'Mistral', color: 'text-orange-400' },
    { id: 'gemini', name: 'Gemini 1.5', color: 'text-blue-400' },
    { id: 'assemblyai', name: 'AssemblyAI', color: 'text-purple-400' },
];

export function Overview() {
    const [status, setStatus] = useState<any>(null);
    const [selectedProvider, setSelectedProvider] = useState('');
    const [changing, setChanging] = useState(false);

    useEffect(() => {
        axios.get('/api/status').then(r => {
            setStatus(r.data);
            setSelectedProvider(r.data.aiProvider || 'mistral');
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
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col items-center justify-center">
                    <span className="text-gray-400 text-sm uppercase font-bold tracking-wider">System Uptime</span>
                    <span className="text-3xl font-mono mt-2 text-blue-400">
                        {Math.floor(status.uptime / 60)}m {Math.floor(status.uptime % 60)}s
                    </span>
                </div>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-600">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                    <Bot className="text-purple-400" /> Select AI Brain
                </h3>
                <div className="grid grid-cols-3 gap-3">
                    {AI_PROVIDERS.map(provider => (
                        <button
                            key={provider.id}
                            onClick={() => changeProvider(provider.id)}
                            disabled={changing}
                            className={`p-4 rounded-lg border-2 transition-all font-semibold ${selectedProvider === provider.id
                                ? 'border-purple-500 bg-purple-500/20 ' + provider.color
                                : 'border-gray-600 bg-gray-800 text-gray-400 hover:border-gray-500'
                                }`}
                        >
                            {provider.name}
                            {selectedProvider === provider.id && (
                                <span className="block text-xs opacity-60 mt-1">Active</span>
                            )}
                        </button>
                    ))}
                </div>
                <p className="text-gray-500 text-sm mt-3">
                    Click to switch AI. Changes apply immediately.
                </p>
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

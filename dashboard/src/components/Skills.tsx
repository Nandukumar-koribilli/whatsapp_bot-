import { useEffect, useState } from 'react';
import axios from 'axios';
import { Brain } from 'lucide-react';

export function Skills() {
    const [generalPrompt, setGeneralPrompt] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/skills').then(res => {
            setGeneralPrompt(res.data.generalPrompt || '');
            setLoading(false);
        });
    }, []);

    return (
        <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                    <Brain className="text-green-400" /> General Persona (Everyone)
                </h2>
                <p className="text-gray-400 text-sm mb-3">
                    Default AI personality for all WhatsApp contacts.
                </p>
                {loading ? (
                    <div className="animate-pulse h-40 bg-gray-700/50 rounded"></div>
                ) : (
                    <pre className="w-full bg-gray-900 border border-gray-600 rounded-lg p-4 text-gray-200 font-mono text-sm whitespace-pre-wrap leading-relaxed overflow-auto max-h-64">
                        {generalPrompt}
                    </pre>
                )}
            </div>



            <p className="text-gray-500 text-center text-xs">
                To edit, modify <code className="text-green-400">src/ai_handler.ts</code> directly.
            </p>
        </div>
    );
}

import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

export function LiveTerminal() {
    const [logs, setLogs] = useState<string[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Fetch existing logs
        axios.get('/api/logs').then(res => setLogs(res.data));

        // Connect to Socket.IO for real-time logs
        const socket = io();
        socket.on('log', (log: string) => {
            setLogs(prev => [...prev.slice(-99), log]);
        });

        return () => { socket.disconnect(); };
    }, []);

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="bg-gray-950 rounded-xl border border-gray-700 h-[calc(100vh-8rem)] flex flex-col">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800">
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-gray-400 text-sm font-mono ml-2">Live Terminal</span>
            </div>
            <div ref={containerRef} className="flex-1 overflow-auto p-4 font-mono text-sm space-y-1">
                {logs.length === 0 ? (
                    <div className="text-gray-600 italic">Waiting for logs...</div>
                ) : (
                    logs.map((log, i) => (
                        <div key={i} className={`${log.includes('Error') || log.includes('❌') ? 'text-red-400' : log.includes('✅') ? 'text-green-400' : log.includes('🧠') ? 'text-purple-400' : 'text-gray-300'}`}>
                            {log}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

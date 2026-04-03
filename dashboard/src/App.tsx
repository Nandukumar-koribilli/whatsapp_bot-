import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Overview } from './components/Overview';
import { LiveTerminal } from './components/LiveTerminal';
import { Skills } from './components/Skills';
import { WhatsApp } from './components/WhatsApp';
import { Chats } from './components/Chats';
import { LayoutDashboard, Terminal, Brain, MessageCircle, MessagesSquare } from 'lucide-react';

function App() {
    return (
        <BrowserRouter>
            <div className="min-h-screen bg-gray-900 text-white flex">
                {/* Sidebar */}
                <aside className="w-64 bg-gray-950 border-r border-gray-800 p-4 flex flex-col">
                    <h1 className="text-xl font-bold text-green-400 mb-8">🤖 WhatsApp Bot</h1>
                    <nav className="space-y-2 flex-1">
                        <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Overview" />
                        <NavItem to="/whatsapp" icon={<MessageCircle size={20} />} label="WhatsApp" />
                        <NavItem to="/chats" icon={<MessagesSquare size={20} />} label="Chats" />
                        <NavItem to="/terminal" icon={<Terminal size={20} />} label="Live Terminal" />
                        <NavItem to="/skills" icon={<Brain size={20} />} label="Bot Persona" />
                    </nav>
                    <div className="text-xs text-gray-600 mt-4">v1.0 • Nandu's Bot</div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-8 overflow-auto">
                    <Routes>
                        <Route path="/" element={<Overview />} />
                        <Route path="/whatsapp" element={<WhatsApp />} />
                        <Route path="/chats" element={<Chats />} />
                        <Route path="/terminal" element={<LiveTerminal />} />
                        <Route path="/skills" element={<Skills />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive ? 'bg-green-600/20 text-green-400' : 'text-gray-400 hover:bg-gray-800'
                }`
            }
        >
            {icon}
            <span className="font-medium">{label}</span>
        </NavLink>
    );
}

export default App;

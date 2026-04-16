import { useState, useRef, useEffect } from 'react';
import {
  BrainCircuit, Plus, Send, Loader2, X, Trash2, Paperclip, Mic, MicOff,
} from 'lucide-react';
import type { ChatSession, ChatMessage, ApiConfig } from '@/types';
import { callAIProxy, callOllama, extractText } from '@/services/aiProxy';

const PROVIDERS = ['Claude', 'Ollama'] as const;
type Provider = typeof PROVIDERS[number];

const PROVIDER_MODELS: Record<Provider, { id: string; label: string }[]> = {
  Claude: [
    { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
    { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
    { id: 'claude-opus-4-6', label: 'Claude Opus 4.6' },
    { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
    { id: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
    { id: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
  ],
  Ollama: [
    { id: 'gemma3:4b', label: 'Gemma 3 4B (Fast)' },
    { id: 'gemma3:12b', label: 'Gemma 3 12B' },
    { id: 'gemma3:27b', label: 'Gemma 3 27B' },
    { id: 'llama3.2:3b', label: 'Llama 3.2 3B' },
    { id: 'llama3.1:8b', label: 'Llama 3.1 8B' },
    { id: 'llama3.1:70b', label: 'Llama 3.1 70B' },
    { id: 'mistral:7b', label: 'Mistral 7B' },
    { id: 'mistral-nemo:12b', label: 'Mistral Nemo 12B' },
    { id: 'qwen2.5:7b', label: 'Qwen 2.5 7B' },
    { id: 'qwen2.5:14b', label: 'Qwen 2.5 14B' },
    { id: 'phi4:14b', label: 'Phi-4 14B' },
    { id: 'deepseek-r1:7b', label: 'DeepSeek R1 7B' },
    { id: 'codellama:13b', label: 'CodeLlama 13B' },
  ],
};

const PROVIDER_COLORS: Record<Provider, string> = {
  Claude: 'text-orange-400',
  Ollama: 'text-purple-400',
};

const PROVIDER_ACTIVE: Record<Provider, string> = {
  Claude: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
  Ollama: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
};

interface Props {
  chatSessions: ChatSession[];
  activeChatId: string | null;
  activeProvider: Provider;
  apiConfig: ApiConfig;
  onSetSessions: (fn: (prev: ChatSession[]) => ChatSession[]) => void;
  onSetActiveChat: (id: string | null) => void;
  onSetProvider: (p: Provider) => void;
}

export const AICommand: React.FC<Props> = ({
  chatSessions, activeChatId, activeProvider, apiConfig,
  onSetSessions, onSetActiveChat, onSetProvider,
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Record<Provider, string>>({
    Claude: 'claude-sonnet-4-6',
    Ollama: apiConfig.ollamaModel || 'gemma3:4b',
  });
  const [isListening, setIsListening] = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);

  const activeSession = chatSessions.find(s => s.id === activeChatId && !s.archived);

  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [activeSession?.messages]);

  const createNewChat = () => {
    const newSession: ChatSession = {
      id: `chat-${Date.now()}`,
      title: '',
      provider: activeProvider,
      messages: [],
      archived: false,
      createdAt: Date.now(),
    };
    onSetSessions(prev => [newSession, ...prev]);
    onSetActiveChat(newSession.id);
  };

  const deleteChat = (id: string) => {
    onSetSessions(prev => prev.filter(s => s.id !== id));
    if (activeChatId === id) onSetActiveChat(null);
  };

  const archiveChat = (id: string) => {
    onSetSessions(prev => prev.map(s => s.id === id ? { ...s, archived: true } : s));
    onSetActiveChat(null);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !activeChatId || isLoading) return;

    const userInput = input.trim();
    setInput('');

    const userMsg: ChatMessage = { id: `m-${Date.now()}`, role: 'user', text: userInput, timestamp: Date.now() };
    onSetSessions(prev => prev.map(s => s.id === activeChatId ? { ...s, messages: [...s.messages, userMsg] } : s));

    setIsLoading(true);
    try {
      const history = activeSession?.messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.text })) || [];
      const systemPrompt = 'You are a helpful AI assistant for a pharmaceutical ERP system. Provide concise, accurate responses.';
      let text = '';

      if (activeProvider === 'Ollama') {
        text = await callOllama(apiConfig.ollamaUrl || 'http://localhost:11434', selectedModel[activeProvider], [...history, { role: 'user', content: userInput }], systemPrompt);
      } else {
        const providerKey = activeProvider === 'Claude' ? apiConfig.claudeKey : undefined;
        const res = await callAIProxy({
          provider: 'claude',
          model: selectedModel[activeProvider],
          system: systemPrompt,
          messages: [...history, { role: 'user', content: userInput }],
          apiKey: providerKey,
        });
        text = extractText(res, activeProvider.toLowerCase()) || 'No response.';
      }

      const modelMsg: ChatMessage = { id: `m-${Date.now()}`, role: 'model', text: text || 'No response.', timestamp: Date.now() };
      onSetSessions(prev => prev.map(s => s.id === activeChatId ? { ...s, messages: [...s.messages, modelMsg] } : s));
    } catch (e) {
      const errMsg: ChatMessage = { id: `m-${Date.now()}`, role: 'model', text: `Error: ${String(e)}`, timestamp: Date.now() };
      onSetSessions(prev => prev.map(s => s.id === activeChatId ? { ...s, messages: [...s.messages, errMsg] } : s));
    } finally {
      setIsLoading(false);
    }
  };

  const activeSessions = chatSessions.filter(s => !s.archived);
  const archivedSessions = chatSessions.filter(s => s.archived && s.messages.length > 0);

  return (
    <div className="flex gap-3 animate-fadeIn" style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
      {/* Sidebar */}
      <div className="w-44 shrink-0 flex flex-col gap-2">
        <button onClick={createNewChat} className="w-full py-2 bg-[#D4AF37] hover:bg-[#c4a030] text-slate-950 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all">
          <Plus size={12}/> New Chat
        </button>
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
          {activeSessions.map(s => (
            <div key={s.id} onClick={() => { onSetActiveChat(s.id); onSetProvider(s.provider as Provider); }}
              className={`group relative p-2.5 rounded-lg border cursor-pointer transition-all ${activeChatId === s.id ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
              <p className="text-xs font-bold text-slate-900 truncate pr-4">{s.title || 'New Chat'}</p>
              <p className={`text-[10px] font-bold ${PROVIDER_COLORS[s.provider as Provider] || 'text-slate-500'}`}>{s.provider}</p>
              <p className="text-[9px] text-slate-500">{s.messages.length} msg</p>
              <button onClick={e => { e.stopPropagation(); archiveChat(s.id); }}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all"><X size={10}/></button>
            </div>
          ))}
          {archivedSessions.length > 0 && (
            <>
              <p className="text-[9px] text-slate-500 uppercase font-bold px-1 pt-2">History</p>
              {archivedSessions.map(s => (
                <div key={s.id} onClick={() => { onSetSessions(prev => prev.map(x => x.id === s.id ? { ...x, archived: false } : x)); onSetActiveChat(s.id); }}
                  className="group relative p-2 rounded-lg border border-gray-200 bg-white/20 cursor-pointer hover:border-gray-200 transition-all">
                  <p className="text-[10px] text-slate-500 truncate pr-4">{s.title}</p>
                  <button onClick={e => { e.stopPropagation(); deleteChat(s.id); }}
                    className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400"><Trash2 size={9}/></button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Main chat */}
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        {/* Provider bar */}
        <div className="flex flex-wrap gap-1.5 items-center bg-white border border-gray-200 rounded-xl px-3 py-2 shrink-0">
          {PROVIDERS.map(p => (
            <button key={p} onClick={() => onSetProvider(p)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${activeProvider === p ? PROVIDER_ACTIVE[p] : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
              {p === 'Claude' ? '🤖 Claude' : '🏠 Ollama'}
            </button>
          ))}
          <div className="w-px h-4 bg-gray-200 mx-1"/>
          <select
            value={selectedModel[activeProvider]}
            onChange={e => setSelectedModel(prev => ({ ...prev, [activeProvider]: e.target.value }))}
            className="bg-transparent text-slate-600 text-[11px] border border-gray-200 rounded-lg px-2 py-0.5 focus:outline-none focus:border-[#D4AF37]/40"
            disabled={isLoading}
          >
            {PROVIDER_MODELS[activeProvider].map(m => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 p-3 bg-gray-50 rounded-lg">
          {!activeSession ? (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              <div className="text-center">
                <BrainCircuit size={32} className="mx-auto mb-2 opacity-30"/>
                <p>Select or create a chat to start</p>
              </div>
            </div>
          ) : (
            <>
              {activeSession.messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${msg.role === 'user' ? 'bg-[#D4AF37] text-slate-950' : 'bg-white border border-gray-200 text-slate-900'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm text-slate-600 flex items-center gap-1.5">
                    <Loader2 size={14} className="animate-spin"/> Thinking...
                  </div>
                </div>
              )}
              <div ref={msgEndRef}/>
            </>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2 shrink-0">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            disabled={!activeSession || isLoading}
            className="flex-1 bg-white border border-gray-200 text-slate-900 rounded-lg px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:border-[#D4AF37]/50 disabled:opacity-50"
          />
          <button onClick={handleSendMessage} disabled={!activeSession || isLoading || !input.trim()}
            className="px-3 py-2 bg-[#D4AF37] hover:bg-[#c4a030] text-slate-950 rounded-lg font-bold text-sm flex items-center gap-1.5 transition-all disabled:opacity-50">
            <Send size={14}/> Send
          </button>
        </div>
      </div>
    </div>
  );
};

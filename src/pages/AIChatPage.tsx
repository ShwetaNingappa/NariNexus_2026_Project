import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Send, 
  Plus, 
  MessageSquare, 
  Sparkles, 
  Globe, 
  ArrowLeftRight, 
  HeartHandshake, 
  HelpCircle,
  Clock,
  Trash2,
  BookOpen,
  ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../services/authContext';

const LOCALIZATION: Record<string, Record<string, string>> = {
  en: {
    title: 'NariNexus AI Assistant',
    subtitle: 'Your personal companion for skill development & business ideas',
    newChat: 'New Conversation',
    inputPlaceholder: 'Type your question in English, Kannada or Hindi...',
    quickPromptsHeader: 'Suggested Topics to Start',
    prompt1: 'What tailoring skills should I learn?',
    prompt2: 'How do I start a small home business?',
    prompt3: 'Explain basic digital banking and safety.',
    noSessions: 'No recent chats',
    noMessages: 'Start your conversation below! Ask anything about skills, courses or career options.',
    typing: 'AI Assistant is thinking...',
    backToDashboard: 'Back to Dashboard',
    activeSessions: 'Your Conversations',
    preferredLangLabel: 'Responding in English'
  },
  kn: {
    title: 'ನಾರಿನೆಕ್ಸಸ್ AI ಸಹಾಯಕಿ',
    subtitle: 'ನಿಮ್ಮ ಕೌಶಲ್ಯ ಅಭಿವೃದ್ಧಿ ಮತ್ತು ವ್ಯವಹಾರದ ವೈಯಕ್ತಿಕ ಮಾರ್ಗದರ್ಶಿ',
    newChat: 'ಹೊಸ ಸಂಭಾಷಣೆ',
    inputPlaceholder: 'ಕನ್ನಡ, ಹಿಂದಿ ಅಥವಾ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಪ್ರಶ್ನೆ ಕೇಳಿ...',
    quickPromptsHeader: 'ಪ್ರಾರಂಭಿಸಲು ಸೂಚಿಸಲಾದ ವಿಷಯಗಳು',
    prompt1: 'ನಾನು ಯಾವ ಹೊಲಿಗೆ ಕೌಶಲ್ಯಗಳನ್ನು ಕಲಿಯಬೇಕು?',
    prompt2: 'ಸಣ್ಣ ಗೃಹ ಉದ್ಯಮವನ್ನು ಪ್ರಾರಂಭಿಸುವುದು ಹೇಗೆ?',
    prompt3: 'ಡಿಜಿಟಲ್ ಬ್ಯಾಂಕಿಂಗ್ ಮತ್ತು ಸುರಕ್ಷತೆಯ ಬಗ್ಗೆ ತಿಳಿಸಿ.',
    noSessions: 'ಯಾವುದೇ ಇತ್ತೀಚಿನ ಚಾಟ್‌ಗಳಿಲ್ಲ',
    noMessages: 'ಕೆಳಗೆ ನಿಮ್ಮ ಸಂಭಾಷಣೆಯನ್ನು ಪ್ರಾರಂಭಿಸಿ! ಕೌಶಲ್ಯಗಳು, ಕೋರ್ಸ್‌ಗಳು ಅಥವಾ ವೃತ್ತಿ ಆಯ್ಕೆಗಳ ಬಗ್ಗೆ ಕೇಳಿ.',
    typing: 'AI ಸಹಾಯಕಿ ಯೋಚಿಸುತ್ತಿದ್ದಾಳೆ...',
    backToDashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ',
    activeSessions: 'ನಿಮ್ಮ ಸಂಭಾಷಣೆಗಳು',
    preferredLangLabel: 'ಕನ್ನಡದಲ್ಲಿ ಪ್ರತಿಕ್ರಿಯಿಸಲಾಗುತ್ತಿದೆ'
  },
  hi: {
    title: 'नारीनेक्सस AI असिस्टेंट',
    subtitle: 'कौशल विकास और लघु व्यवसाय के लिए आपकी मार्गदर्शिका',
    newChat: 'नई बातचीत',
    inputPlaceholder: 'हिंदी, कन्नड़ या अंग्रेजी में अपना प्रश्न पूछें...',
    quickPromptsHeader: 'शुरू करने के लिए सुझाए गए विषय',
    prompt1: 'मुझे कौन से सिलाई कौशल सीखने चाहिए?',
    prompt2: 'छोटा गृह उद्योग कैसे शुरू करें?',
    prompt3: 'डिजिटल बैंकिंग और सुरक्षा के बारे में समझाएं।',
    noSessions: 'कोई हालिया चैट नहीं',
    noMessages: 'नीचे अपनी बातचीत शुरू करें! कौशल, पाठ्यक्रम या करियर के बारे में पूछें।',
    typing: 'AI असिस्टेंट सोच रहा है...',
    backToDashboard: 'डैशबोर्ड पर वापस जाएं',
    activeSessions: 'आपकी बातचीत',
    preferredLangLabel: 'हिंदी में प्रतिक्रिया दी जा रही है'
  }
};

interface Session {
  session_id: string;
  title: string;
  created_at: string;
}

interface Message {
  message_id: string;
  session_id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export default function AIChatPage() {
  const { user } = useAuth();
  const lang = user?.preferred_language || 'en';
  const t = LOCALIZATION[lang] || LOCALIZATION['en'];

  const location = useLocation();
  const navigate = useNavigate();
  const [initialProcessed, setInitialProcessed] = useState(false);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat sessions on component mount
  useEffect(() => {
    fetchSessions();
  }, []);

  // Fetch messages when active session changes
  useEffect(() => {
    if (activeSessionId) {
      fetchMessages(activeSessionId);
    } else {
      setMessages([]);
    }
  }, [activeSessionId]);

  // Scroll to bottom when messages list updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const fetchSessions = async () => {
    setSessionsLoading(true);
    const token = localStorage.getItem('narinexus_token');
    if (!token) return;

    try {
      const res = await fetch('/api/ai/chat/sessions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
        if (data.sessions && data.sessions.length > 0 && !activeSessionId) {
          setActiveSessionId(data.sessions[0].session_id);
        }
      }
    } catch (err) {
      console.error('Failed to load chat sessions:', err);
    } finally {
      setSessionsLoading(false);
    }
  };

  const fetchMessages = async (sessionId: string) => {
    setMessagesLoading(true);
    setErrorMsg('');
    const token = localStorage.getItem('narinexus_token');
    if (!token) return;

    try {
      const res = await fetch(`/api/ai/chat/sessions/${sessionId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      } else {
        setErrorMsg('Failed to load conversation messages.');
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
      setErrorMsg('Network error. Failed to load messages.');
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleStartNewSession = async () => {
    setErrorMsg('');
    const token = localStorage.getItem('narinexus_token');
    if (!token) return;

    try {
      const res = await fetch('/api/ai/chat/sessions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title: t.newChat })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.session) {
          setSessions(prev => [data.session, ...prev]);
          setActiveSessionId(data.session.session_id);
        }
      }
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const rawText = textToSend || inputText;
    if (!rawText.trim() || isTyping) return;

    setErrorMsg('');
    if (!textToSend) setInputText('');

    const token = localStorage.getItem('narinexus_token');
    if (!token) return;

    // Local state preview for user message (to appear instantly)
    const temporaryUserMessage: Message = {
      message_id: 'temp-usr-' + Date.now(),
      session_id: activeSessionId || '',
      role: 'user',
      content: rawText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, temporaryUserMessage]);
    setIsTyping(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: rawText,
          session_id: activeSessionId || undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // If we had no active session before, set the newly returned session
          if (!activeSessionId) {
            setActiveSessionId(data.session_id);
            // Re-fetch sessions to show updated title preview
            await fetchSessions();
          } else {
            // Update messages to contain the actual response
            fetchMessages(activeSessionId);
            // Optionally update the session title if it was first message
            if (messages.length <= 1) {
              fetchSessions();
            }
          }
        } else {
          setErrorMsg('Assistant could not generate a response.');
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setErrorMsg(errData.detail || 'Failed to communicate with AI server.');
      }
    } catch (err) {
      console.error('Chat error:', err);
      setErrorMsg('Connection error. Please check your internet.');
    } finally {
      setIsTyping(false);
    }
  };

  // Process initial message from dashboard navigation state
  useEffect(() => {
    const handleInitialMessage = async () => {
      const initMsg = location.state?.initialMessage;
      if (initMsg && !initialProcessed) {
        setInitialProcessed(true);
        // Clear state so it doesn't re-trigger on refresh
        navigate(location.pathname, { replace: true, state: {} });
        
        const token = localStorage.getItem('narinexus_token');
        if (!token) return;
        
        try {
          // If there are sessions already, use the first one. Otherwise, create a new session.
          const res = await fetch('/api/ai/chat/sessions', {
            headers: { Authorization: `Bearer ${token}` }
          });
          let targetSessionId = null;
          if (res.ok) {
            const data = await res.json();
            setSessions(data.sessions || []);
            if (data.sessions && data.sessions.length > 0) {
              targetSessionId = data.sessions[0].session_id;
              setActiveSessionId(targetSessionId);
            }
          }
          
          if (!targetSessionId) {
            // Create a new session
            const newRes = await fetch('/api/ai/chat/sessions', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ title: t.newChat })
            });
            if (newRes.ok) {
              const data = await newRes.json();
              if (data.success && data.session) {
                setSessions([data.session]);
                targetSessionId = data.session.session_id;
                setActiveSessionId(targetSessionId);
              }
            }
          }
          
          if (targetSessionId) {
            // Trigger sending message
            setTimeout(() => {
              handleSendMessage(initMsg);
            }, 100);
          }
        } catch (err) {
          console.error("Error processing initial message:", err);
        }
      }
    };
    
    if (!sessionsLoading) {
      handleInitialMessage();
    }
  }, [sessionsLoading, location.state, initialProcessed, navigate, t.newChat]);

  const handleQuickPromptClick = (promptText: string) => {
    handleSendMessage(promptText);
  };

  return (
    <div className="flex h-screen bg-cream overflow-hidden text-[#3D2D1E]" id="ai-chat-page">
      
      {/* Sessions / Chat History Sidebar */}
      <aside className="w-80 border-r border-primary-gold/15 bg-white flex flex-col h-full hidden md:flex">
        <div className="p-5 border-b border-primary-gold/10">
          <Link to="/learner" className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#7D7061] hover:text-deep-rose transition mb-4">
            <ArrowLeft className="h-4 w-4" />
            <span>{t.backToDashboard}</span>
          </Link>
          
          <button 
            onClick={handleStartNewSession}
            className="w-full flex items-center justify-center space-x-2 rounded-xl bg-deep-rose hover:bg-deep-rose/95 text-white py-3 px-4 text-xs font-bold uppercase tracking-widest shadow-md transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>{t.newChat}</span>
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-4 space-y-2">
          <span className="px-2 text-[9px] uppercase tracking-widest font-extrabold text-deep-gold block mb-2">{t.activeSessions}</span>
          {sessionsLoading ? (
            <div className="py-6 text-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-gold border-t-transparent mx-auto" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-center text-xs text-[#7D7061]/60 italic py-6">{t.noSessions}</p>
          ) : (
            sessions.map((s) => (
              <button
                key={s.session_id}
                onClick={() => setActiveSessionId(s.session_id)}
                className={`w-full flex items-start space-x-3 rounded-xl p-3.5 text-left border transition text-xs font-bold transition-all cursor-pointer ${
                  activeSessionId === s.session_id 
                    ? 'bg-[#FFF9F2] text-[#4A3E31] border-primary-gold/35 shadow-sm' 
                    : 'border-transparent text-[#7D7061] hover:bg-cream/40 hover:text-[#2D241A]'
                }`}
              >
                <MessageSquare className={`h-4.5 w-4.5 mt-0.5 shrink-0 ${activeSessionId === s.session_id ? 'text-deep-gold' : 'text-[#7D7061]/50'}`} />
                <div className="truncate">
                  <span className="block truncate">{s.title}</span>
                  <span className="text-[9px] text-[#7D7061]/50 font-semibold block mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(s.created_at).toLocaleDateString()}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="p-4 border-t border-primary-gold/10 bg-[#FFFDF9] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Globe className="h-4 w-4 text-deep-gold" />
            <span className="text-[10px] font-bold text-[#7D7061] uppercase tracking-wider">{t.preferredLangLabel}</span>
          </div>
        </div>
      </aside>

      {/* Main Chat Interface */}
      <div className="flex-grow flex flex-col h-full bg-cream">
        
        {/* Mobile Header / Standard Topbar */}
        <header className="h-16 border-b border-primary-gold/10 bg-white px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-4">
            <Link to="/learner" className="p-2 md:hidden text-[#7D7061] hover:bg-cream rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center space-x-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-deep-gold to-primary-gold text-xs font-bold text-white shadow-sm shrink-0">
                <Sparkles className="h-4.5 w-4.5 text-white" />
              </span>
              <div>
                <h1 className="font-serif text-sm md:text-base font-extrabold text-[#2D241A] uppercase tracking-wide">{t.title}</h1>
                <p className="hidden sm:block text-[9px] text-[#7D7061] font-semibold">{t.subtitle}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button 
              onClick={handleStartNewSession}
              className="md:hidden flex h-8 w-8 items-center justify-center rounded-xl bg-deep-rose text-white shadow-md cursor-pointer"
              title={t.newChat}
            >
              <Plus className="h-4 w-4" />
            </button>
            <div className="inline-flex items-center space-x-1 px-3 py-1 bg-sage-green/20 text-green-800 text-[9px] font-extrabold uppercase tracking-wider border border-green-200/50 rounded-full">
              <span>Gemini Pro AI</span>
            </div>
          </div>
        </header>

        {/* Conversation Message Stage */}
        <div className="flex-grow overflow-y-auto p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3 bg-soft-rose/10 border border-soft-rose text-deep-rose rounded-xl text-xs font-semibold text-center">
              {errorMsg}
            </div>
          )}

          {messagesLoading && messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-gold border-t-transparent" />
              <span className="text-xs text-[#7D7061] font-bold">Loading chat history...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60%] max-w-xl mx-auto text-center space-y-6 px-4">
              <div className="h-16 w-16 bg-white border border-primary-gold/15 rounded-full flex items-center justify-center shadow-sm">
                <Sparkles className="h-8 w-8 text-deep-gold" />
              </div>
              <div className="space-y-2">
                <h3 className="font-serif text-lg font-bold text-[#2D241A]">{t.title}</h3>
                <p className="text-xs text-[#7D7061] font-semibold leading-relaxed">
                  {t.noMessages}
                </p>
              </div>

              {/* Quick Prompt Cards */}
              <div className="w-full text-left space-y-3 pt-4">
                <span className="text-[10px] font-extrabold tracking-widest text-[#7D7061] uppercase block text-center">
                  {t.quickPromptsHeader}
                </span>
                <div className="grid grid-cols-1 gap-3">
                  {[t.prompt1, t.prompt2, t.prompt3].map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickPromptClick(prompt)}
                      className="w-full p-4 bg-white hover:bg-[#FFF9F2] border border-primary-gold/15 hover:border-primary-gold/35 rounded-xl text-left text-xs font-bold text-[#4A3E31] flex items-center justify-between transition group cursor-pointer"
                    >
                      <span>{prompt}</span>
                      <ArrowUpRight className="h-4 w-4 text-deep-rose opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-5">
              {messages.map((m) => {
                const isUser = m.role === 'user';
                return (
                  <div 
                    key={m.message_id} 
                    className={`flex items-start gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-deep-gold to-primary-gold flex items-center justify-center shadow-sm shrink-0 font-bold text-white text-xs">
                        🤖
                      </div>
                    )}
                    
                    <div className={`max-w-[82%] rounded-2xl p-4 text-xs font-semibold leading-relaxed shadow-sm border ${
                      isUser 
                        ? 'bg-[#3D2D1E] text-[#FFF9F2] border-[#2D241A] rounded-tr-none' 
                        : 'bg-white text-[#3D2D1E] border-primary-gold/10 rounded-tl-none'
                    }`}>
                      <p className="whitespace-pre-line">{m.content}</p>
                      
                      <div className={`text-[9px] mt-2 block font-medium opacity-60 text-right`}>
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    {isUser && (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#3D2D1E] to-[#5C4533] flex items-center justify-center shadow-sm shrink-0 font-bold text-white text-[10px] uppercase">
                        {user?.name ? user.name[0].toUpperCase() : 'U'}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-start gap-3.5 justify-start">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-deep-gold to-primary-gold flex items-center justify-center shadow-sm shrink-0">
                    🤖
                  </div>
                  <div className="bg-white border border-primary-gold/10 rounded-2xl p-4 text-xs font-semibold rounded-tl-none shadow-sm flex items-center space-x-2">
                    <span className="text-[#7D7061] italic font-semibold">{t.typing}</span>
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-deep-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-deep-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-deep-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}

        </div>

        {/* Input Bar Stage */}
        <footer className="p-4 bg-white border-t border-primary-gold/10">
          <div className="max-w-3xl mx-auto flex items-center space-x-3.5">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              placeholder={t.inputPlaceholder}
              disabled={isTyping}
              className="flex-grow bg-cream/40 border border-primary-gold/15 hover:border-primary-gold/30 focus:border-deep-rose focus:ring-1 focus:ring-deep-rose rounded-xl px-4 py-3.5 text-xs font-bold text-[#3D2D1E] placeholder-[#7D7061]/50 focus:outline-none transition disabled:opacity-75"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isTyping}
              className="h-12 w-12 flex items-center justify-center rounded-xl bg-deep-rose hover:bg-deep-rose/95 text-white shadow-md disabled:bg-[#7D7061]/30 disabled:shadow-none transition-all duration-200 cursor-pointer"
              aria-label="Send message"
            >
              <Send className="h-4.5 w-4.5 text-white" />
            </button>
          </div>
        </footer>

      </div>

    </div>
  );
}

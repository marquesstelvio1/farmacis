import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquareText, Search, Camera, X, Send, Loader2, User, Bot, 
  Sparkles, Pill, FileImage
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface SplitSearchProps {
  onSearch?: (query: string) => void;
  onChatOpen?: (open: boolean) => void;
  className?: string;
}

const searchSections = [
  {
    id: "chat",
    icon: MessageSquareText,
    title: "Assistente IA",
    subtitle: "Tire suas dúvidas",
    color: "blue",
    gradient: "from-blue-500 to-indigo-500",
  },
  {
    id: "search",
    icon: Search,
    title: "Pesquisar",
    subtitle: "Nome ou doença",
    color: "slate",
    gradient: "from-slate-600 to-slate-700",
  },
  {
    id: "photo",
    icon: Camera,
    title: "Enviar Foto",
    subtitle: "Receita ou comprimido",
    color: "emerald",
    gradient: "from-emerald-500 to-teal-500",
  },
];

export function SplitSearch({ onSearch, onChatOpen, className = "" }: SplitSearchProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [assistantQuery, setAssistantQuery] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const assistantInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (chatMessages.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  useEffect(() => {
    if (activeSection === "search" && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [activeSection]);

  useEffect(() => {
    if (activeSection === "chat" && assistantInputRef.current) {
      assistantInputRef.current.focus();
    }
  }, [activeSection]);

  const handleSectionClick = (section: string) => {
    if (activeSection === section) {
      setActiveSection(null);
      return;
    }
    
    setActiveSection(section);
    
    if (section === "chat") {
      // Apenas expande
    }
  };

  const handleCloseChat = () => {
    setShowChat(false);
    onChatOpen?.(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        sessionStorage.setItem("uploadedPhoto", base64);
        window.location.href = "/identificar";
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
    setActiveSection(null);
  };

  const handleMultiSearch = async () => {
    const terms = searchQuery.split(',').map(s => s.trim()).filter(s => s.length > 0);
    if (terms.length === 0) return;

    const searchTerm = terms.join(', ');
    
    if (onSearch) {
      onSearch(searchTerm);
    }
    
    setSearchQuery('');
    setActiveSection(null);
  };


  const handleStartChat = () => {
    if (!assistantQuery.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: assistantQuery.trim(),
      timestamp: new Date(),
    };

    setChatMessages([userMessage]);
    setShowChat(true);
    onChatOpen?.(true);
    setAssistantQuery("");
    setActiveSection(null);
    setIsTyping(true);

    // Simulação de resposta da IA
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Olá! Recebi sua dúvida. Como posso te ajudar mais com relação a isso?",
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: chatInput.trim(),
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput("");
    setIsTyping(true);

    setTimeout(() => {
      const responses = [
        "Entendido! Posso ajudá-lo com informações sobre medicamentos, sintomas ou ajudá-lo a identificar um comprimido. O que gostaria de saber?",
        "Ótima pergunta! Deixe-me pesquisar informações relevantes para você.",
        "Com base na sua pergunta, recomendo que consulte a bula do medicamento ou fale com um profissional de saúde.",
      ];
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <>
      <div className={`w-full max-w-4xl mx-auto ${className} relative z-30`}>
      {/* Main Search Bar - Glassmorphism */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl shadow-blue-900/10 border border-white/40 dark:border-slate-700 overflow-hidden min-h-[100px] sm:min-h-[130px] flex items-stretch"
      >
        <div className="flex w-full divide-x divide-slate-200/50 dark:divide-slate-700/50">
            {searchSections.map((section, index) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              const isInactive = activeSection !== null && !isActive;
              
              return (
                <motion.div
                  key={section.id}
                  layout
                  animate={{ 
                    flex: isActive ? 1 : (isInactive ? 0 : 1),
                    opacity: isInactive ? 0 : 1,
                    width: isInactive ? 0 : "auto",
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className={`relative overflow-hidden flex flex-col items-center justify-center transition-all duration-300 ${
                    isActive ? 'bg-white dark:bg-slate-800' : isInactive ? 'pointer-events-none' : 'hover:bg-slate-50/50 dark:hover:bg-slate-700/50 cursor-pointer'
                  }`}
                  onClick={() => !isActive && handleSectionClick(section.id)}
                >
                  <AnimatePresence mode="wait">
                    {isActive && (section.id === "search" || section.id === "chat" || section.id === "photo") ? (
                      <motion.div 
                        key={`active-${section.id}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex items-center gap-3 px-4 sm:px-8 w-full h-full"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {section.id === "photo" ? (
                          <div className="flex-1 flex items-center justify-center gap-3 sm:gap-8">
                            <button 
                              onClick={() => fileInputRef.current?.click()}
                              className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 bg-slate-50 dark:bg-slate-700 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-2xl border border-slate-100 dark:border-slate-600 hover:border-teal-200 dark:hover:border-teal-800 transition-all group/btn"
                            >
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-xl flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                                <FileImage size={20} />
                              </div>
                              <div className="text-left">
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Explorador</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:block">Arquivos</p>
                              </div>
                            </button>
                            
                            <div className="w-px h-8 bg-slate-100" />

                            <button 
                              onClick={() => cameraInputRef.current?.click()}
                              className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 bg-slate-50 dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-2xl border border-slate-100 dark:border-slate-600 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all group/btn"
                            >
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                                <Camera size={20} />
                              </div>
                              <div className="text-left">
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Câmera</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:block">Tirar Foto</p>
                              </div>
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className={`flex-1 flex items-center bg-slate-50 dark:bg-slate-700 rounded-2xl border border-slate-100 dark:border-slate-600 px-4 focus-within:ring-2 transition-all ${section.id === 'chat' ? 'focus-within:ring-indigo-500/20 focus-within:border-indigo-500 dark:focus-within:border-indigo-400' : 'focus-within:ring-blue-500/20 focus-within:border-blue-500 dark:focus-within:border-blue-400'}`}>
                          {section.id === 'chat' ? <Sparkles size={18} className="text-indigo-400 dark:text-indigo-300 mr-2" /> : <Search size={18} className="text-slate-400 dark:text-slate-500 mr-2" />}
                          <input
                            ref={section.id === 'chat' ? assistantInputRef : searchInputRef}
                            type="text"
                            autoFocus
                            value={section.id === 'chat' ? assistantQuery : searchQuery}
                            onChange={(e) => section.id === 'chat' ? setAssistantQuery(e.target.value) : setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (section.id === 'chat' ? handleStartChat() : handleMultiSearch())}
                            placeholder={section.id === 'chat' ? "Pergunte algo ao assistente..." : "O que você procura hoje?"}
                            className="flex-1 bg-transparent border-none focus:ring-0 py-4 text-sm sm:text-base outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                          />
                          {(section.id === 'chat' ? assistantQuery : searchQuery) && (
                            <button onClick={() => section.id === 'chat' ? setAssistantQuery("") : setSearchQuery("")} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full">
                              <X size={14} className="text-slate-400 dark:text-slate-500" />
                            </button>
                          )}
                        </div>
                        <Button 
                          onClick={section.id === 'chat' ? handleStartChat : handleMultiSearch}
                          disabled={section.id === 'chat' ? !assistantQuery.trim() : !searchQuery.trim()}
                          className={`${section.id === 'chat' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 dark:shadow-indigo-900/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 dark:shadow-blue-900/30'} text-white rounded-xl px-6 h-[52px] font-bold hidden sm:flex shadow-lg transition-all`}
                        >
                          {section.id === 'chat' ? <Send size={18} /> : 'Buscar'}
                        </Button>
                          </>
                        )}
                        <button 
                          onClick={() => setActiveSection(null)}
                          className="p-3 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                        >
                          <X size={24} />
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="inactive-content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center text-center w-full h-full p-2 group"
                      >
                        <div 
                          className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-3 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md ${
                            isActive
                              ? `bg-gradient-to-br ${section.gradient} text-white`
                              : section.id === 'chat' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white' :
                                section.id === 'photo' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white' :
                                'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400 group-hover:bg-slate-800 group-hover:text-white'
                          }`}
                        >
                          <Icon size={26} strokeWidth={2.5} className="transition-colors" />
                        </div>
                        <p className="font-bold text-[10px] sm:text-xs md:text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {section.title}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Quick Actions Hints - hidden when a section is active */}
        {!activeSection && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-3 sm:gap-6 mt-3 sm:mt-4 text-[10px] sm:text-xs text-slate-400 dark:text-slate-500"
          >
            <span className="flex items-center gap-1">
              <Sparkles size={10} className="sm:size-12" />
              <span className="hidden sm:inline">IA</span>
            </span>
            <span className="w-1 h-1 bg-slate-300 rounded-full" />
            <span className="flex items-center gap-1">
              <Pill size={10} className="sm:size-12" />
              <span className="hidden sm:inline">Medicamentos</span>
            </span>
            <span className="w-1 h-1 bg-slate-300 rounded-full" />
            <span className="flex items-center gap-1">
              <FileImage size={10} className="sm:size-12" />
              <span className="hidden sm:inline">Receitas</span>
            </span>
          </motion.div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* AI Chat Modal */}
 

      <AnimatePresence>
        {showChat && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowChat(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-800 shadow-2xl z-[101] flex flex-col"
            >
              {/* Chat Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                      <Bot size={28} className="text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">Assistente IA</h3>
                    <p className="text-blue-100 text-sm flex items-center gap-1">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                      </span>
                      Online agora
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseChat}
                  className="p-3 text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-gradient-to-b from-slate-50 dark:from-slate-900 to-white dark:to-slate-800">
                {chatMessages.length === 0 && (
                  <div className="text-center py-10">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-100 dark:from-blue-900/30 to-indigo-100 dark:to-indigo-900/30 flex items-center justify-center mx-auto mb-5 shadow-lg">
                      <Bot size={40} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-lg mb-2">Olá! Sou seu assistente de saúde 🤖</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto leading-relaxed">
                      Posso ajudá-lo a identificar medicamentos, tirar dúvidas sobre sintomas, dosagem ou interações medicamentosas.
                    </p>
                    
                    {/* Quick Questions */}
                    <div className="flex flex-wrap justify-center gap-2 mt-6">
                      {[
                        "Paracetamol para dor de cabeça?",
                        "Identificar medicamento",
                        "Dosagem de ibuprofeno"
                      ].map((q, i) => (
                        <button
                          key={i}
                          onClick={() => setChatInput(q)}
                          className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full text-sm text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {chatMessages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`flex items-end gap-3 max-w-[85%] ${
                      message.role === "user" ? "flex-row-reverse" : "flex-row"
                    }`}>
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                        message.role === "user" 
                          ? "bg-gradient-to-br from-blue-500 to-blue-600" 
                          : "bg-gradient-to-br from-slate-100 dark:from-slate-700 to-slate-200 dark:to-slate-800"
                      }`}>
                        {message.role === "user" ? (
                          <User size={18} className="text-white" />
                        ) : (
                          <Bot size={18} className="text-slate-600 dark:text-slate-400" />
                        )}
                      </div>
                      <div className={`px-5 py-4 rounded-3xl shadow-sm ${
                        message.role === "user"
                          ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md"
                          : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-bl-md border border-slate-100 dark:border-slate-600"
                      }`}>
                        <p className="text-[15px] leading-relaxed">{message.content}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {isTyping && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-100 dark:from-slate-700 to-slate-200 dark:to-slate-800 flex items-center justify-center">
                      <Bot size={18} className="text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="px-5 py-4 bg-white dark:bg-slate-700 rounded-3xl rounded-bl-md border border-slate-100 dark:border-slate-600 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                          <span className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                        <span className="text-slate-500 dark:text-slate-400 text-sm ml-1">a digitar...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-5 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Digite sua dúvida sobre saúde..."
                    className="flex-1 px-5 py-4 bg-slate-100 dark:bg-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white dark:focus:bg-slate-600 transition-all text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isTyping}
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-40 p-0 shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
                  >
                    {isTyping ? (
                      <Loader2 size={22} className="animate-spin text-white" />
                    ) : (
                      <Send size={22} className="text-white" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <div className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center">
                    <span className="text-amber-600 text-xs">⚠️</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Não substitui orientação médica profissional
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

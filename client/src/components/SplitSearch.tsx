import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  MessageSquareText, Search, Camera, X, Send, Loader2, User, Bot,
  Sparkles, Pill, FileImage
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrescriptionOCR } from "./PrescriptionOCR";

import ReactMarkdown from 'react-markdown';

// Helper to render message content with clickable catalog links
function renderMessageContent(content: string) {
  // Converte [[Medicamento]] em links clicáveis para o catálogo
  const withLinks = content.replace(
    /\[\[([^\]]+)\]\]/g,
    (_, name) => `[**${name}**](/catalogo?search=${encodeURIComponent(name)})`
  );

  // Converte formato antigo "Ver no catalogo: /catalogo?search=X"
  const processed = withLinks.replace(
    /Ver no catalogo: (\/catalogo\?search=\S+)/g,
    (_, path) => {
      const term = decodeURIComponent(path.split('search=')[1]);
      return `[**${term}**](${path})`;
    }
  );

  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2">{children}</ol>,
        li: ({ children }) => <li className="text-[15px]">{children}</li>,
        a: ({ href, children }) => (
          // Link clicável com estilo de pílula verde
          <Link
            to={href || '#'}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 border border-green-200 text-green-700 font-semibold rounded-full text-sm hover:bg-green-100 hover:border-green-400 transition-all cursor-pointer"
          >
            <Pill size={14} /> {children}
          </Link>
        ),
        h3: ({ children }) => <h3 className="font-bold text-base mb-1 mt-2">{children}</h3>,
        h4: ({ children }) => <h4 className="font-semibold text-sm mb-1 mt-2">{children}</h4>,
        code: ({ children }) => (
          <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded text-sm font-mono">
            {children}
          </code>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-green-400 pl-3 italic text-slate-600 mb-2">
            {children}
          </blockquote>
        ),
      }}
    >
      {processed}
    </ReactMarkdown>
  );
}

const ASSISTANT_ENABLED = import.meta.env.VITE_ASSISTANT_ENABLED !== 'false';
const ASSISTANT_CATALOG_INTEGRATION = import.meta.env.VITE_ASSISTANT_CATALOG_INTEGRATION !== 'false';
const ASSISTANT_MAX_CATALOG_RESULTS = parseInt(import.meta.env.VITE_ASSISTANT_MAX_CATALOG_RESULTS || '5', 10);

const AI_PROVIDER = 'vanessa';
const AI_API_KEY = import.meta.env.VITE_AI_API_KEY || '';

const PROVIDER_NAMES = {
  vanessa: 'Vanessa AI',
};

interface CatalogProduct {
  id: number;
  name: string;
  description: string;
  price: string;
  precoPortugues?: string;
  precoIndiano?: string;
  activeIngredient?: string;
  dosage?: string;
  imageUrl?: string;
  origin?: string;
}

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
  const [suggestedProducts, setSuggestedProducts] = useState<CatalogProduct[]>([]);
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
  };

  const handleCloseChat = () => {
    setShowChat(false);
    onChatOpen?.(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Full = reader.result as string;
        const base64 = base64Full.split(',')[1];

        setShowChat(true);
        onChatOpen?.(true);
        setActiveSection(null);

        const userMessage: Message = {
          id: Date.now().toString(),
          role: "user",
          content: `[Imagem enviada] Analisa esta imagem médica/receita.`,
          timestamp: new Date(),
        };
        setChatMessages(prev => [...prev, userMessage]);
        setIsTyping(true);

        if (AI_API_KEY || AI_PROVIDER === 'vanessa') {
          try {
            const visionText = 'Analisa esta imagem médica ou receita. Extrai apenas os nomes dos medicamentos e as suas dosagens. Responde formatado assim: "Medicamento 1 (dosagem), Medicamento 2 (dosagem)". Se identificares vários, separa por vírgulas. No final, podes dar uma breve explicação do que viste.';
            const aiResponse = await callAIProvider(visionText, base64);

            const firstLine = aiResponse.split('\n')[0];
            const potentialSearch = firstLine.replace(/[\[\]]/g, '').trim();

            if (potentialSearch.length > 3 && potentialSearch.length < 100) {
              setSearchQuery(potentialSearch);
              setActiveSection('search');

              const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: `Identifiquei estes medicamentos na tua foto: **${potentialSearch}**. Já os coloquei na barra de pesquisa para ti!\n\n${aiResponse}`,
                timestamp: new Date(),
              };
              setChatMessages(prev => [...prev, assistantMessage]);
            } else {
              const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: aiResponse,
                timestamp: new Date(),
              };
              setChatMessages(prev => [...prev, assistantMessage]);
            }
          } catch (error) {
            console.error('Vision API error:', error);
            const errorMessage: Message = {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: 'Desculpe, não consegui analisar a imagem. Tenta novamente ou descreve o que vês na foto.',
              timestamp: new Date(),
            };
            setChatMessages(prev => [...prev, errorMessage]);
          }
        } else {
          const fallbackMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `Recebi a tua imagem! Infelizmente, o assistente ${PROVIDER_NAMES[AI_PROVIDER]} não está configurado. Descreve o que vês na foto que eu ajudo.`,
            timestamp: new Date(),
          };
          setChatMessages(prev => [...prev, fallbackMessage]);
        }

        setIsTyping(false);
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

    setTimeout(() => {
      handleSendMessageFromStart(userMessage.content);
    }, 100);
  };

  const handleSendMessageFromStart = async (content: string) => {
    setIsTyping(true);
    setSuggestedProducts([]);

    if (ASSISTANT_CATALOG_INTEGRATION && isMedicationQuery(content)) {
      const products = await searchCatalog(content);

      if (products.length > 0) {
        setSuggestedProducts(products);

        const validProducts = products.filter(p => p.name && p.price);
        if (validProducts.length === 0) {
          const aiResponse = await callAIProvider(content);
          setChatMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: aiResponse,
            timestamp: new Date(),
          }]);
          setIsTyping(false);
          return;
        }

        let catalogText = `Encontrei ${validProducts.length} produto(s) no catálogo:\n\n`;
        validProducts.forEach((p, index) => {
          const formatPrice = (pr: any) => {
            const num = Number(pr);
            return !isNaN(num) && num > 0
              ? num.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })
              : 'Sob consulta';
          };

          let details = `${p.name}`;
          const originPrices = [];

          if (p.precoPortugues) originPrices.push(`Portugal: ${formatPrice(p.precoPortugues)}`);
          if (p.precoIndiano) originPrices.push(`Índia: ${formatPrice(p.precoIndiano)}`);

          if (originPrices.length > 0) {
            details += ` (${originPrices.join(' | ')})`;
          } else {
            details += ` - ${formatPrice(p.price)}`;
          }

          catalogText += `${index + 1}. ${details}\n`;
        });

        const aiResponse = await callAIProvider(`${content}\n\n${catalogText}`);
        setChatMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: aiResponse,
          timestamp: new Date(),
        }]);
      } else {
        const aiResponse = await callAIProvider(content);
        setChatMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: aiResponse,
          timestamp: new Date(),
        }]);
      }
    } else {
      const aiResponse = await callAIProvider(content);
      setChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      }]);
    }

    setIsTyping(false);
  };

  const isMedicationQuery = (query: string): boolean => {
    const medicationKeywords = [
      'medicamento', 'remédio', 'comprimido', 'comprimidos', 'pílula', 'pílulas',
      'droga', 'fármaco', 'prescrição', 'receita', 'tratamento', 'cura',
      'dor', 'febre', 'gripe', 'tosse', 'dor de cabeça', 'enxaqueca',
      'paracetamol', 'ibuprofeno', 'amoxicilina', 'aspirina', 'dipirona',
      'antibiótico', 'anti-inflamatório', 'analgesico', 'analgésico',
      'antialérgico', 'antigripal', 'vitamina', 'suplemento',
      'produto', 'produtos', 'item', 'items', 'catálogo', 'catalogo'
    ];
    const lowerQuery = query.toLowerCase();
    return medicationKeywords.some(keyword => lowerQuery.includes(keyword));
  };

  const searchCatalog = async (query: string): Promise<CatalogProduct[]> => {
    if (!ASSISTANT_CATALOG_INTEGRATION) return [];

    try {
      const response = await fetch(`/api/products?search=${encodeURIComponent(query)}`);
      if (!response.ok) return [];
      const products = await response.json();
      return products.slice(0, ASSISTANT_MAX_CATALOG_RESULTS).map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        price: p.price,
        precoPortugues: p.precoPortugues,
        precoIndiano: p.precoIndiano,
        activeIngredient: p.activeIngredient,
        dosage: p.dosage,
        imageUrl: p.imageUrl,
        origin: p.origin
      }));
    } catch (error) {
      console.error('Error searching catalog:', error);
      return [];
    }
  };

  const callAIProvider = async (text: string, imageBase64?: string): Promise<string> => {
    try {
      const conversationHistory = chatMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          imageBase64: imageBase64 || null,
          conversationHistory,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('AI Proxy error:', response.status, errorData);
        throw new Error(errorData.message || `Erro do servidor (${response.status})`);
      }

      const data = await response.json();
      return data.output_text || 'Desculpe, não consegui processar a tua mensagem.';
    } catch (error: any) {
      console.error('AI provider error:', error);
      return `Erro ao contactar o assistente Vanessa: ${error.message}`;
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    if (!ASSISTANT_ENABLED) {
      setChatMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: "O assistente está temporariamente desativado. Por favor, tente novamente mais tarde.",
        timestamp: new Date(),
      }]);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: chatInput.trim(),
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput("");
    setIsTyping(true);
    setSuggestedProducts([]);

    if (ASSISTANT_CATALOG_INTEGRATION && isMedicationQuery(userMessage.content)) {
      const products = await searchCatalog(userMessage.content);

      if (products.length > 0) {
        setSuggestedProducts(products);

        const validProducts = products.filter(p => p.name && p.price);
        if (validProducts.length === 0) {
          const aiResponse = await callAIProvider(userMessage.content);
          setChatMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: aiResponse,
            timestamp: new Date(),
          }]);
          setIsTyping(false);
          return;
        }

        let catalogText = `Encontrei ${validProducts.length} produto(s) no catálogo:\n\n`;
        validProducts.forEach((p, index) => {
          const formatPrice = (pr: any) => {
            const num = Number(pr);
            return !isNaN(num) && num > 0
              ? num.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })
              : 'Sob consulta';
          };

          let details = `${p.name}`;
          const originPrices = [];

          if (p.precoPortugues) originPrices.push(`Portugal: ${formatPrice(p.precoPortugues)}`);
          if (p.precoIndiano) originPrices.push(`Índia: ${formatPrice(p.precoIndiano)}`);

          if (originPrices.length > 0) {
            details += ` (${originPrices.join(' | ')})`;
          } else {
            details += ` - ${formatPrice(p.price)}`;
          }

          catalogText += `${index + 1}. ${details}\n`;
        });

        const aiResponse = await callAIProvider(`${userMessage.content}\n\n${catalogText}`);
        setChatMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: aiResponse,
          timestamp: new Date(),
        }]);
      } else {
        const aiResponse = await callAIProvider(userMessage.content);
        setChatMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: aiResponse,
          timestamp: new Date(),
        }]);
      }
    } else {
      const aiResponse = await callAIProvider(userMessage.content);
      setChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      }]);
    }

    setIsTyping(false);
  };

  // ─── CHAT MODAL (renderizado via Portal directo no document.body) ───
  const chatModal = (
    <AnimatePresence>
      {showChat && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowChat(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15,23,42,0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 9998,
            }}
          />

          {/* Modal Panel */}
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[9999] bg-white flex flex-col overflow-hidden sm:left-auto sm:w-full sm:max-w-md"
          >
            {/* Chat Header */}
            <div className="flex-shrink-0 p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center relative">
                    <Bot size={28} className="text-white" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                  </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Assistente IA</h3>
                  <p className="text-green-100 text-sm flex items-center gap-1">
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

            {/* Chat Messages — flex:1 + minHeight:0 é o segredo */}
            <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-5 bg-white">
              {chatMessages.length === 0 && (
                <div className="text-center py-10">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mx-auto mb-5 shadow-lg">
                    <Bot size={40} className="text-green-600" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-lg mb-2">Olá! Sou seu assistente de saúde 🤖</h4>
                  <p className="text-slate-500 text-sm max-w-xs mx-auto leading-relaxed">
                    Posso ajudá-lo a identificar medicamentos, tirar dúvidas sobre sintomas, dosagem ou interações medicamentosas.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 mt-6">
                    {[
                      "Paracetamol para dor de cabeça?",
                      "Identificar medicamento",
                      "Dosagem de ibuprofeno"
                    ].map((q, i) => (
                      <button
                        key={i}
                        onClick={() => setChatInput(q)}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm text-slate-600 hover:bg-green-50 hover:border-green-200 hover:text-green-600 transition-all shadow-sm"
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
                  <div className={`flex items-end gap-3 max-w-[85%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                      message.role === "user"
                        ? "bg-gradient-to-br from-green-500 to-green-600"
                        : "bg-gradient-to-br from-slate-100 to-slate-200"
                    }`}>
                      {message.role === "user" ? (
                        <User size={18} className="text-white" />
                      ) : (
                        <Bot size={18} className="text-slate-600" />
                      )}
                    </div>
                    <div className={`px-5 py-4 rounded-3xl shadow-sm ${
                      message.role === "user"
                        ? "bg-gradient-to-br from-green-500 to-green-600 text-white rounded-br-md"
                        : "bg-white text-slate-700 rounded-bl-md border border-slate-100"
                    }`}>
                      <div className="text-[15px] leading-relaxed">
                        {message.role === "assistant"
                          ? renderMessageContent(message.content)
                          : message.content}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <Bot size={18} className="text-slate-600" />
                  </div>
                  <div className="px-5 py-4 bg-white rounded-3xl rounded-bl-md border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2.5 h-2.5 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      <span className="text-slate-500 text-sm ml-1">a digitar...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="flex-shrink-0 p-5 border-t border-slate-100 bg-white shadow-lg">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Digite sua dúvida sobre saúde..."
                  className="flex-1 px-5 py-4 bg-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
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
                <p className="text-xs text-slate-500">
                  Não substitui orientação médica profissional
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <div className={`w-full max-w-4xl mx-auto ${className} relative z-30`}>
        {/* Main Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl shadow-green-900/10 border border-white/40 overflow-visible min-h-[100px] sm:min-h-[130px] flex items-stretch"
        >
          <div className="flex w-full divide-x divide-slate-200/50">
            {searchSections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              const hasActiveSection = activeSection !== null;

              return (
                <motion.div
                  key={section.id}
                  initial={{ flex: '1 1 0%' }}
                  animate={{
                    flex: isActive ? '1 1 100%' : (hasActiveSection ? '0 0 0%' : '1 1 0%'),
                    opacity: isActive ? 1 : (hasActiveSection ? 0 : 1),
                  }}
                  transition={{ type: "spring", stiffness: 200, damping: 25, mass: 0.8 }}
                  className={`relative flex flex-col items-center justify-center transition-all duration-300 overflow-hidden rounded-2xl sm:rounded-3xl ${isActive
                    ? 'bg-white'
                    : 'hover:bg-slate-50/50 cursor-pointer'
                  }`}
                  onClick={() => !isActive && handleSectionClick(section.id)}
                  style={{ display: hasActiveSection && !isActive ? 'none' : 'flex' }}
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
                          <div className="flex-1 overflow-y-auto py-2">
                            <PrescriptionOCR />
                          </div>
                        ) : (
                          <>
                            <div className={`flex-1 flex items-center bg-slate-50 rounded-2xl border border-slate-100 px-4 focus-within:ring-2 transition-all ${section.id === 'chat' ? 'focus-within:ring-indigo-500/20 focus-within:border-indigo-500' : 'focus-within:ring-green-500/20 focus-within:border-green-500'}`}>
                              {section.id === 'chat' ? <Sparkles size={18} className="text-indigo-400 mr-2" /> : <Search size={18} className="text-slate-400 mr-2" />}
                              <input
                                ref={section.id === 'chat' ? assistantInputRef : searchInputRef}
                                type="text"
                                autoFocus
                                value={section.id === 'chat' ? assistantQuery : searchQuery}
                                onChange={(e) => section.id === 'chat' ? setAssistantQuery(e.target.value) : setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (section.id === 'chat' ? handleStartChat() : handleMultiSearch())}
                                placeholder={section.id === 'chat' ? "Pergunte algo ao assistente..." : "O que você procura hoje?"}
                                className="flex-1 bg-transparent border-none focus:ring-0 py-4 text-sm sm:text-base outline-none text-slate-700 placeholder:text-slate-400"
                              />
                              {(section.id === 'chat' ? assistantQuery : searchQuery) && (
                                <button onClick={() => section.id === 'chat' ? setAssistantQuery("") : setSearchQuery("")} className="p-1 hover:bg-slate-200 rounded-full">
                                  <X size={14} className="text-slate-400" />
                                </button>
                              )}
                            </div>
                            <Button
                              onClick={section.id === 'chat' ? handleStartChat : handleMultiSearch}
                              disabled={section.id === 'chat' ? !assistantQuery.trim() : !searchQuery.trim()}
                              className={`${section.id === 'chat' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-green-600 hover:bg-green-700 shadow-green-200'} text-white rounded-xl px-6 h-[52px] font-bold hidden sm:flex shadow-lg transition-all`}
                            >
                              {section.id === 'chat' ? <Send size={18} /> : 'Buscar'}
                            </Button>
                          </>
                        )}
                        <button
                          onClick={() => setActiveSection(null)}
                          className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
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
                          className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-3 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md ${isActive
                            ? `bg-gradient-to-br ${section.gradient} text-white`
                            : section.id === 'chat' ? 'bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white' :
                              section.id === 'photo' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white' :
                                'bg-slate-50 text-slate-600 group-hover:bg-slate-800 group-hover:text-white'
                          }`}
                        >
                          <Icon size={22} strokeWidth={2} className="transition-colors sm:size-24" />
                        </div>
                        <p className="font-bold text-[9px] sm:text-xs text-slate-700 whitespace-nowrap">
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

        {/* Quick Actions Hints */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-3 sm:gap-6 mt-3 sm:mt-4 text-[10px] sm:text-xs text-slate-400"
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

      {/* AI Chat Modal — Portal directo no document.body */}
      {createPortal(chatModal, document.body)}
    </>
  );
}
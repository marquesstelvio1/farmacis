import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Headphones,
  MessageCircle,
  Mail,
  Phone,
  FileQuestion,
  ChevronRight,
  Send,
  Clock,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const faqItems = [
  {
    question: "Como faço um pedido?",
    answer: "Navegue no catálogo, adicione produtos ao carrinho e finalize a compra no checkout."
  },
  {
    question: "Quanto tempo demora a entrega?",
    answer: "As entregas em Luanda são feitas no mesmo dia ou em 24 horas, dependendo da farmácia."
  },
  {
    question: "Posso cancelar um pedido?",
    answer: "Sim, pode cancelar enquanto o pedido estiver com status 'Pendente'. Após confirmação, entre em contacto com o suporte."
  },
  {
    question: "Como funciona o Modo Receita?",
    answer: "No Modo Receita, pode configurar lembretes para tomar medicamentos nos horários definidos."
  }
];

const contactMethods = [
  {
    icon: Phone,
    label: "Telefone",
    value: "+244 923 456 789",
    available: "Seg-Sex, 8h-18h"
  },
  {
    icon: Mail,
    label: "E-mail",
    value: "suporte@brocolis.ao",
    available: "24h (resposta em 24h)"
  },
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: "+244 923 456 789",
    available: "Seg-Sex, 8h-20h"
  }
];

export default function Suporte() {
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o assunto e a mensagem.",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    // Simulação de envio
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSending(false);

    toast({
      title: "Mensagem enviada",
      description: "A nossa equipa entrará em contacto em breve."
    });

    setSubject("");
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h1 className="font-bold text-lg text-slate-900">Suporte</h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Contact Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 gap-3"
        >
          {contactMethods.map((method, index) => {
            const Icon = method.icon;
            return (
              <motion.div
                key={method.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 text-sm">{method.label}</h3>
                  <p className="text-slate-900">{method.value}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    {method.available}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <FileQuestion className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-slate-800 text-sm">Perguntas Frequentes</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {faqItems.map((item, index) => (
              <div key={index} className="px-4 py-3">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <span className="font-medium text-slate-700 text-sm">{item.question}</span>
                  <ChevronRight
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      expandedFaq === index ? "rotate-90" : ""
                    }`}
                  />
                </button>
                {expandedFaq === index && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="text-sm text-slate-600 mt-2 pr-6"
                  >
                    {item.answer}
                  </motion.p>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-slate-200 p-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <Headphones className="w-5 h-5 text-purple-600" />
            <h2 className="font-bold text-slate-800 text-sm">Envie uma mensagem</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Assunto</label>
              <Input
                placeholder="Ex: Problema com pedido #1234"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="border-slate-200"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Mensagem</label>
              <Textarea
                placeholder="Descreva o seu problema ou dúvida..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="border-slate-200 min-h-[120px]"
              />
            </div>
            <Button
              type="submit"
              disabled={isSending}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar mensagem
                </>
              )}
            </Button>
          </form>
        </motion.div>

        {/* Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-green-50 rounded-2xl border border-green-200 p-4 flex items-center gap-3"
        >
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <div>
            <p className="font-medium text-green-800 text-sm">Todos os sistemas operacionais</p>
            <p className="text-xs text-green-600">Tempo de resposta médio: 2 horas</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

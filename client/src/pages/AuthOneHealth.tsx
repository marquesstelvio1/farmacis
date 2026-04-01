import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ArrowLeft, Loader2, Mail } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface AuthOneHealthProps {
  emailToVerify: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

const AuthOneHealth = ({ emailToVerify, onSuccess, onCancel }: AuthOneHealthProps) => {
  const [step, setStep] = useState(1); // 1: Telefone, 2: Código
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const { toast } = useToast();

  const handleSendOTP = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToVerify }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || "Erro interno no servidor de e-mail");
      }
      
      setStep(2);
      toast({ title: "Código enviado!", description: `Verifique o e-mail: ${emailToVerify}` });
    } catch (error: any) {
      toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length < 6) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToVerify, otp }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message);
      }

      onSuccess();
    } catch (error: any) {
      toast({ title: "Erro na validação", description: error.message, variant: "destructive" });
      setOtp(''); // Limpa o campo se estiver errado
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-slate-900 p-1">
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="text-blue-600 dark:text-blue-400" size={28} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Verificação por E-mail</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Validamos o seu telemóvel através de um código enviado para {emailToVerify}</p>
            </div>

            <Button 
              onClick={handleSendOTP}
              disabled={loading}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/20"
            >
              {loading ? <Loader2 className="animate-spin mr-2" /> : <Mail className="mr-2" size={20} />}
              Receber Código de Verificação
            </Button>
            
            {onCancel && (
              <button onClick={onCancel} className="w-full text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                Voltar
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 text-center"
          >
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Verifique o seu E-mail</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Enviámos um código para <span className="font-bold text-blue-600">{emailToVerify}</span> para confirmar as alterações.
              </p>
            </div>

            <input 
              type="text" 
              maxLength={6}
              value={otp}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setOtp(val);
                if (val.length === 6) handleVerifyOTP();
              }}
              placeholder="000000"
              className="w-full p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-100 dark:border-blue-800 rounded-2xl text-center text-4xl font-black tracking-[8px] text-blue-600 dark:text-blue-400 outline-none focus:border-blue-500"
            />

            <Button 
              onClick={handleVerifyOTP}
              disabled={loading || otp.length < 6}
              className="w-full h-14 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold text-lg"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Confirmar e Validar"}
            </Button>

            <button 
              onClick={() => setStep(1)}
              className="text-sm text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center mx-auto gap-2"
            >
              <ArrowLeft size={14} /> Voltar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuthOneHealth;
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
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
    <div className="w-full max-w-md mx-auto bg-white p-1">
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
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm" style={{ backgroundColor: "#b5f176" }}>
                <Mail className="text-white" size={28} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Verificação por E-mail</h2>
              <p className="text-slate-500 text-sm">Validamos o seu telemóvel através de um código enviado para {emailToVerify}</p>
            </div>

            <Button 
              onClick={handleSendOTP}
              disabled={loading}
              className="w-full h-12 text-white font-bold rounded-full transition-all hover:shadow-lg"
              style={{ backgroundColor: "#072a1c" }}
            >
              {loading ? <Loader2 className="animate-spin mr-2" /> : <Mail className="mr-2" size={20} />}
              Receber Código de Verificação
            </Button>
            
            {onCancel && (
              <button onClick={onCancel} className="w-full text-sm hover:text-slate-700 transition-colors" style={{ color: "#607369" }}>
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
              <h2 className="text-2xl font-bold text-slate-900">Verifique o seu E-mail</h2>
              <p className="text-slate-500 text-sm">
                Enviámos um código para <span className="font-bold text-green-700">{emailToVerify}</span> para confirmar as alterações.
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
              className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-center text-4xl font-black tracking-[8px] text-slate-800 outline-none focus:border-green-500"
            />

            <Button 
              onClick={handleVerifyOTP}
              disabled={loading || otp.length < 6}
              className="w-full h-12 text-white font-bold rounded-full transition-all hover:shadow-lg"
              style={{ backgroundColor: "#072a1c" }}
            >
              {loading ? <Loader2 className="animate-spin" /> : "Confirmar e Validar"}
            </Button>

            <button 
              onClick={() => setStep(1)}
              className="text-sm hover:text-slate-700 transition-colors flex items-center justify-center mx-auto gap-2"
              style={{ color: "#607369" }}
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
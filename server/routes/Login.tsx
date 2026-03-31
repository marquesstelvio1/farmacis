import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Activity, Loader2, Lock, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function ProfessionalLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/professionals/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("professionalSession", JSON.stringify(data.user));
        toast({
          title: "Bem-vindo!",
          description: "Login realizado com sucesso.",
        });
        setLocation("/profissional/dashboard");
      } else {
        toast({
          title: "Erro de Acesso",
          description: data.message || "Credenciais inválidas.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro no Servidor",
        description: "Não foi possível conectar ao serviço.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="absolute top-8 left-8">
        <Link href="/">
          <Button variant="ghost" className="text-slate-400 hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Início
          </Button>
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900 border border-white/10 p-8 rounded-3xl shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
            <Activity className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white">Portal do Especialista</h1>
          <p className="text-slate-400 text-sm mt-2">Aceda à sua agenda e gestão de pacientes</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300">Email Profissional</Label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 group-focus-within:text-indigo-400 transition-colors" />
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white rounded-xl focus:ring-indigo-500/50 outline-none transition-all placeholder:text-slate-600"
                placeholder="nome@especialista.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" title="password" className="text-slate-300">Palavra-passe</Label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 group-focus-within:text-indigo-400 transition-colors" />
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white rounded-xl focus:ring-indigo-500/50 outline-none transition-all placeholder:text-slate-600"
                placeholder="••••••••"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold h-12 rounded-xl mt-4 shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
          >
            {isLoading ? <Loader2 className="animate-spin mr-2" /> : "Entrar no Painel"}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-slate-500 text-xs">
            Problemas com o acesso? Entre em contacto com o suporte administrativo.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, User, Eye, EyeOff, Pill, Mail, ArrowLeft, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import AuthOneHealth from "./AuthOneHealth";
import { useToast } from "@/hooks/use-toast";

interface RegisterProps {
  onRegister: () => void;
}

export default function Register({ onRegister }: RegisterProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
   phone: "",
    password: "",
   confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPhoneAuth, setShowPhoneAuth] = useState(false);
  const [isPhoneValidated, setIsPhoneValidated] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    const subNumber = digits.startsWith("244") ? digits.slice(3) : digits;
    const limited = subNumber.slice(0, 9);
    
    const parts = [];
    if (limited.length > 0) parts.push(limited.slice(0, 3));
    if (limited.length > 3) parts.push(limited.slice(3, 6));
    if (limited.length > 6) parts.push(limited.slice(6, 9));
    
    return limited.length > 0 ? "+244 " + parts.join(" ") : "";
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!formData.name.trim()) {
      setError("Nome é obrigatório");
      return;
    }

    if (!validateEmail(formData.email)) {
      setError("Email inválido");
      return;
    }

    if (formData.password.length < 6) {
      setError("Senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Senhas não coincidem");
      return;
    }

    // Se ainda não validou o telefone via e-mail, mostra o componente AuthOneHealth
    if (!isPhoneValidated) {
      setShowPhoneAuth(true);
      return;
    }

    setIsLoading(true);

    try {
      const normalizedEmail = formData.email.trim().toLowerCase();
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
         email: normalizedEmail,
        phone: formData.phone || null,
          password: formData.password,
        confirmPassword: formData.confirmPassword,
        }),

      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro ao criar conta");
      }

      setSuccess("Conta criada com sucesso!");
      setFormData({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
      
      // Redirect to login after 3 seconds

    } catch (err: any) {
      setError(err.message || "Erro ao criar conta");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#f7f7f7" }}>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Card className="rounded-3xl p-2 shadow-lg border border-slate-100 bg-white">
          <CardHeader className="space-y-1 text-center pb-8">
            <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-sm" style={{ backgroundColor: "#b5f176" }}>
              <Pill className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">
              Criar Conta
            </CardTitle>
            <CardDescription className="text-slate-500">
              Registre-se para acessar a farmácia
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showPhoneAuth ? (
              <AuthOneHealth 
                emailToVerify={formData.email}
                onSuccess={() => {
                  setIsPhoneValidated(true);
                  setShowPhoneAuth(false);
                  toast({ title: "E-mail Validado!", description: "Telemóvel confirmado. Clique em concluir para criar a conta." });
                }}
                onCancel={() => setShowPhoneAuth(false)}
              />
            ) : (
              <>
              <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold" style={{ color: "#607369" }}>
                  Nome Completo
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Digite seu nome completo"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-10 h-12 border-slate-200 rounded-2xl focus:border-green-500 focus:ring-green-500/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold" style={{ color: "#607369" }}>
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Digite seu email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 h-12 border-slate-200 rounded-2xl focus:border-green-500 focus:ring-green-500/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
               <Label htmlFor="phone" className="text-sm font-semibold" style={{ color: "#607369" }}>
                 Telefone (Opcional)
               </Label>
               <div className="relative">
                 <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                 <Input
                  id="phone"
                   type="tel"
                   placeholder="+244 9XX XXX XXX"
                   value={formData.phone}
                   onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
                   className="pl-10 h-12 border-slate-200 rounded-2xl focus:border-green-500 focus:ring-green-500/20"
                 />
               </div>
             </div>

              <div className="space-y-2">
               <Label htmlFor="password" className="text-sm font-semibold" style={{ color: "#607369" }}>
                 Senha
               </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 pr-10 h-12 border-slate-200 rounded-2xl focus:border-green-500 focus:ring-green-500/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold" style={{ color: "#607369" }}>
                  Confirmar Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirme sua senha"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="pl-10 pr-10 h-12 border-slate-200 rounded-2xl focus:border-green-500 focus:ring-green-500/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm text-center"
                >
                  {error}
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-600 text-sm text-center"
                >
                  {success}
                </motion.div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-white font-bold rounded-full transition-all hover:shadow-lg"
                style={{ backgroundColor: "#072a1c" }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Criando conta...
                  </span>
                ) : (
                  isPhoneValidated ? "Concluir Registo" : "Verificar E-mail e Continuar"
                )}
              </Button>
            </form>

            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={onRegister}
                className="flex items-center justify-center gap-2 text-sm hover:text-slate-700 transition-colors"
                style={{ color: "#607369" }}
              >
                <ArrowLeft className="w-4 h-4" />
                Já tem uma conta? Faça login
              </button>
            </div>
            </>
          )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

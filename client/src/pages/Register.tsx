import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, User, Eye, EyeOff, Pill, Mail, ArrowLeft, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";

interface RegisterProps {
  onRegister: () => void;
}

export default function Register({ onRegister }: RegisterProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
   phone: "",
    password: "",
   confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
         email: formData.email,
        phone: formData.phone || null,
          password: formData.password,
        confirmPassword: formData.confirmPassword,
        }),

      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro ao criar conta");
      }

      setSuccess("Conta criada com sucesso! Verifique seu email para ativar sua conta.");
      setFormData({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
      
      // Redirect to login after 3 seconds

    } catch (err: any) {
      setError(err.message || "Erro ao criar conta");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute top-40 -left-20 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="border-0 shadow-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center pb-8">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center mb-4 shadow-lg">
              <Pill className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
              Criar Conta
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              Registre-se para acessar a farmácia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-700 dark:text-slate-300">
                  Nome Completo
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Digite seu nome completo"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Digite seu email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
               <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300">
                 Telefone (Opcional)
               </Label>
               <div className="relative">
                 <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5" />
                 <Input
                  id="phone"
                   type="tel"
                   placeholder="+244 9XX XXX XXX"
                   value={formData.phone}
                   onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                   className="pl-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                 />
               </div>
             </div>

              <div className="space-y-2">
               <Label htmlFor="password" className="text-slate-700 dark:text-slate-300">
                 Senha
               </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 pr-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
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
                <Label htmlFor="confirmPassword" className="text-slate-700 dark:text-slate-300">
                  Confirmar Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirme sua senha"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="pl-10 pr-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
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
                  className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm text-center"
                >
                  {error}
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 text-sm text-center"
                >
                  {success}
                </motion.div>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/25"
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
                  "Criar Conta"
                )}
              </Button>
            </form>

            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={onRegister}
                className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Já tem uma conta? Faça login
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

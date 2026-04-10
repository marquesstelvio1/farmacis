import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LoginProps {
  onLogin: () => void;
  onShowRegister: () => void;
}

export default function Login({ onLogin, onShowRegister }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Credenciais invalidas");
      }

      if (data?.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      onLogin();
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: '#f7f7f7' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Logo + Título */}
        <div className="text-center mb-12">
          {/* Logo with Healthcare Icon */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <img src="/logo.png" alt="Brócolis" className="w-10 h-10" />
            <span className="text-xl font-bold text-slate-900">Brócolis - Saúde e Vida</span>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="rounded-3xl p-8 shadow-lg border border-slate-100" style={{ backgroundColor: '#fof5ee' }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-3">
              <label htmlFor="email" className="block text-sm font-semibold" style={{ color: '#607369' }}>
                E-mail
              </label>
              <Input
                id="email"
                type="email"
                placeholder="ex: example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 border border-slate-200 rounded-2xl focus:border-green-500 focus:ring-green-500/20 placeholder:text-slate-400 text-slate-900"
                required
              />
            </div>

            {/* Password Field */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-semibold" style={{ color: '#607369' }}>
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => {}}
                  className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 border border-slate-200 rounded-2xl focus:border-green-500 focus:ring-green-500/20 placeholder:text-slate-400 text-slate-900 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm text-center"
              >
                {error}
              </motion.div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 text-white font-bold rounded-full transition-all hover:shadow-lg"
              style={{ backgroundColor: '#072a1c' }}
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          {/* Register Section */}
          <div className="mt-8 text-center space-y-3 pt-6 border-t border-slate-100">
            <p className="text-sm" style={{ color: '#607369' }}>
              Ainda não tem conta?
            </p>
            <button
              onClick={onShowRegister}
              className="w-full h-10 font-bold rounded-full transition-all text-sm"
              style={{ backgroundColor: '#b5f176', color: '#8bc14a' }}
            >
              Cadastre-se Agora!
            </button>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-12 text-center space-y-4">
          <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
            <button className="hover:text-slate-700 transition-colors font-medium">PRIVACIDADE</button>
            <span>•</span>
            <button className="hover:text-slate-700 transition-colors font-medium">SUPORTE TÉCNICO</button>
            <span>•</span>
            <button className="hover:text-slate-700 transition-colors font-medium">TERMOS</button>
          </div>
          <p className="text-[10px] text-slate-400">
            © 2026 Brócolis - Saúde e Vida. Plataforma Cautionada pela Uldão 8 ou<br />
            Fado advindice da Angola
          </p>
        </div>
      </motion.div>
    </div>
  );
}

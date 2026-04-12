import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '../stores/authStore'
import { toast } from 'sonner'
import { Loader2, Store, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const success = await login(email, password)
      if (success) {
        toast.success('Login realizado com sucesso!')
      } else {
        toast.error('Email ou senha incorretos')
      }
    } catch (error) {
      toast.error('Erro ao fazer login')
      console.error('Login error:', error);
      toast.error('Não foi possível conectar ao servidor. Verifique se o backend está ativo.');
    } finally {
      setIsLoading(false)
    }
  }

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
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <Store className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">Farmácia - Portal Admin</span>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="rounded-3xl p-8 shadow-lg border border-slate-100 bg-white">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-3">
              <label htmlFor="email" className="block text-sm font-semibold text-slate-600">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                placeholder="ex: farmacia@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 px-4 border border-slate-200 rounded-2xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20 placeholder:text-slate-400 text-slate-900 outline-none transition-all"
                required
              />
            </div>

            {/* Password Field */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-600">
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
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 px-4 border border-slate-200 rounded-2xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20 placeholder:text-slate-400 text-slate-900 outline-none transition-all pr-10"
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-white font-bold rounded-full transition-all hover:shadow-lg"
              style={{ backgroundColor: '#072a1c' }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {/* Info Section */}
          <div className="mt-8 text-center space-y-3 pt-6 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              Acesso exclusivo para farmácias parceiras
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <Store className="w-4 h-4" />
              <span>Gerencie seus produtos e pedidos</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center space-y-4">
          <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
            <button className="hover:text-slate-700 transition-colors font-medium">SUPORTE</button>
            <span>•</span>
            <button className="hover:text-slate-700 transition-colors font-medium">PRIVACIDADE</button>
            <span>•</span>
            <button className="hover:text-slate-700 transition-colors font-medium">TERMOS</button>
          </div>
          <p className="text-[10px] text-slate-400">
            © 2026 Farmácia Admin Portal. Todos os direitos reservados.
          </p>
        </div>
      </motion.div>
    </div>
  )
}

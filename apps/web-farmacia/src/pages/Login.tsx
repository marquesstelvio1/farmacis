import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '../stores/authStore'
import { toast } from 'sonner'
import { Loader2, Mail, Lock, Eye, EyeOff, Store } from 'lucide-react'

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
        toast.success('Login realizado com sucesso! Bem-vindo ao painel da farmácia.')
      } else {
        toast.error('Credenciais inválidas. Verifique seu e-mail e senha.')
      }
    } catch (error) {
      toast.error('Erro de conexão. Tente novamente em instantes.')
      console.error('Login error:', error);
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50 overflow-hidden font-sans">
      {/* Left Decoration Side */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-emerald-700 overflow-hidden">
        {/* Animated Background Elements */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ duration: 2 }}
          className="absolute inset-0"
        >
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-white rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-400 rounded-full blur-[120px]" />
        </motion.div>

        {/* Content */}
        <div className="relative z-10 w-full flex flex-col items-center justify-center p-12 text-white text-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <img
              src="/logo.png"
              alt="Logo"
              className="w-48 h-auto object-contain drop-shadow-2xl brightness-110 grayscale-0 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="max-w-md"
          >
            <h1 className="text-4xl font-extrabold tracking-tight mb-4 leading-tight">
              Brócolis - Saúde Vitalícia
            </h1>
            <div className="h-1.5 w-20 bg-emerald-400 mx-auto mb-6 rounded-full" />
            <p className="text-emerald-100 text-lg font-medium opacity-90 leading-relaxed shadow-sm">
              Gerencie sua farmácia com eficiência e proporcione a melhor experiência aos seus clientes.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 0.8 }}
            className="absolute bottom-12 flex items-center gap-2 text-sm text-emerald-200"
          >
            <Store className="w-5 h-5" />
            <span className="font-semibold tracking-wide uppercase italic">Portal Parceiro Oficial</span>
          </motion.div>
        </div>

        {/* Subtle Overlay Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 2px, transparent 2px)', backgroundSize: '32px 32px' }} />
      </div>

      {/* Right Login Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 md:p-12 overflow-y-auto bg-white lg:bg-transparent">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md py-12 lg:py-0"
        >
          {/* Mobile Logo Branding */}
          <div className="lg:hidden flex flex-col items-center mb-12 text-center">
            <div className="p-3 bg-emerald-50 rounded-2xl mb-4">
              <img src="/logo.png" alt="Logo" className="h-14 sm:h-16 object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-black text-emerald-700 tracking-[0.2em] uppercase">Brócolis</h1>
              <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-1">Saúde Vitalícia • Painel Parceiro</p>
            </div>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <div className="hidden lg:inline-block px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-black tracking-widest uppercase mb-4">
              Partner Access
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2 tracking-tight">Autenticação</h2>
            <p className="text-slate-500 font-semibold italic text-sm">Insira seus dados para gerenciar sua unidade de saúde.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors duration-300">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="pharmacy@partner.co.ao"
                  className="w-full h-14 pl-12 pr-4 rounded-2xl border-2 border-slate-100 focus:border-emerald-600 focus:ring-0 transition-all outline-none bg-slate-50/50 text-slate-900 font-medium placeholder:text-slate-300 text-sm sm:text-base"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Palavra-passe</label>
                <button type="button" className="text-[10px] sm:text-[11px] text-emerald-600 font-black tracking-tighter hover:text-emerald-800 transition-colors">RECUPERAR SENHA</button>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors duration-300">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-14 pl-12 pr-12 rounded-2xl border-2 border-slate-100 focus:border-emerald-600 focus:ring-0 transition-all outline-none bg-slate-50/50 text-slate-900 font-medium placeholder:text-slate-300 text-sm sm:text-base"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 py-2">
              <div className="relative flex items-center h-5">
                <input
                  type="checkbox"
                  id="remember"
                  className="w-5 h-5 rounded-lg border-2 border-slate-200 text-emerald-600 focus:ring-emerald-600/20 cursor-pointer transition-colors"
                />
              </div>
              <label htmlFor="remember" className="text-[10px] sm:text-xs text-slate-500 font-bold cursor-pointer select-none">MANTENHA-ME CONECTADO</label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full h-14 sm:h-16 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-2xl shadow-emerald-600/20 transform hover:-translate-y-1 active:translate-y-0 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
            >
              <div className="relative z-10 flex items-center justify-center gap-3 tracking-widest text-xs sm:text-sm">
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <span>ACESSAR DASHBOARD</span>
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 via-transparent to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
            </button>

            <div className="pt-8 border-t-2 border-slate-50 text-center">
              <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] leading-loose">
                Brócolis - Saúde Vitalícia • Secure Operations <br className="hidden sm:block" />
                © 2026 • Gestão de Farmácias Integrada
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

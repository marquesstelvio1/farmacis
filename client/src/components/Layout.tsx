import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingCart, 
  Pill, 
  PillBottle, 
  HeartPulse, 
  Search, 
  Menu, 
  Package, 
  X,
  Stethoscope,
  UserRound,
  ShieldCheck,
  BookOpen,
  ChevronRight,
  Home,
  Moon,
  Sun
} from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useTheme } from "@/hooks/use-theme";
import { CartDrawer } from "./CartDrawer";
import { UserMenu } from "./UserMenu";

interface LayoutProps {
  children: ReactNode;
  onLogout?: () => void;
}

export function Layout({ children, onLogout }: LayoutProps) {
  const [location] = useLocation();
  const { totalItems, toggleCart } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const navLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/identificar", label: "Identificar IA", icon: Search },
  ];

  const quickServices = [
    { id: "pharmacies", label: "Farmácias", sub: "Medicamentos", icon: Pill, path: "/farmacias", color: "bg-blue-50 text-blue-600" },
    { id: "clinics", label: "Clínicas", sub: "Consultas", icon: Stethoscope, path: "/clinicas", color: "bg-teal-50 text-teal-600" },
    { id: "professionals", label: "Médicos", sub: "Especialistas", icon: UserRound, path: "/profissionais", color: "bg-indigo-50 text-indigo-600" },
    { id: "insurance", label: "Seguro", sub: "Validar Plano", icon: ShieldCheck, path: "/seguradoras", color: "bg-emerald-50 text-emerald-600" },
    { id: "catalog", label: "Ver Catálogo Completo", sub: "Navegar em todos os produtos", icon: BookOpen, path: "/catalogo", color: "bg-slate-50 text-slate-600", full: true },
  ];

  const menuVariants = {
    closed: { x: "100%", transition: { type: "spring", stiffness: 300, damping: 30 } },
    open: { x: 0, transition: { type: "spring", stiffness: 300, damping: 30, staggerChildren: 0.07, delayChildren: 0.2 } }
  };

  const itemVariants = {
    closed: { x: 20, opacity: 0 },
    open: { x: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            variants={menuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed top-0 left-0 w-full h-full z-50 md:hidden"
          >
            <div className="bg-white dark:bg-slate-900 h-full flex flex-col shadow-2xl">
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center">
                  <HeartPulse className="text-white" size={20} />
                </div>
                <span className="font-bold text-slate-800 dark:text-slate-100">FarmáciaDigital</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={24} className="text-slate-600 dark:text-slate-300" />
              </button>
            </div>

            {/* Mobile Nav Links */}
            <nav className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-4 mb-2">Navegação Principal</p>
                {navLinks.map((link) => {
                  const isActive = location === link.href;
                  return (
                    <motion.div key={link.href} variants={itemVariants}>
                      <Link
                        href={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <link.icon size={20} />
                        {link.label}
                      </Link>
                    </motion.div>
                  );
                })}
                </div>

                {/* Quick Services Section in Menu */}
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-4 mb-2">Serviços Rápidos</p>
                  <div className="grid grid-cols-2 gap-3">
                    {quickServices.map((service) => (
                      <motion.div 
                        key={service.id} 
                        variants={itemVariants}
                        className={service.full ? "col-span-2" : ""}
                      >
                        <Link href={service.path} onClick={() => setIsMobileMenuOpen(false)}>
                          <div className={`p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-start gap-3 active:scale-95 transition-transform bg-slate-50/50 dark:bg-slate-800/50`}>
                            <div className={`p-2 rounded-lg ${service.color}`}>
                              <service.icon size={20} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-none">{service.label}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate">{service.sub}</p>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </nav>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 font-medium">
                One Health Care — Seu shopping de saúde digital
              </p>
            </div>
          </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-30 glass-panel border-b border-slate-200/50 dark:border-slate-800/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <HeartPulse className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 leading-none">
                Farmácia<span className="text-blue-600">Digital</span>
              </h1>
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500">
                Saúde & IA
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/70 p-1 rounded-full border border-slate-200/60 dark:border-slate-700/80">
            {navLinks.map((link) => {
              const isActive = location === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${isActive
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-700/70'
                    }`}
                >
                  <link.icon size={18} className={isActive ? 'text-blue-500' : 'opacity-70'} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={theme === "light" ? "Ativar tema escuro" : "Ativar tema claro"}
            >
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {/* User Menu */}
            {onLogout && <UserMenu onLogout={onLogout} />}

            <button 
              onClick={() => {
                console.log('Hamburger clicked, opening menu');
                setIsMobileMenuOpen(true);
              }}
              className="md:hidden p-3 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Menu size={24} />
            </button>
          </div>

        </div>
      </header>

      <main className="flex-1 w-full">
        {children}
      </main>

      <footer className="bg-slate-900 text-slate-400 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 opacity-50 grayscale">
            <HeartPulse size={24} />
            <span className="text-xl font-bold font-display text-white">FarmáciaDigital</span>
          </div>
          <p className="text-sm">
            © 2026 Farmácia Digital. Todos os direitos reservados.
          </p>
          <div className="flex gap-4 text-sm">
            <a href="#" className="hover:text-white transition-colors">Termos</a>
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
          </div>
        </div>
      </footer>

      <CartDrawer />
    </div>
  );
}

import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pill,
  X,
  Stethoscope,
  UserRound,
  ShieldCheck,
  BookOpen,
  Home,
  Settings,
  LayoutGrid,
  Store,
  MapPin
} from "lucide-react";
import { CartDrawer } from "./CartDrawer";
import { useUser } from "@/UserContext";
import { getUserInitials } from "@/lib/userInitials";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useUser();

  const navLinks = [
    { href: "/catalogo", label: "Catálogo", icon: LayoutGrid },
    { href: "/farmacias", label: "Farmácias", icon: Store },
    { href: "/", label: "Início", icon: Home },
    { href: "/explorar", label: "Explorar", icon: MapPin },
    { href: "/menu-de-configuracoes", label: "Definições", icon: Settings },
  ];

  const quickServices = [
    { id: "pharmacies", label: "Farmácias", sub: "Medicamentos", icon: Pill, path: "/farmacias", color: "bg-green-50 text-green-600" },
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
    <div className="min-h-screen flex flex-col bg-slate-50">
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
            <div className="bg-white h-full flex flex-col shadow-2xl">
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Brócolis" className="w-8 h-8 object-contain" />
                <span className="font-bold text-slate-800">Brócolis</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <X size={24} className="text-slate-600" />
              </button>
            </div>

            {/* Mobile Nav Links */}
            <nav className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-2">Navegação Principal</p>
                {navLinks.map((link) => {
                  const isActive = location === link.href;
                  return (
                    <motion.div key={link.href} variants={itemVariants}>
  <Link
    key={link.href}
    href={link.href}
    className={`flex flex-col items-center justify-center gap-1 py-2 w-14 h-14 rounded-xl transition ${
      isActive 
        ? 'bg-[#22c55e] text-white' 
        : link.label === "Início"
          ? 'bg-transparent text-green-600'
          : 'bg-transparent text-[#607369]'
    }`}
  >
    <link.icon size={20} />
    <span className="text-[10px] font-bold">{link.label}</span>
  </Link>
                    </motion.div>
                  );
                })}
                </div>

                {/* Quick Services Section in Menu */}
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-2">Serviços Rápidos</p>
                  <div className="grid grid-cols-2 gap-3">
                    {quickServices.map((service) => (
                      <motion.div 
                        key={service.id} 
                        variants={itemVariants}
                        className={service.full ? "col-span-2" : ""}
                      >
                        <Link href={service.path} onClick={() => setIsMobileMenuOpen(false)}>
                          <div className={`p-4 rounded-2xl border border-slate-100 flex flex-col items-start gap-3 active:scale-95 transition-transform bg-slate-50/50`}>
                            <div className={`p-2 rounded-lg ${service.color}`}>
                              <service.icon size={20} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-800 leading-none">{service.label}</p>
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
                Brócolis — Saúde vitalícia
              </p>
            </div>
          </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Desktop Top Navigation */}
      <nav className="hidden md:block border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Brócolis" className="w-10 h-10 object-contain" />
            <span className="font-bold text-slate-800">Brócolis</span>
          </Link>
          <div className="flex items-center gap-2 border border-slate-200 rounded-2xl shadow-sm px-2 py-2 bg-white">
          {navLinks.map((link) => {
            const isActive = location === link.href;
            return (
              <Link
                key={`desktop-${link.href}`}
                href={link.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition ${
                  isActive
                    ? link.href === "/menu-de-configuracoes"
                      ? "bg-transparent text-slate-800"
                      : "bg-[#22c55e] text-white"
                    : "text-[#607369] hover:bg-green-50"
                }`}
              >
                {link.href === "/menu-de-configuracoes" ? (
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white font-bold text-xs shadow border-2 ${isActive ? "border-green-500" : "border-white"}`}>
                    {getUserInitials(user as any)}
                  </div>
                ) : (
                  <link.icon size={16} />
                )}
                <span>{link.label}</span>
              </Link>
            );
          })}
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 md:hidden z-40 rounded-t-2xl">
        <div className="flex items-center justify-center h-20 gap-4 px-2">
          {navLinks.map((link) => {
            const isActive = location === link.href;
            return (
  <Link
    key={link.href}
    href={link.href}
    className={`flex flex-col items-center justify-center gap-1 py-2 w-14 h-14 rounded-xl transition group ${
      isActive
        ? (link.href === "/menu-de-configuracoes" ? 'bg-transparent' : 'bg-[#22c55e] text-white')
        : link.label === "Início"
          ? 'bg-transparent text-green-600'
          : 'bg-transparent text-[#607369] hover:bg-green-50'
    }`}
  >
    {link.href === "/menu-de-configuracoes" ? (
      <div className={`w-11 h-11 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-lg border-2 transition-all ${isActive ? 'border-green-500' : 'border-white'}`}>
        {getUserInitials(user as any)}
      </div>
    ) : (
      <>
        <link.icon size={20} />
        <span className="text-[10px] font-bold">{link.label}</span>
      </>
    )}
  </Link>
            );
          })}
        </div>
      </nav>

      <CartDrawer />
    </div>
  );
}

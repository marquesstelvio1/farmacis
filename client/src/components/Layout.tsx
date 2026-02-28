import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingCart, Pill, PillBottle, HeartPulse, Search, Menu } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { CartDrawer } from "./CartDrawer";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { totalItems, toggleCart } = useCart();

  const navLinks = [
    { href: "/", label: "Catálogo", icon: PillBottle },
    { href: "/identificar", label: "Identificar IA", icon: Search },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="sticky top-0 z-30 glass-panel border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <HeartPulse className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-800 leading-none">
                Farmácia<span className="text-blue-600">Digital</span>
              </h1>
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                Saúde & IA
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-full border border-slate-200/60">
            {navLinks.map((link) => {
              const isActive = location === link.href;
              return (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                    isActive 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
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
              onClick={toggleCart}
              className="relative p-3 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm group"
            >
              <ShoppingCart size={22} className="group-hover:scale-110 transition-transform" />
              {totalItems() > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-sm ring-2 ring-white">
                  {totalItems()}
                </span>
              )}
            </button>
            <button className="md:hidden p-2 text-slate-600 bg-white rounded-lg border border-slate-200">
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
            © 2024 Farmácia Digital. Todos os direitos reservados.
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

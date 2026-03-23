import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingCart, Pill, PillBottle, HeartPulse, Search, Menu, Package, X } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
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

  console.log('Layout render, isMobileMenuOpen:', isMobileMenuOpen);

  const navLinks = [
    { href: "/", label: "Catálogo", icon: PillBottle },
    { href: "/identificar", label: "Identificar IA", icon: Search },
    { href: "/pedidos", label: "Meus Pedidos", icon: Package },
  ];

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
      {isMobileMenuOpen && (
        <div className="fixed top-0 left-0 w-full h-full z-50 md:hidden">
          {console.log('Mobile menu is rendering')}
          <div className="bg-white h-full flex flex-col">
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center">
                  <HeartPulse className="text-white" size={20} />
                </div>
                <span className="font-bold text-slate-800">FarmáciaDigital</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <X size={24} className="text-slate-600" />
              </button>
            </div>

            {/* Mobile Nav Links */}
            <nav className="flex-1 p-4">
              <div className="space-y-2">
                {navLinks.map((link) => {
                  const isActive = location === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <link.icon size={20} />
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* Mobile Actions */}
            <div className="p-4 border-t border-slate-200">
              <button
                onClick={() => {
                  toggleCart();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <ShoppingCart size={20} />
                Carrinho ({totalItems()})
              </button>
            </div>
          </div>
        </div>
      )}

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
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${isActive
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

            {/* User Menu */}
            {onLogout && <UserMenu onLogout={onLogout} />}

            <button 
              onClick={() => {
                console.log('Hamburger clicked, opening menu');
                setIsMobileMenuOpen(true);
              }}
              className="md:hidden p-3 text-slate-600 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
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

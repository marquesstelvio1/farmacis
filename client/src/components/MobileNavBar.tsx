import { House, LayoutGrid, Store, ShoppingCart, Settings } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  isCenter?: boolean;
}

// All 5 items in order: Home will be the 3rd (center) item
const navItems: NavItem[] = [
  { href: "/catalogo", icon: LayoutGrid, label: "Catálogo" },
  { href: "/farmacias", icon: Store, label: "Farmácias" },
  { href: "/", icon: House, label: "Início", isCenter: true },
  { href: "/checkout", icon: ShoppingCart, label: "Carrinho" },
  { href: "/menu-de-configuracoes", icon: Settings, label: "Perfil" },
];

interface MobileNavBarProps {
  activePath?: string;
}

export function MobileNavBar({ activePath = "/" }: MobileNavBarProps) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        setUser(null);
      }
    }
  }, []);

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = activePath === item.href;
    const isCenter = item.isCenter;

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex flex-col items-center justify-center gap-1 transition ${
          isCenter
            ? `w-16 h-16 rounded-full shadow-lg -mt-6 border-4 border-white ${
                isActive
                  ? "bg-blue-600 text-white shadow-blue-200"
                  : "bg-green-600 text-white shadow-green-200 hover:bg-green-700"
              }`
            : `py-2 w-14 h-14 rounded-xl transition-all group ${
                isActive
                  ? (item.href === "/menu-de-configuracoes" ? "bg-transparent" : "bg-[#22c55e] text-white")
                  : "bg-transparent text-[#607369] hover:bg-green-50"
              }`
        }`}
      >
        {item.href === "/menu-de-configuracoes" ? (
          <div className={`w-11 h-11 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-lg border-2 transition-all ${isActive ? 'border-green-500' : 'border-white'}`}>SM</div>
        ) : (
          <>
            <Icon size={isCenter ? 28 : 20} strokeWidth={2} />
            <span className={`font-bold ${isCenter ? "text-[11px]" : "text-[10px]"}`}>
              {item.label}
            </span>
          </>
        )}
      </Link>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 md:hidden z-40 rounded-t-2xl shadow-lg">
      <div className="grid grid-cols-5 items-end h-20 px-1 pb-2">
        {navItems.map(renderNavItem)}
      </div>
    </nav>
  );
}

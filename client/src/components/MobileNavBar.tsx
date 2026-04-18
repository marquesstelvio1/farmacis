import { House, LayoutGrid, Store, Settings } from "lucide-react";
import { Link } from "wouter";

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

const navItems: NavItem[] = [
  { href: "/", icon: House, label: "Início" },
  { href: "/catalogo", icon: LayoutGrid, label: "Catálogo" },
  { href: "/farmacias", icon: Store, label: "Farmácias" },
  { href: "/menu-de-configuracoes", icon: Settings, label: "Definições" },
];

interface MobileNavBarProps {
  activePath?: string;
}

export function MobileNavBar({ activePath = "/" }: MobileNavBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 md:hidden z-40 rounded-t-2xl">
      <div className="flex items-center justify-center h-20 gap-4 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePath === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 py-2 w-14 h-14 rounded-xl transition ${
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "bg-transparent text-[#607369] hover:bg-slate-50"
              }`}
            >
              <Icon size={20} strokeWidth={2} />
              <span className="text-[10px] font-bold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

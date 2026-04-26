import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { CalendarDays, LayoutDashboard, LogOut, Stethoscope } from "lucide-react";
import { useMemo, useState } from "react";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AgendaPage from "./pages/AgendaPage";

function Shell({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate();

  const menu = useMemo(
    () => [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/agenda", label: "Agenda", icon: CalendarDays }
    ],
    []
  );

  return (
    <div>
      <header style={{ background: "#0f172a", color: "#fff", borderBottom: "1px solid #1e293b" }}>
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, paddingBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700 }}>
            <Stethoscope size={18} />
            Portal de Profissionais
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {menu.map((item) => (
              <button key={item.to} className="btn btn-secondary" onClick={() => navigate(item.to)} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
            <button className="btn" onClick={onLogout} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#ef4444", color: "#fff" }}>
              <LogOut size={16} />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="container">
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/agenda" element={<AgendaPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <LoginPage onSuccess={() => setIsAuthenticated(true)} />;
  }

  return <Shell onLogout={() => setIsAuthenticated(false)} />;
}

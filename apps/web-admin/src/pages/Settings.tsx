import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Settings, Percent, Truck, ShoppingCart, Save, RotateCcw } from "lucide-react";

interface SystemSettings {
  platform_fee_percent: string;
  min_order_amount: string;
  delivery_fee: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    platform_fee_percent: "10",
    min_order_amount: "500",
    delivery_fee: "0",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/settings`);
      if (response.ok) {
        const data = await response.json();
        setSettings({
          platform_fee_percent: data.platform_fee_percent || "10",
          min_order_amount: data.min_order_amount || "500",
          delivery_fee: data.delivery_fee || "0",
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: keyof SystemSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (key: keyof SystemSettings) => {
    setSaving(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/settings/${key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: settings[key] }),
      });

      if (response.ok) {
        toast.success(`Configuração salva com sucesso!`);
      } else {
        toast.error("Erro ao salvar configuração");
      }
    } catch (error) {
      console.error("Error saving setting:", error);
      toast.error("Erro ao salvar configuração");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = (key: keyof SystemSettings) => {
    const defaults: SystemSettings = {
      platform_fee_percent: "10",
      min_order_amount: "500",
      delivery_fee: "0",
    };
    setSettings((prev) => ({ ...prev, [key]: defaults[key] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações do Sistema</h1>
          <p className="text-gray-500">Gerencie as configurações gerais da plataforma</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
          <Settings className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-600">Modo Admin</span>
        </div>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* Platform Fee */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Percent className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Taxa da Plataforma</h3>
              <p className="text-sm text-gray-500 mb-4">
                Percentagem cobrada sobre cada venda (atualmente: {settings.platform_fee_percent}%)
              </p>
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-32">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.platform_fee_percent}
                    onChange={(e) => handleChange("platform_fee_percent", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                </div>
                <button
                  onClick={() => handleSave("platform_fee_percent")}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Salvar
                </button>
                <button
                  onClick={() => handleReset("platform_fee_percent")}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                  title="Restaurar padrão"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Minimum Order Amount */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Valor Mínimo do Pedido</h3>
              <p className="text-sm text-gray-500 mb-4">
                Valor mínimo em AOA para novos pedidos (atualmente: {Number(settings.min_order_amount).toLocaleString()} AOA)
              </p>
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-40">
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={settings.min_order_amount}
                    onChange={(e) => handleChange("min_order_amount", e.target.value)}
                    className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">AOA</span>
                </div>
                <button
                  onClick={() => handleSave("min_order_amount")}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Salvar
                </button>
                <button
                  onClick={() => handleReset("min_order_amount")}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                  title="Restaurar padrão"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Fee */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Truck className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Taxa de Entrega</h3>
              <p className="text-sm text-gray-500 mb-4">
                Taxa de entrega padrão em AOA (0 = entrega grátis)
              </p>
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-40">
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={settings.delivery_fee}
                    onChange={(e) => handleChange("delivery_fee", e.target.value)}
                    className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">AOA</span>
                </div>
                <button
                  onClick={() => handleSave("delivery_fee")}
                  disabled={saving}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Salvar
                </button>
                <button
                  onClick={() => handleReset("delivery_fee")}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                  title="Restaurar padrão"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

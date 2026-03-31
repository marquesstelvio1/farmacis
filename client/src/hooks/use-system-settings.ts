import { create } from 'zustand';

interface SystemSettings {
  delivery_fee: string;
  min_order_amount: string;
  platform_fee_percent: string;
}

interface SettingsStore {
  settings: SystemSettings | null;
  loading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  getDeliveryFee: () => number;
  getMinOrderAmount: () => number;
}

export const useSystemSettings = create<SettingsStore>((set, get) => ({
  settings: null,
  loading: false,
  error: null,

  fetchSettings: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/admin/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      set({
        settings: {
          delivery_fee: data.delivery_fee || '0',
          min_order_amount: data.min_order_amount || '500',
          platform_fee_percent: data.platform_fee_percent || '15',
        },
        loading: false,
      });
    } catch (error) {
      set({ error: 'Erro ao carregar configurações', loading: false });
      set({
        settings: {
          delivery_fee: '0',
          min_order_amount: '500',
          platform_fee_percent: '15',
        },
      });
    }
  },

  getDeliveryFee: () => {
    const settings = get().settings;
    return settings ? parseFloat(settings.delivery_fee) : 0;
  },

  getMinOrderAmount: () => {
    const settings = get().settings;
    return settings ? parseFloat(settings.min_order_amount) : 500;
  },
}));

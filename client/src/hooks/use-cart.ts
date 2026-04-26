import { create } from 'zustand';
import { type ProductResponse } from '@shared/routes';

export interface PrescriptionData {
  imageUrl: string;
  base64: string;
}

export interface CartItem {
  product: ProductResponse;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  prescriptions: Map<number, PrescriptionData>;
  addItem: (product: ProductResponse) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setIsOpen: (isOpen: boolean) => void;
  totalItems: () => number;
  totalPrice: () => number;
  addPrescription: (productId: number, prescription: PrescriptionData) => void;
  removePrescription: (productId: number) => void;
  getPrescription: (productId: number) => PrescriptionData | undefined;
  hasItemsRequiringPrescription: () => boolean;
  getItemsRequiringPrescription: () => CartItem[];
  hasAllPrescriptions: () => boolean;
}

export const useCart = create<CartStore>((set, get) => ({
  items: [],
  isOpen: false,
  prescriptions: new Map(),

  addItem: (product) => {
    set((state) => {
      const existingItem = state.items.find((item) => item.product.id === product.id);
      if (existingItem) {
        return {
          items: state.items.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
          isOpen: true,
        };
      }
      return { items: [...state.items, { product, quantity: 1 }], isOpen: true };
    });
  },

  removeItem: (productId) => {
    set((state) => {
      const newPrescriptions = new Map(state.prescriptions);
      newPrescriptions.delete(productId);
      return {
        items: state.items.filter((item) => item.product.id !== productId),
        prescriptions: newPrescriptions,
      };
    });
  },

  updateQuantity: (productId, quantity) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.product.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item
      ),
    }));
  },

  clearCart: () => set({ items: [], prescriptions: new Map() }),
  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
  setIsOpen: (isOpen) => set({ isOpen }),

  totalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),

  totalPrice: () => get().items.reduce(
    (total, item) => total + (Number(item.product.price) * item.quantity),
    0
  ),

  addPrescription: (productId, prescription) => {
    set((state) => {
      const newPrescriptions = new Map(state.prescriptions);
      newPrescriptions.set(productId, prescription);
      return { prescriptions: newPrescriptions };
    });
  },

  removePrescription: (productId) => {
    set((state) => {
      const newPrescriptions = new Map(state.prescriptions);
      newPrescriptions.delete(productId);
      return { prescriptions: newPrescriptions };
    });
  },

  getPrescription: (productId) => get().prescriptions.get(productId),

  hasItemsRequiringPrescription: () => get().items.some((item) => item.product.prescriptionRequired),

  getItemsRequiringPrescription: () => get().items.filter((item) => item.product.prescriptionRequired),

  hasAllPrescriptions: () => {
    const items = get().items;
    const prescriptions = get().prescriptions;
    const itemsNeedingPrescription = items.filter((item) => item.product.prescriptionRequired);
    return itemsNeedingPrescription.every((item) => prescriptions.has(item.product.id));
  },
}));

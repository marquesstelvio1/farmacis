import { useState, useEffect, useCallback } from "react";

export interface PaymentMethod {
  id: number;
  userId: number;
  type: "multicaixa" | "mpesa" | "unitel_money" | "bank_transfer" | "stripe";
  name: string;
  phoneNumber?: string;
  cardNumber?: string;
  bankName?: string;
  accountNumber?: string;
  isDefault: boolean;
  createdAt: string;
}

export function usePaymentMethods(userId: number | undefined) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMethods = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/user/payment-methods?userId=${userId}`);
      if (!response.ok) {
        throw new Error("Erro ao buscar métodos de pagamento");
      }
      const data = await response.json();
      setMethods(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchMethods();
  }, [fetchMethods]);

  const addMethod = async (method: Omit<PaymentMethod, "id" | "createdAt">) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(method),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      
      await fetchMethods();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateMethod = async (id: number, updates: Partial<PaymentMethod>) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/user/payment-methods/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updates, userId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      
      await fetchMethods();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMethod = async (id: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/user/payment-methods/${id}?userId=${userId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      
      await fetchMethods();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const setDefaultMethod = async (id: number) => {
    return updateMethod(id, { isDefault: true });
  };

  return {
    methods,
    isLoading,
    error,
    addMethod,
    updateMethod,
    deleteMethod,
    setDefaultMethod,
    refresh: fetchMethods,
  };
}

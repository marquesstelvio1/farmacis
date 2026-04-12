import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'

export interface OrderDetails {
  id: number
  customerName: string
  customerPhone: string
  customerAddress: string
  customerLat?: number
  customerLng?: number
  total: string
  deliveryFee: string
  status: string
  paymentMethod: string
  paymentStatus: string
  isLocked?: boolean
  paymentProof?: string
  notes?: string
  pharmacyIban?: string
  pharmacyMulticaixaExpress?: string
  createdAt: string
  items: Array<{
    productName: string
    quantity: number
    unitPrice: string
    totalPrice: string
  }>
}

export function useOrderDetail(orderId: string | undefined) {
  const { user } = useAuthStore()
  const API_URL = import.meta.env.VITE_API_URL || ''

  return useQuery<OrderDetails>({
    queryKey: ['order', orderId],
    queryFn: async () => {
      if (!orderId) throw new Error('Order ID is required')
      
      const response = await fetch(`${API_URL}/api/pharmacy/orders/${orderId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch order')
      }
      
      const data = await response.json()
      return data
    },
    enabled: !!orderId && !!user,
  })
}

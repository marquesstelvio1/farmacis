import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { toast } from 'sonner'

interface OrderNotification {
  id: number
  customerName: string
  total: string
  items: Array<{ productName: string; quantity: number }>
}

export function useSocket(pharmacyId: number | undefined) {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!pharmacyId) return

    // Connect to WebSocket server
    const socket = io('/', {
      path: '/socket.io',
      transports: ['websocket'],
    })

    socketRef.current = socket

    // Join pharmacy room
    socket.emit('join-pharmacy', pharmacyId)

    socket.on('connect', () => {
      console.log('Connected to WebSocket')
      toast.success('Conectado ao servidor em tempo real')
    })

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
      toast.error('Falha na conexão WebSocket: ' + (error?.message || 'erro inesperado'))
    })

    socket.on('disconnect', (reason) => {
      console.warn('Disconnected from WebSocket:', reason)
      if (reason !== 'io client disconnect') {
        toast.error('Conexão WebSocket encerrada. Tentando reconectar...')
      }
    })

    socket.on('new-order', (order: OrderNotification) => {
      // Play notification sound
      const audio = new Audio('/notification.mp3')
      audio.play().catch(() => {
        // Ignore autoplay errors
      })

      // Show toast notification
      toast.success(`Novo Pedido #${order.id}!`, {
        description: `${order.customerName} - ${order.items.length} item(s)`,
        duration: 10000,
        action: {
          label: 'Ver Pedido',
          onClick: () => {
            window.location.href = `/orders/${order.id}`
          },
        },
      })
    })

    return () => {
      socket.disconnect()
    }
  }, [pharmacyId])

  const emitOrderStatus = useCallback((orderId: number, status: string) => {
    if (socketRef.current) {
      socketRef.current.emit('order-status-update', { orderId, status })
    }
  }, [])

  return { emitOrderStatus }
}

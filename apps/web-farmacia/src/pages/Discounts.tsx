import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Tag, Plus, Trash2, Percent, ToggleLeft, ToggleRight, Package } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '../stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface Product {
  id: number
  name: string
  description: string
  price: string
  imageUrl: string
  stock: number
}

interface ProductDiscount {
  id: number
  pharmacyId: number
  productId: number
  discountPercentage: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  productName: string
  productPrice: string
  productImage: string
  expiresAt: string | null
}

export default function Discounts() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([])
  const [discountPercentage, setDiscountPercentage] = useState('')
  const [expiryDate, setExpiryDate] = useState('') // Format: YYYY-MM-DD
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  // Fetch existing discounts
  const { data: discounts, isLoading: isLoadingDiscounts } = useQuery<ProductDiscount[]>({
    queryKey: ['pharmacy-discounts', user?.pharmacyId],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || ''}/api/pharmacy/discounts?pharmacyId=${user?.pharmacyId}`
      )
      if (!response.ok) throw new Error('Failed to fetch discounts')
      return response.json()
    },
    enabled: !!user?.pharmacyId,
  })

  // Fetch products for selection
  const { data: products, isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ['pharmacy-products', user?.pharmacyId],
    queryFn: async () => {
      const endpoint = user?.pharmacyId
        ? `${import.meta.env.VITE_API_URL || ''}/api/pharmacy/${user.pharmacyId}/products`
        : `${import.meta.env.VITE_API_URL || ''}/api/pharmacy/products`
      const response = await fetch(endpoint)
      if (!response.ok) throw new Error('Failed to fetch products')
      return response.json()
    },
    enabled: !!user?.pharmacyId,
  })

  // Create discount mutation
  const createDiscountMutation = useMutation({
    mutationFn: async (data: { productIds: number[]; discountPercentage: number; expirationDate: string | null }) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/pharmacy/discounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pharmacyId: user?.pharmacyId,
          productIds: data.productIds,
          discountPercentage: data.discountPercentage,
          isActive: true,
          expirationDate: data.expirationDate,
        }),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message || 'Failed to create discount')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-discounts', user?.pharmacyId] })
      setIsAddDialogOpen(false)
      setSelectedProductIds([])
      setDiscountPercentage('')
      toast.success('Desconto criado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar desconto')
    },
  })

  // Toggle discount mutation
  const toggleDiscountMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || ''}/api/pharmacy/discounts/${id}/toggle`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive }),
        }
      )
      if (!response.ok) throw new Error('Failed to toggle discount')
      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-discounts', user?.pharmacyId] })
      toast.success(variables.isActive ? 'Desconto ativado!' : 'Desconto desativado!')
    },
    onError: () => {
      toast.error('Erro ao alterar status do desconto')
    },
  })

  // Delete discount mutation
  const deleteDiscountMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || ''}/api/pharmacy/discounts/${id}`,
        {
          method: 'DELETE',
        }
      )
      if (!response.ok) throw new Error('Failed to delete discount')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-discounts', user?.pharmacyId] })
      toast.success('Desconto removido com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao remover desconto')
    },
  })

  // Filter products that don't have discounts yet
  const productsWithoutDiscounts = products?.filter(
    (product) => !discounts?.some((d) => d.productId === product.id)
  )

  const filteredProducts = productsWithoutDiscounts?.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateDiscount = () => {
    if (selectedProductIds.length === 0 || !discountPercentage) {
      toast.error('Selecione ao menos um produto e informe a porcentagem de desconto')
      return
    }
    const percentage = parseFloat(discountPercentage)
    if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
      toast.error('A porcentagem deve estar entre 0 e 100')
      return
    }

    let expirationDate: Date | null = null
    if (expiryDate) {
      expirationDate = new Date(expiryDate)
      // Definir para o fim do dia (23:59:59)
      expirationDate.setHours(23, 59, 59, 999)
    }

    createDiscountMutation.mutate({
      productIds: selectedProductIds,
      discountPercentage: percentage,
      expirationDate: expirationDate ? expirationDate.toISOString() : null,
    })
  }

  const toggleProductSelection = (id: number) => {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    )
  }

  const calculateDiscountedPrice = (price: string, percentage: string) => {
    const originalPrice = parseFloat(price)
    const discount = parseFloat(percentage)
    if (isNaN(originalPrice) || isNaN(discount)) return originalPrice
    return originalPrice * (1 - discount / 100)
  }

  if (isLoadingDiscounts || isLoadingProducts) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Política de Descontos</h1>
          <p className="text-gray-500">
            Gerencie descontos por produto. Os clientes verão a etiqueta de desconto no app.
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors">
              <Plus className="w-5 h-5" />
              Novo Desconto
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Desconto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Search products */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar produto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* Product selection */}
              <div className="space-y-2">
                <Label>Selecione um ou mais produtos ({selectedProductIds.length} selecionados)</Label>
                <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-2">
                  {filteredProducts?.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">
                      {searchTerm
                        ? 'Nenhum produto encontrado'
                        : 'Todos os produtos já possuem descontos'}
                    </p>
                  ) : (
                    filteredProducts?.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => toggleProductSelection(product.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedProductIds.includes(product.id)
                          ? 'bg-green-50 border-2 border-green-500'
                          : 'bg-white border border-gray-200 hover:bg-gray-50'
                          }`}
                      >
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{product.name}</p>
                          <p className="text-sm text-gray-500">
                            {parseFloat(product.price).toLocaleString('pt-AO', {
                              style: 'currency',
                              currency: 'AOA',
                            })}
                          </p>
                        </div>
                        {selectedProductIds.includes(product.id) && (
                          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Discount settings */}
              {selectedProductIds.length > 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="discountPercentage">Porcentagem de Desconto (%)</Label>
                      <div className="relative">
                        <Input
                          id="discountPercentage"
                          type="number"
                          min="1"
                          max="100"
                          placeholder="Ex: 15"
                          value={discountPercentage}
                          onChange={(e) => setDiscountPercentage(e.target.value)}
                          className="pl-10"
                        />
                        <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expiryDate">Data de Expiração (Opcional)</Label>
                      <Input
                        id="expiryDate"
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Price preview */}
                  {discountPercentage && !isNaN(parseFloat(discountPercentage)) && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                      <p className="font-medium text-green-800">Preview (Exemplo)</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          -{discountPercentage}%
                        </span>
                        <span className="text-sm text-green-700">
                          Bandeira que aparecerá no canto do produto
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false)
                    setSelectedProductIds([])
                    setDiscountPercentage('')
                    setExpiryDate('')
                    setSearchTerm('')
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={
                    createDiscountMutation.isPending || selectedProductIds.length === 0 || !discountPercentage
                  }
                  onClick={handleCreateDiscount}
                >
                  {createDiscountMutation.isPending ? 'Criando...' : 'Criar Desconto'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Discounts List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Tag className="w-5 h-5 text-green-600" />
          Descontos Ativos
        </h2>

        {discounts?.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Tag className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum desconto configurado
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Clique em "Novo Desconto" para adicionar descontos aos seus produtos. Os clientes
              verão a etiqueta de desconto no app.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {discounts?.map((discount) => (
              <div
                key={discount.id}
                className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all ${discount.isActive ? 'border-green-200' : 'border-gray-200 opacity-75'
                  }`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <img
                      src={discount.productImage || '/placeholder-product.png'}
                      alt={discount.productName}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {discount.productName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {parseFloat(discount.productPrice).toLocaleString('pt-AO', {
                          style: 'currency',
                          currency: 'AOA',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-2xl font-bold ${discount.isActive ? 'text-red-500' : 'text-gray-400'
                          }`}
                      >
                        -{discount.discountPercentage}%
                      </span>
                      {discount.isActive && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                          ATIVO
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          toggleDiscountMutation.mutate({
                            id: discount.id,
                            isActive: !discount.isActive,
                          })
                        }
                        disabled={toggleDiscountMutation.isPending}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title={discount.isActive ? 'Desativar' : 'Ativar'}
                      >
                        {discount.isActive ? (
                          <ToggleRight className="w-6 h-6 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Tem certeza que deseja remover este desconto?')) {
                            deleteDiscountMutation.mutate(discount.id)
                          }
                        }}
                        disabled={deleteDiscountMutation.isPending}
                        className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                        title="Remover desconto"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Discounted price preview */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-500">
                      Preço com desconto:{' '}
                      <span className="font-semibold text-green-600">
                        {calculateDiscountedPrice(
                          discount.productPrice,
                          discount.discountPercentage
                        ).toLocaleString('pt-AO', {
                          style: 'currency',
                          currency: 'AOA',
                        })}
                      </span>
                    </p>
                    {discount.expiresAt && (
                      <p className="text-[10px] text-gray-400 mt-1 italic">
                        Expira em: {new Date(discount.expiresAt).toLocaleDateString('pt-AO')} às {new Date(discount.expiresAt).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Package className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">Como funciona</h3>
            <p className="text-sm text-blue-700 mt-1">
              Ao criar um desconto, o preço original do produto é mantido, mas uma etiqueta vermelha
              com a porcentagem de desconto é exibida no app do cliente. Isso ajuda a destacar suas
              promoções sem alterar o preço base do produto.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

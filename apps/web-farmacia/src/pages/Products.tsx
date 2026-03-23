import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Package, Plus, Edit, Trash2, X } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Product {
  id: number
  name: string
  description: string
  price: string
  imageUrl: string
  activeIngredient: string
  inStock: boolean
}

export default function Products() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    activeIngredient: '',
    category: '',
    brand: '',
    dosage: '',
    prescriptionRequired: false,
    stock: 0
  })
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const addProductMutation = useMutation({
    mutationFn: async (productData: typeof newProduct) => {
      const response = await fetch(`/api/pharmacy/${user?.pharmacyId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      })
      if (!response.ok) throw new Error('Failed to add product')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-products', user?.pharmacyId] })
      setIsAddDialogOpen(false)
      setNewProduct({
        name: '',
        description: '',
        price: '',
        activeIngredient: '',
        category: '',
        brand: '',
        dosage: '',
        prescriptionRequired: false,
        stock: 0
      })
    }
  })

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['pharmacy-products', user?.pharmacyId],
    queryFn: async () => {
      const endpoint = user?.pharmacyId
        ? `/api/pharmacy/${user.pharmacyId}/products`
        : '/api/pharmacy/products'
      const response = await fetch(endpoint)
      if (!response.ok) throw new Error('Failed to fetch products')
      return response.json()
    },
  })

  const filteredProducts = products?.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.activeIngredient.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-500">Gerencie os produtos da sua farmácia</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors">
              <Plus className="w-5 h-5" />
              Adicionar Produto
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Produto</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault()
              addProductMutation.mutate(newProduct)
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome do Produto *</Label>
                  <Input
                    id="name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="price">Preço (AOA) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="activeIngredient">Princípio Ativo</Label>
                  <Input
                    id="activeIngredient"
                    value={newProduct.activeIngredient}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, activeIngredient: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={newProduct.category} onValueChange={(value) => setNewProduct(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medicamento">Medicamento</SelectItem>
                      <SelectItem value="higiene">Higiene</SelectItem>
                      <SelectItem value="beleza">Beleza</SelectItem>
                      <SelectItem value="suplemento">Suplemento</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="brand">Marca</Label>
                  <Input
                    id="brand"
                    value={newProduct.brand}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, brand: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="dosage">Dosagem</Label>
                  <Input
                    id="dosage"
                    value={newProduct.dosage}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, dosage: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="stock">Stock Inicial</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="prescriptionRequired"
                  checked={newProduct.prescriptionRequired}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, prescriptionRequired: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="prescriptionRequired">Requer receita médica</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={addProductMutation.isPending}>
                  {addProductMutation.isPending ? 'Adicionando...' : 'Adicionar Produto'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar produto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts?.map((product) => (
          <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="aspect-video bg-gray-100 relative">
              {product.imageUrl ? (
                <img 
                  src={product.imageUrl} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-12 h-12 text-gray-300" />
                </div>
              )}
              <div className="absolute top-2 right-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  product.inStock 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {product.inStock ? 'Em estoque' : 'Esgotado'}
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900">{product.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{product.activeIngredient}</p>
              <p className="text-lg font-bold text-green-600 mt-2">
                {Number(product.price).toLocaleString('pt-AO', {
                  style: 'currency',
                  currency: 'AOA'
                })}
              </p>
              <div className="flex gap-2 mt-4">
                <button className="flex-1 flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors">
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
                <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts?.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Nenhum produto encontrado</h3>
          <p className="text-gray-500">Adicione produtos para começar a vender</p>
        </div>
      )}
    </div>
  )
}

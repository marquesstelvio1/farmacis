import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Package, Plus, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
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
  precoBase?: string
  imageUrl: string
  diseases: string[]
  stock: number
  category: string
  brand?: string
  dosage?: string
  prescriptionRequired?: boolean
}

export default function Products() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)

  const resetForm = {
    name: '',
    description: '',
    price: '',
    category: 'medicamento',
    brand: '',
    dosage: '',
    diseasesInput: '',
    prescriptionRequired: false,
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=60'
  }

  const [newProduct, setNewProduct] = useState(resetForm)
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const addProductMutation = useMutation({
    mutationFn: async (formData: typeof newProduct) => {
      // Map frontend model to schema.ts model
      const productData = {
        name: formData.name,
        description: formData.description,
        precoBase: formData.price, // Send as precoBase to trigger backend commission logic
        category: formData.category,
        brand: formData.brand,
        dosage: formData.dosage,
        diseases: formData.diseasesInput.split(',').map(s => s.trim()).filter(Boolean),
        prescriptionRequired: formData.prescriptionRequired,
        stock: 100, // Default to in stock when adding
        imageUrl: formData.imageUrl
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/pharmacy/${user?.pharmacyId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to add product');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-products', user?.pharmacyId] })
      setIsAddDialogOpen(false)
      setNewProduct(resetForm)
      toast.success('Produto adicionado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Falha ao adicionar produto.')
    }
  })

  const editProductMutation = useMutation({
    mutationFn: async (data: { id: number, formData: any }) => {
      const productData = {
        ...data.formData,
        diseases: data.formData.diseasesInput.split(',').map((s: string) => s.trim()).filter(Boolean),
        precoBase: data.formData.price
      };
      delete productData.diseasesInput;
      delete productData.price;

      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/products/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      if (!response.ok) throw new Error('Failed to update product');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-products', user?.pharmacyId] })
      setEditingProduct(null)
      toast.success('Produto atualizado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Falha ao atualizar produto.')
    }
  })

  const toggleStockMutation = useMutation({
    mutationFn: async ({ id, inStock }: { id: number, inStock: boolean }) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: inStock ? 0 : 100 }) // Toggle stock
      });
      if (!response.ok) throw new Error('Failed to update stock');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-products', user?.pharmacyId] })
      toast.success('Status de estoque atualizado!')
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
    (product.diseases && product.diseases.some(d => d.toLowerCase().includes(searchTerm.toLowerCase()))) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
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
                  <Label htmlFor="price">Preço de Custo (AOA) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="Ex: 1000"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                    required
                  />
                  {newProduct.price && !isNaN(parseFloat(newProduct.price)) && (
                    <p className="text-sm text-green-600 mt-1 font-medium">
                      Preço de venda final: {(parseFloat(newProduct.price) * 1.15).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })} (+15% taxa)
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <Label htmlFor="brand">Marca</Label>
                  <Input
                    id="brand"
                    value={newProduct.brand}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, brand: e.target.value }))}
                  />
                </div>
              </div>

              {newProduct.category === 'medicamento' && (
                <div>
                  <Label htmlFor="diseasesInput">Doenças / Indicações (separado por vírgulas)</Label>
                  <Textarea
                    id="diseasesInput"
                    placeholder="Gripe, Febre, Dor de cabeça..."
                    value={newProduct.diseasesInput}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, diseasesInput: e.target.value }))}
                    rows={2}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dosage">Dosagem</Label>
                  <Input
                    id="dosage"
                    value={newProduct.dosage}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, dosage: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="imageUrl">URL da Imagem</Label>
                <Input
                  id="imageUrl"
                  value={newProduct.imageUrl}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, imageUrl: e.target.value }))}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="prescriptionRequired"
                  checked={newProduct.prescriptionRequired}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, prescriptionRequired: e.target.checked }))}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <Label htmlFor="prescriptionRequired">Requer receita médica</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white" disabled={addProductMutation.isPending}>
                  {addProductMutation.isPending ? 'Adicionando...' : 'Adicionar Produto'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Produto: {editingProduct?.name}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault()
              editProductMutation.mutate({ id: editingProduct.id, formData: newProduct })
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Nome do Produto *</Label>
                  <Input
                    id="edit-name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-price">Preço de Custo (AOA) *</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                    required
                  />
                  {newProduct.price && !isNaN(parseFloat(newProduct.price)) && (
                    <p className="text-sm text-green-600 mt-1 font-medium">
                      Preço de venda final: {(parseFloat(newProduct.price) * 1.15).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })} (+15% taxa)
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-category">Categoria</Label>
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
                <div>
                  <Label htmlFor="edit-brand">Marca</Label>
                  <Input
                    id="edit-brand"
                    value={newProduct.brand}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, brand: e.target.value }))}
                  />
                </div>
              </div>

              {newProduct.category === 'medicamento' && (
                <div>
                  <Label htmlFor="edit-diseasesInput">Doenças / Indicações (separado por vírgulas)</Label>
                  <Textarea
                    id="edit-diseasesInput"
                    placeholder="Gripe, Febre, Dor de cabeça..."
                    value={newProduct.diseasesInput}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, diseasesInput: e.target.value }))}
                    rows={2}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-dosage">Dosagem</Label>
                  <Input
                    id="edit-dosage"
                    value={newProduct.dosage}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, dosage: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-imageUrl">URL da Imagem</Label>
                <Input
                  id="edit-imageUrl"
                  value={newProduct.imageUrl}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, imageUrl: e.target.value }))}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-prescriptionRequired"
                  checked={newProduct.prescriptionRequired}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, prescriptionRequired: e.target.checked }))}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <Label htmlFor="edit-prescriptionRequired">Requer receita médica</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setEditingProduct(null)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white" disabled={editProductMutation.isPending}>
                  {editProductMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
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
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${product.stock > 0
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
                  }`}>
                  {product.stock > 0 ? 'Em estoque' : 'Esgotado'}
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900">{product.name}</h3>
              <div className="flex flex-wrap gap-1 mt-1">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded capitalize">
                  {product.category}
                </span>
                {product.diseases && product.diseases.slice(0, 2).map((disease, i) => (
                  <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                    {disease}
                  </span>
                ))}
              </div>
              <p className="text-lg font-bold text-green-600 mt-2">
                {Number(product.price).toLocaleString('pt-AO', {
                  style: 'currency',
                  currency: 'AOA'
                })}
              </p>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => {
                    setEditingProduct(product);
                    setNewProduct({
                      name: product.name,
                      description: product.description,
                      price: product.price,
                      category: product.category || 'medicamento',
                      brand: (product as any).brand || '',
                      dosage: (product as any).dosage || '',
                      diseasesInput: (product.diseases || []).join(', '),
                      prescriptionRequired: (product as any).prescriptionRequired || false,
                      imageUrl: product.imageUrl || ''
                    });
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => toggleStockMutation.mutate({ id: product.id, inStock: product.stock > 0 })}
                  className={`flex-1 text-sm font-medium py-2 px-4 rounded-lg transition-colors ${product.stock > 0
                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                    : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                >
                  {product.stock > 0 ? 'Tirar de Stock' : 'Pôr em Stock'}
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

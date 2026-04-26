import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Package, 
  Filter,
  X,
  Save,
  Eye,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import ImageUpload from '@/components/ImageUpload'
import { useAuthStore } from '@/stores/authStore'
import { normalizeError } from '@/lib/errorHandler'

interface Product {
  id: number
  name: string
  description: string
  price: string
  imageUrl: string
  diseases: string[]
  activeIngredient: string
  category: string
  brand?: string
  dosage?: string
  prescriptionRequired: boolean
  stock: number
  pharmacyId: number
  status: string
  createdAt: string
  updatedAt: string
}

const categories = [
  'medicamento',
  'vitamina', 
  'suplemento',
  'cosmetico',
  'higiene',
  'equipamento'
]

const statuses = [
  { value: 'active', label: 'Ativo', color: 'bg-green-100 text-green-800' },
  { value: 'inactive', label: 'Inativo', color: 'bg-gray-100 text-gray-800' },
  { value: 'discontinued', label: 'Descontinuado', color: 'bg-red-100 text-red-800' }
]

export default function PharmacyCatalog() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null)
  const { user, isAuthenticated } = useAuthStore()
  
  const queryClient = useQueryClient()

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['pharmacy-products', user?.pharmacyId, search, selectedCategory, selectedStatus],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedStatus) params.append('status', selectedStatus)

      let endpoint = '/api/pharmacy/products'
      if (user?.pharmacyId) {
        endpoint = `/api/pharmacy/${user.pharmacyId}/products`
      }

      const response = await fetch(`${endpoint}?${params}`)
      if (!response.ok) throw new Error('Failed to fetch products')
      return response.json()
    },
    enabled: true
  })

  const createMutation = useMutation({
    mutationFn: async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'pharmacyId'>) => {
      if (!user?.pharmacyId) throw new Error('Not authenticated')
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/pharmacy/${user.pharmacyId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      })
      if (!response.ok) throw new Error('Failed to create product')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-products'] })
      setIsCreateModalOpen(false)
      toast.success('Produto criado com sucesso!')
    },
    onError: (error: any) => {
      toast.error(normalizeError(error))
    }
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...productData }: Partial<Product> & { id: number }) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      })
      if (!response.ok) throw new Error('Failed to update product')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-products'] })
      setEditingProduct(null)
      toast.success('Produto atualizado com sucesso!')
    },
    onError: (error: any) => {
      toast.error(normalizeError(error))
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete product')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-products'] })
      toast.success('Produto excluído com sucesso!')
    },
    onError: (error: any) => {
      toast.error(normalizeError(error))
    }
  })

  const handleCreateProduct = (productData: any) => {
    createMutation.mutate(productData)
  }

  const handleUpdateProduct = (productData: any) => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, ...productData })
    }
  }

  const handleDeleteProduct = (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      deleteMutation.mutate(id)
    }
  }

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA'
    }).format(parseFloat(value))
  }

  useEffect(() => {
    console.log('Catalog state', { user, isAuthenticated, products, isLoading })
  }, [user, isAuthenticated, products, isLoading])

  const getStatusInfo = (status: string) => {
    return statuses.find(s => s.value === status) || statuses[0]
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Esgotado', color: 'bg-red-100 text-red-800' }
    if (stock < 10) return { label: 'Estoque baixo', color: 'bg-yellow-100 text-yellow-800' }
    return { label: 'Disponível', color: 'bg-green-100 text-green-800' }
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sessão não encontrada</h2>
            <p className="text-muted-foreground">
              Por favor, faça login novamente para acessar o catálogo.
            </p>
            <Button 
              className="mt-4" 
              onClick={() => window.location.href = '/login'}
            >
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meu Catálogo</h1>
          <p className="text-muted-foreground">Gerencie os produtos da sua farmácia</p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Produto</DialogTitle>
            </DialogHeader>
            <ProductForm 
              onSubmit={handleCreateProduct}
              isLoading={createMutation.isPending}
              onCancel={() => setIsCreateModalOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar produtos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as categorias</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os status</SelectItem>
                {statuses.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 mx-auto mb-4 animate-pulse opacity-50" />
          <p className="text-muted-foreground">Carregando produtos...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-muted-foreground mb-4">Nenhum produto encontrado</p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Produto
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product: Product) => {
            const statusInfo = getStatusInfo(product.status)
            const stockStatus = getStockStatus(product.stock)
            
            return (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{product.brand}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Badge className={statusInfo.color}>
                        {statusInfo.label}
                      </Badge>
                      <Badge className={stockStatus.color}>
                        {stockStatus.label}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img 
                      src={product.imageUrl} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60'
                      }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-primary">
                        {formatCurrency(product.price)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Estoque: {product.stock}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">
                        {product.category}
                      </Badge>
                      {product.prescriptionRequired && (
                        <Badge variant="outline" className="text-xs">
                          Receita
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewingProduct(product)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingProduct(product)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteProduct(product.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Produto</DialogTitle>
            </DialogHeader>
            <ProductForm 
              product={editingProduct}
              onSubmit={handleUpdateProduct}
              isLoading={updateMutation.isPending}
              onCancel={() => setEditingProduct(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* View Product Modal */}
      {viewingProduct && (
        <Dialog open={!!viewingProduct} onOpenChange={() => setViewingProduct(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{viewingProduct.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img 
                  src={viewingProduct.imageUrl} 
                  alt={viewingProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Preço</Label>
                  <p className="text-lg font-bold">{formatCurrency(viewingProduct.price)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Estoque</Label>
                  <p className="text-lg">{viewingProduct.stock}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Descrição</Label>
                <p className="text-sm">{viewingProduct.description}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Princípio Ativo</Label>
                <p className="text-sm">{viewingProduct.activeIngredient}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Indicações</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {viewingProduct.diseases.map((disease, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {disease}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

interface ProductFormProps {
  product?: Product
  onSubmit: (data: any) => void
  isLoading: boolean
  onCancel: () => void
}

function ProductForm({ product, onSubmit, isLoading, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    imageUrl: product?.imageUrl || '',
    diseases: product?.diseases?.join(', ') || '',
    activeIngredient: product?.activeIngredient || '',
    category: product?.category || 'medicamento',
    brand: product?.brand || '',
    dosage: product?.dosage || '',
    prescriptionRequired: product?.prescriptionRequired || false,
    stock: product?.stock || 0,
    status: product?.status || 'active'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      price: formData.price,
      stock: parseInt(formData.stock.toString()),
      diseases: formData.diseases.split(',').map(d => d.trim()).filter(d => d)
    })
  }

  const handleImageChange = (url: string) => {
    setFormData({ ...formData, imageUrl: url })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nome do Produto *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="brand">Marca</Label>
          <Input
            id="brand"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descrição *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">Preço (AOA) *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="stock">Estoque *</Label>
          <Input
            id="stock"
            type="number"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Categoria *</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="status">Status *</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map(status => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="activeIngredient">Princípio Ativo *</Label>
        <Input
          id="activeIngredient"
          value={formData.activeIngredient}
          onChange={(e) => setFormData({ ...formData, activeIngredient: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="dosage">Dosagem</Label>
        <Input
          id="dosage"
          value={formData.dosage}
          onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
          placeholder="Ex: 500mg, 10ml"
        />
      </div>

      <div>
        <Label htmlFor="imageUrl">Imagem do Produto</Label>
        <ImageUpload
          value={formData.imageUrl}
          onChange={handleImageChange}
          placeholder="Carregar imagem do produto"
        />
      </div>

      <div>
        <Label htmlFor="diseases">Indicações (separadas por vírgula) *</Label>
        <Textarea
          id="diseases"
          value={formData.diseases}
          onChange={(e) => setFormData({ ...formData, diseases: e.target.value })}
          placeholder="dor de cabeça, febre, inflamação"
          rows={2}
          required
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="prescriptionRequired"
          checked={formData.prescriptionRequired}
          onCheckedChange={(checked) => setFormData({ ...formData, prescriptionRequired: checked })}
        />
        <Label htmlFor="prescriptionRequired">Requer receita médica</Label>
      </div>

      <div className="flex gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? 'Salvando...' : (product ? 'Atualizar' : 'Criar')}
        </Button>
      </div>
    </form>
  )
}

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Package, Plus, Edit, Trash2, Upload, X, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '../stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Componente de imagem com fallback
function ProductImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [error, setError] = useState(false)

  if (error || !src) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <ImageIcon className="w-12 h-12 text-gray-400" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  )
}

interface Product {
  id: number
  name: string
  description: string
  price: string
  precoBase?: string
  precoPortugues?: string
  precoIndiano?: string
  imageUrl: string
  diseases: string[]
  stock: number
  category: string
  brand?: string
  dosage?: string
  prescriptionRequired?: boolean
  origin?: string
}

export default function Products() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)

  const resetForm = {
    name: '',
    description: '',
    price: '',
    pricePortuguese: '',
    priceIndian: '',
    category: 'medicamento',
    brand: '',
    dosage: '',
    origin: 'default',
    diseasesInput: '',
    prescriptionRequired: false,
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=60'
  }

  const [newProduct, setNewProduct] = useState(resetForm)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Imagem muito grande. Máximo 5MB.')
        return
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Apenas imagens são permitidas.')
        return
      }
      setSelectedImage(file)
      const previewUrl = URL.createObjectURL(file)
      setImagePreview(previewUrl)
      // Upload automático
      uploadImageMutation.mutate(file)
    }
  }

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/upload/product-image`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Failed to upload image')
      return response.json()
    },
    onSuccess: (data) => {
      setNewProduct(prev => ({ ...prev, imageUrl: data.url }))
      toast.success('Imagem enviada com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao fazer upload da imagem')
    }
  })

  const addProductMutation = useMutation({
    mutationFn: async (formData: typeof newProduct) => {
      const isMed = formData.category === 'medicamento';
      const hasBase = formData.price && parseFloat(formData.price) > 0;
      const hasPort = formData.pricePortuguese && parseFloat(formData.pricePortuguese) > 0;
      const hasInd = formData.priceIndian && parseFloat(formData.priceIndian) > 0;

      if (!isMed && !hasBase) {
        throw new Error('O preço base é obrigatório para produtos desta categoria.');
      }

      if (isMed && !hasBase && !hasPort && !hasInd) {
        throw new Error('Para medicamentos, preencha pelo menos um preço (Padrão, Português ou Indiano).');
      }

      // Single record with all prices
      const productData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        brand: formData.brand,
        dosage: formData.dosage,
        diseases: formData.diseasesInput.split(',').map((s: string) => s.trim()).filter(Boolean),
        prescriptionRequired: formData.prescriptionRequired,
        stock: 100,
        imageUrl: formData.imageUrl,
        price: formData.price || formData.pricePortuguese || formData.priceIndian,
        precoBase: formData.price || null,
        precoPortugues: formData.pricePortuguese || null,
        precoIndiano: formData.priceIndian || null,
        origin: 'default',
        isMainVariant: true,
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

      const created = await response.json();
      return { createdId: created.id };
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
      // Validate that at least one price is filled
      const hasBasePrice = data.formData.price && parseFloat(data.formData.price) > 0;
      const hasPortuguesePrice = data.formData.pricePortuguese && parseFloat(data.formData.pricePortuguese) > 0;
      const hasIndianPrice = data.formData.priceIndian && parseFloat(data.formData.priceIndian) > 0;

      if (!hasBasePrice && !hasPortuguesePrice && !hasIndianPrice) {
        throw new Error('Pelo menos um preço deve ser preenchido (Padrão, Português ou Indiano)');
      }

      const productData = {
        ...data.formData,
        diseases: data.formData.diseasesInput.split(',').map((s: string) => s.trim()).filter(Boolean),
        precoBase: data.formData.price || null,
        precoPortugues: data.formData.pricePortuguese || null,
        precoIndiano: data.formData.priceIndian || null,
      };
      delete productData.diseasesInput;
      delete productData.price;
      delete productData.pricePortuguese;
      delete productData.priceIndian;

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

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/products/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete product');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-products', user?.pharmacyId] })
      toast.success('Produto removido com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao remover produto.')
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
    <div className="space-y-6 bg-gray-50 min-h-screen transition-colors">
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
                  <Label htmlFor="price-top">Preço Base (AOA)</Label>
                  <Input
                    id="price-top"
                    type="number"
                    step="0.01"
                    placeholder="Ex: 1000"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                  />
                  {newProduct.price && !isNaN(parseFloat(newProduct.price)) && (
                    <p className="text-sm text-green-600 mt-1 font-medium">
                      Preço final: {parseFloat(newProduct.price).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
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

              {newProduct.category === 'medicamento' && (
                <>
                  <div>
                    <Label htmlFor="dosage">Dosagem</Label>
                    <Input
                      id="dosage"
                      value={newProduct.dosage}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, dosage: e.target.value }))}
                    />
                  </div>

                  {/* Preços por Origem - Apenas para Medicamentos */}
                  <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                    <Label className="font-semibold text-gray-700">Preços por Origem (AOA)</Label>
                    <p className="text-xs text-gray-500">Preencha pelo menos um preço</p>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="pricePortuguese" className="text-sm text-gray-600">Português</Label>
                        <Input
                          id="pricePortuguese"
                          type="number"
                          step="0.01"
                          placeholder="Ex: 1500"
                          value={newProduct.pricePortuguese}
                          onChange={(e) => setNewProduct(prev => ({ ...prev, pricePortuguese: e.target.value }))}
                        />
                        {newProduct.pricePortuguese && !isNaN(parseFloat(newProduct.pricePortuguese)) && (
                          <p className="text-xs text-green-600 mt-1">
                            Preço: {parseFloat(newProduct.pricePortuguese).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="priceIndian" className="text-sm text-gray-600">Indiano</Label>
                        <Input
                          id="priceIndian"
                          type="number"
                          step="0.01"
                          placeholder="Ex: 800"
                          value={newProduct.priceIndian}
                          onChange={(e) => setNewProduct(prev => ({ ...prev, priceIndian: e.target.value }))}
                        />
                        {newProduct.priceIndian && !isNaN(parseFloat(newProduct.priceIndian)) && (
                          <p className="text-xs text-green-600 mt-1">
                            Preço: {parseFloat(newProduct.priceIndian).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div>
                <Label>Imagem do Produto</Label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />

                {imagePreview || newProduct.imageUrl ? (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={imagePreview || newProduct.imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null)
                        setImagePreview(null)
                        setNewProduct(prev => ({ ...prev, imageUrl: '' }))
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                      className="absolute top-2 right-2 p-1 bg-white/80 hover:bg-white rounded-full shadow-sm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-video border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-green-500 hover:bg-green-50 transition-colors"
                  >
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-500">Clique para enviar imagem</span>
                    <span className="text-xs text-gray-400">ou cole URL abaixo</span>
                  </button>
                )}

                <div className="mt-2">
                  <Label htmlFor="imageUrl" className="text-xs text-gray-500">Ou insira URL da imagem:</Label>
                  <Input
                    id="imageUrl"
                    value={newProduct.imageUrl}
                    onChange={(e) => {
                      setNewProduct(prev => ({ ...prev, imageUrl: e.target.value }))
                      setSelectedImage(null)
                      setImagePreview(null)
                    }}
                    placeholder="https://..."
                    className="mt-1"
                  />
                </div>
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
                  <Label htmlFor="edit-price-top">Preço Base (AOA)</Label>
                  <Input
                    id="edit-price-top"
                    type="number"
                    step="0.01"
                    placeholder="Ex: 1000"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                  />
                  {newProduct.price && !isNaN(parseFloat(newProduct.price)) && (
                    <p className="text-sm text-green-600 mt-1 font-medium">
                      Preço final: {parseFloat(newProduct.price).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
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

              {newProduct.category === 'medicamento' && (
                <>
                  <div>
                    <Label htmlFor="edit-dosage">Dosagem</Label>
                    <Input
                      id="edit-dosage"
                      value={newProduct.dosage}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, dosage: e.target.value }))}
                    />
                  </div>

                  {/* Preços por Origem - Edit - Apenas para Medicamentos */}
                  <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                    <Label className="font-semibold text-gray-700">Preços por Origem (AOA)</Label>
                    <p className="text-xs text-gray-500">Preencha pelo menos um preço</p>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-pricePortuguese" className="text-sm text-gray-600">Português</Label>
                        <Input
                          id="edit-pricePortuguese"
                          type="number"
                          step="0.01"
                          placeholder="Ex: 1500"
                          value={newProduct.pricePortuguese}
                          onChange={(e) => setNewProduct(prev => ({ ...prev, pricePortuguese: e.target.value }))}
                        />
                        {newProduct.pricePortuguese && !isNaN(parseFloat(newProduct.pricePortuguese)) && (
                          <p className="text-xs text-green-600 mt-1">
                            Preço: {parseFloat(newProduct.pricePortuguese).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="edit-priceIndian" className="text-sm text-gray-600">Indiano</Label>
                        <Input
                          id="edit-priceIndian"
                          type="number"
                          step="0.01"
                          placeholder="Ex: 800"
                          value={newProduct.priceIndian}
                          onChange={(e) => setNewProduct(prev => ({ ...prev, priceIndian: e.target.value }))}
                        />
                        {newProduct.priceIndian && !isNaN(parseFloat(newProduct.priceIndian)) && (
                          <p className="text-xs text-green-600 mt-1">
                            Preço: {parseFloat(newProduct.priceIndian).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div>
                <Label>Imagem do Produto</Label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />

                {imagePreview || newProduct.imageUrl ? (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={imagePreview || newProduct.imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null)
                        setImagePreview(null)
                        setNewProduct(prev => ({ ...prev, imageUrl: '' }))
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                      className="absolute top-2 right-2 p-1 bg-white/80 hover:bg-white rounded-full shadow-sm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-video border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-green-500 hover:bg-green-50 transition-colors"
                  >
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-500">Clique para enviar imagem</span>
                    <span className="text-xs text-gray-400">ou cole URL abaixo</span>
                  </button>
                )}

                <div className="mt-2">
                  <Label htmlFor="edit-imageUrl" className="text-xs text-gray-500">Ou insira URL da imagem:</Label>
                  <Input
                    id="edit-imageUrl"
                    value={newProduct.imageUrl}
                    onChange={(e) => {
                      setNewProduct(prev => ({ ...prev, imageUrl: e.target.value }))
                      setSelectedImage(null)
                      setImagePreview(null)
                    }}
                    placeholder="https://..."
                    className="mt-1"
                  />
                </div>
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
          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        {filteredProducts?.map((product) => (
          <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all">
            <div className="aspect-video bg-gray-100 relative">
              <ProductImage
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
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
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{product.name}</h3>
              <div className="flex flex-wrap gap-1 mt-1">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded capitalize">
                  {product.category}
                </span>
                {product.diseases && product.diseases.slice(0, 2).map((disease, i) => (
                  <span key={i} className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded">
                    {disease}
                  </span>
                ))}
              </div>
              {(() => {
                const ptVal = (product as any).precoPortugues ? parseFloat(String((product as any).precoPortugues)) : 0;
                const inVal = (product as any).precoIndiano ? parseFloat(String((product as any).precoIndiano)) : 0;
                const baseValVal = product.price ? parseFloat(String(product.price)) : 0;

                const getDisplayPrice = () => {
                  if (baseValVal > 0) return { value: baseValVal, isFallback: false };
                  if (ptVal > 0) return { value: ptVal, isFallback: true, fallbackOrigin: 'portugues' };
                  if (inVal > 0) return { value: inVal, isFallback: true, fallbackOrigin: 'indiano' };
                  return null;
                };

                const display = getDisplayPrice();

                type PriceEntry = { label: string; badge: string; badgeClass: string; value: number; origin: string | null };
                const getAvailablePrices = (): PriceEntry[] => {
                  const entries: PriceEntry[] = [];
                  if (baseValVal > 0) entries.push({ label: 'Base', badge: '🏷️ Base', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200', value: baseValVal, origin: null });
                  if (ptVal > 0) entries.push({ label: 'Português', badge: '🇵🇹 Português', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200', value: ptVal, origin: 'portugues' });
                  if (inVal > 0) entries.push({ label: 'Indiano', badge: '🇮🇳 Indiano', badgeClass: 'bg-orange-50 text-orange-700 border-orange-200', value: inVal, origin: 'indiano' });
                  return entries;
                };

                const formatKz = (value: number) => {
                  return value.toLocaleString('pt-AO', {
                    style: 'currency',
                    currency: 'AOA',
                    minimumFractionDigits: 2,
                  });
                };

                const prices = getAvailablePrices();
                const hasBasePrice = display && !display.isFallback;

                if (!display) {
                  return <span className="text-sm text-slate-400 mt-2 font-medium">Preço sob consulta</span>;
                }

                if (prices.length > 0) {
                  return (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {prices.map(entry => (
                        <span key={entry.origin ?? 'default'} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border ${entry.badgeClass}`}>
                          <span>{entry.badge}</span>
                          <span className="font-bold ml-1">{formatKz(entry.value)}</span>
                        </span>
                      ))}
                    </div>
                  );
                }

                return (
                  <div className="mt-3">
                    <span className="text-sm text-slate-400 mt-2 font-medium">Preço sob consulta</span>
                  </div>
                );
              })()}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => {
                    setEditingProduct(product);
                    setNewProduct({
                      name: product.name,
                      description: product.description,
                      price: product.precoBase || product.price || '',
                      pricePortuguese: (product as any).precoPortugues || '',
                      priceIndian: (product as any).precoIndiano || '',
                      category: product.category || 'medicamento',
                      brand: (product as any).brand || '',
                      dosage: (product as any).dosage || '',
                      origin: (product as any).origin || 'default',
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
                  className={`flex-1 text-xs sm:text-sm font-medium py-2 px-4 rounded-lg transition-colors ${product.stock > 0
                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                    : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                >
                  {product.stock > 0 ? 'Tirar de Stock' : 'Pôr em Stock'}
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Tem a certeza que deseja remover este produto?')) {
                      deleteProductMutation.mutate(product.id)
                    }
                  }}
                  disabled={deleteProductMutation.isPending}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Remover produto"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {
        filteredProducts?.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Nenhum produto encontrado</h3>
            <p className="text-gray-500">Adicione produtos para começar a vender</p>
          </div>
        )
      }
    </div >
  )
}

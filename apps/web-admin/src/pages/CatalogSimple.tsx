import { useState } from 'react'
import { toast } from 'sonner'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X,
  Eye
} from 'lucide-react'

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
  pharmacyId?: number
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

export default function CatalogSimple() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      name: "Paracetamol 500mg",
      description: "Analgésico e antitérmico indicado para o alívio temporário da dor leve a moderada associada a gripes e resfriados.",
      price: "1250",
      imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60",
      diseases: ["dor de cabeça", "febre", "inflamação"],
      activeIngredient: "Paracetamol",
      category: "medicamento",
      brand: "Genérico",
      dosage: "500mg",
      prescriptionRequired: false,
      stock: 100,
      pharmacyId: 1,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      name: "Vitamina D3 2000UI",
      description: "Suplemento vitamínico essencial para a saúde óssea e imunidade.",
      price: "2500",
      imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&auto=format&fit=crop&q=60",
      diseases: ["deficiência de vitamina D", "fraqueza óssea"],
      activeIngredient: "Colecalciferol",
      category: "vitamina",
      brand: "VitaPlus",
      dosage: "2000UI",
      prescriptionRequired: false,
      stock: 50,
      pharmacyId: 1,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ])

  const handleCreateProduct = (productData: any) => {
    const newProduct: Product = {
      id: Date.now(),
      ...productData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setProducts([...products, newProduct])
    setIsCreateModalOpen(false)
    toast.success('Produto criado com sucesso!')
  }

  const handleDeleteProduct = (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      setProducts(products.filter(p => p.id !== id))
      toast.success('Produto excluído com sucesso!')
    }
  }

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA'
    }).format(parseFloat(value))
  }

  const getStatusInfo = (status: string) => {
    return statuses.find(s => s.value === status) || statuses[0]
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Esgotado', color: 'bg-red-100 text-red-800' }
    if (stock < 10) return { label: 'Estoque baixo', color: 'bg-yellow-100 text-yellow-800' }
    return { label: 'Disponível', color: 'bg-green-100 text-green-800' }
  }

  const filteredProducts = products.filter((product) => {
    const query = search.trim().toLowerCase()
    const matchesSearch =
      !query ||
      product.name.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query) ||
      product.brand?.toLowerCase().includes(query)
    const matchesCategory = !selectedCategory || product.category === selectedCategory
    const matchesStatus = !selectedStatus || product.status === selectedStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Catálogo de Produtos</h1>
          <p className="text-muted-foreground">Gerencie o catálogo de produtos</p>
        </div>
        
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Novo Produto
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todas as categorias</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos os status</option>
            {statuses.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => {
          const statusInfo = getStatusInfo(product.status)
          const stockStatus = getStockStatus(product.stock)
          
          return (
            <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
                <img 
                  src={product.imageUrl} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
                    <p className="text-sm text-gray-500">{product.brand}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${stockStatus.color}`}>
                      {stockStatus.label}
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 line-clamp-2">
                  {product.description}
                </p>
                
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-blue-600">
                    {formatCurrency(product.price)}
                  </span>
                  <span className="text-sm text-gray-500">
                    Estoque: {product.stock}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  
                  <button
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Simple Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Novo Produto</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target as HTMLFormElement)
              const productData = {
                name: formData.get('name'),
                description: formData.get('description'),
                price: formData.get('price'),
                imageUrl: formData.get('imageUrl'),
                diseases: formData.get('diseases')?.toString().split(',').map((d: string) => d.trim()),
                activeIngredient: formData.get('activeIngredient'),
                category: formData.get('category'),
                brand: formData.get('brand'),
                dosage: formData.get('dosage'),
                prescriptionRequired: formData.get('prescriptionRequired') === 'on',
                stock: parseInt(formData.get('stock')?.toString() || '0'),
                status: formData.get('status')
              }
              handleCreateProduct(productData)
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome *</label>
                  <input name="name" required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Marca</label>
                  <input name="brand" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Descrição *</label>
                <textarea name="description" required rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Preço (AOA) *</label>
                  <input name="price" type="number" step="0.01" required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Estoque *</label>
                  <input name="stock" type="number" required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Categoria *</label>
                  <select name="category" required className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status *</label>
                  <select name="status" required className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    {statuses.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Princípio Ativo *</label>
                  <input name="activeIngredient" required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Dosagem</label>
                  <input name="dosage" placeholder="Ex: 500mg, 10ml" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">URL da Imagem *</label>
                <input name="imageUrl" type="url" required placeholder="https://exemplo.com/imagem.jpg" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Indicações (separadas por vírgula) *</label>
                <textarea name="diseases" required placeholder="dor de cabeça, febre, inflamação" rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              
              <div className="flex items-center space-x-2">
                <input type="checkbox" name="prescriptionRequired" className="rounded" />
                <label className="text-sm font-medium">Requer receita médica</label>
              </div>
              
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Criar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

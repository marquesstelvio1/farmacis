import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Filter, Grid, List, X, Package, ShoppingCart, Star } from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'
import { useCart } from '@/hooks/use-cart'

interface Product {
  id: number
  name: string
  description: string
  price: string
  imageUrl: string
  diseases: string[]
  activeIngredient: string
  category?: string
  brand?: string
  rating?: number
  inStock?: boolean
}

const categories = [
  { id: 'all', name: 'Todos', icon: Package },
  { id: 'medicamento', name: 'Medicamentos', icon: Package },
  { id: 'vitamina', name: 'Vitaminas', icon: Star },
  { id: 'suplemento', name: 'Suplementos', icon: Star },
  { id: 'cosmetico', name: 'Cosméticos', icon: Star },
  { id: 'higiene', name: 'Higiene', icon: Star },
]

const sortOptions = [
  { id: 'name', name: 'Nome' },
  { id: 'price-low', name: 'Menor Preço' },
  { id: 'price-high', name: 'Maior Preço' },
  { id: 'rating', name: 'Avaliação' },
]

export default function Catalog() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSort, setSelectedSort] = useState('name')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const { addToCart } = useCart()

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['products', search, selectedCategory, selectedSort, priceRange],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      if (selectedSort) params.append('sort', selectedSort)
      if (priceRange.min) params.append('minPrice', priceRange.min)
      if (priceRange.max) params.append('maxPrice', priceRange.max)
      
      const response = await fetch(`/api/products?${params}`)
      if (!response.ok) throw new Error('Failed to fetch products')
      return response.json()
    }
  })

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    product.description.toLowerCase().includes(search.toLowerCase()) ||
    product.diseases.some(disease => 
      disease.toLowerCase().includes(search.toLowerCase())
    )
  )

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA'
    }).format(parseFloat(value))
  }

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      quantity: 1,
      imageUrl: product.imageUrl
    })
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold text-red-800 mb-2">Erro ao carregar catálogo</h1>
          <p className="text-red-600">Por favor, tente novamente mais tarde.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Package className="w-8 h-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Farmácis</span>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar medicamentos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <Filter className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
              </button>

              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Filters Sidebar */}
      {showFilters && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowFilters(false)} />
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Filtros</h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Categoria</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <label key={category.id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="radio"
                        name="category"
                        value={category.id}
                        checked={selectedCategory === category.id}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <category.icon className="w-4 h-4 text-gray-600" />
                      <span className="text-sm">{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Ordenar por</h3>
                <div className="space-y-2">
                  {sortOptions.map((option) => (
                    <label key={option.id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="radio"
                        name="sort"
                        value={option.id}
                        checked={selectedSort === option.id}
                        onChange={(e) => setSelectedSort(e.target.value)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{option.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Faixa de Preço</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">De</label>
                    <input
                      type="number"
                      placeholder="Mínimo"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Até</label>
                    <input
                      type="number"
                      placeholder="Máximo"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Active Filters */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900">Filtros Ativos</h3>
                  <button
                    onClick={() => {
                      setSearch('')
                      setSelectedCategory('all')
                      setSelectedSort('name')
                      setPriceRange({ min: '', max: '' })
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Limpar todos
                  </button>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  {search && <div>• Busca: "{search}"</div>}
                  {selectedCategory !== 'all' && <div>• Categoria: {categories.find(c => c.id === selectedCategory)?.name}</div>}
                  {priceRange.min && <div>• Preço: {formatCurrency(priceRange.min)}+</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Catálogo de Produtos</h1>
          <p className="text-gray-600">
            {filteredProducts.length} produtos encontrados
          </p>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
              <p className="text-gray-600">Carregando produtos...</p>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Nenhum produto encontrado</h2>
            <p className="text-gray-600">
              {search ? 'Tente buscar com outros termos.' : 'Navegue pelas categorias para encontrar o que precisa.'}
            </p>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
            : "space-y-4"
          }>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={() => handleAddToCart(product)}
                compact={viewMode === 'list'}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            © 2024 Farmácis. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  )
}

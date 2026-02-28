import { ShoppingCart, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { type ProductResponse } from "@shared/routes";
import { useCart } from "@/hooks/use-cart";
import { useState } from "react";

interface ProductCardProps {
  product: ProductResponse;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const addItem = useCart((state) => state.addItem);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative bg-white rounded-2xl p-5 shadow-lg shadow-blue-900/5 border border-slate-100 hover:shadow-xl hover:shadow-blue-900/10 hover:border-blue-100 transition-all duration-300 flex flex-col h-full"
    >
      <div className="relative h-48 w-full mb-6 rounded-xl overflow-hidden bg-slate-50">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-contain mix-blend-multiply p-4 transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-blue-600 shadow-sm border border-blue-50">
          {product.activeIngredient}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-1">{product.name}</h3>
        <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">
          {product.description}
        </p>

        <div className="flex flex-wrap gap-1 mb-4">
          {product.diseases.slice(0, 2).map((disease) => (
            <span key={disease} className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
              {disease}
            </span>
          ))}
          {product.diseases.length > 2 && (
            <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
              +{product.diseases.length - 2}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-medium">Preço</span>
            <span className="text-2xl font-extrabold text-blue-600">
              {Number(product.price).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
            </span>
          </div>

          <button
            onClick={() => addItem(product)}
            className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors duration-200 shadow-sm active:scale-95"
            aria-label="Adicionar ao carrinho"
          >
            {isHovered ? <Plus size={24} /> : <ShoppingCart size={22} />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

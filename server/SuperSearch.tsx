import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Search, Camera } from 'lucide-react';

const SuperSearch = () => {
  const [activeTab, setActiveTab] = useState<string | null>(null);

  // Variantes para o efeito de Fade Premium
  const fadeVariants = {
    initial: { opacity: 0, y: 5 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -5 },
  };

  const tabs = [
    { id: 'ia', label: 'Assistente IA', sub: 'Conversar', icon: <Bot /> },
    { id: 'search', label: 'Pesquisar', sub: 'Nome ou Doença', icon: <Search /> },
    { id: 'photo', label: 'Enviar Foto', sub: 'Receitas/Caixas', icon: <Camera /> },
  ] as const;

  return (
    <div className="w-full max-w-4xl mx-auto p-6 font-sans">
      {/* Barra Tripla Baseada no teu Esboço */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {tabs.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center p-4 rounded-2xl transition-all duration-300 border-2 ${
              activeTab === item.id 
              ? 'border-blue-500 bg-blue-50 shadow-md scale-105' 
              : 'border-gray-100 bg-white hover:border-blue-200'
            }`}
          >
            <div className={`${activeTab === item.id ? 'text-blue-600' : 'text-gray-400'}`}>
              {item.icon}
            </div>
            <span className="font-bold text-gray-800 mt-2">{item.label}</span>
            <span className="text-xs text-gray-500">{item.sub}</span>
          </button>
        ))}
      </div>

      {/* Área de Conteúdo com Fade In / Fade Out */}
      <div className="relative min-h-[200px] bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <AnimatePresence mode="wait">
          {activeTab === 'ia' && (
            <motion.div
              key="ia-view"
              variants={fadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-4"
            >
              <h3 className="text-xl font-bold text-blue-600 flex items-center gap-2">
                <Bot size={20} /> Assistente de Saúde IA
              </h3>
              <input 
                className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-blue-400 outline-none"
                placeholder="Ex: Estou com dor de cabeça e febre, o que sugere?"
              />
            </motion.div>
          )}

          {activeTab === 'search' && (
            <motion.div
              key="search-view"
              variants={fadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">Procurar Medicamento</h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <input 
                  autoFocus
                  className="flex-1 p-4 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none transition-colors"
                  placeholder="Digite o nome do remédio ou a patologia..."
                />
                <button className="bg-blue-600 text-white px-6 py-4 sm:py-0 rounded-xl font-bold hover:bg-blue-700 transition-colors">
                  Buscar
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'photo' && (
            <motion.div
              key="photo-view"
              variants={fadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-10 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <Camera size={48} className="text-gray-300 mb-4" />
              <p className="text-gray-600 font-medium text-center">Arraste a sua receita ou foto do medicamento</p>
              <span className="text-sm text-gray-400 mt-1">Formatos aceitos: JPG, PNG</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SuperSearch;
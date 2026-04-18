import { motion } from "framer-motion";
import { 
  Pill, 
  Stethoscope, 
  UserRound, 
  ShieldCheck, 
  BookOpen,
  ArrowRight 
} from "lucide-react";
import { useLocation } from "wouter";

interface ServiceCard {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  path: string;
  color: string;
}

const services: ServiceCard[] = [
  {
    id: "pharmacies",
    title: "Farmácia",
    subtitle: "Entrega em 30min",
    icon: Pill,
    path: "/farmacias",
    color: "text-blue-600",
  },
  {
    id: "clinics",
    title: "Marcar Consultas",
    subtitle: "Centros médicos próximos",
    icon: Stethoscope,
    path: "/clinicas",
    color: "text-blue-600",
  },
  {
    id: "professionals",
    title: "Especialistas",
    subtitle: "Médicos credenciados",
    icon: UserRound,
    path: "/profissionais",
    color: "text-blue-600",
  },
  {
    id: "insurance",
    title: "Planos de Saúde",
    subtitle: "Validar o seu seguro",
    icon: ShieldCheck,
    path: "/seguradoras",
    color: "text-blue-600",
  },
  {
    id: "catalog",
    title: "Ver Catálogo",
    subtitle: "Ofertas das farmácias",
    icon: BookOpen,
    path: "/catalogo", // Mantém o path para a página de catálogo
    color: "text-blue-600",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export function QuickServices() {
  const [, setLocation] = useLocation();

  return (
    <motion.section 
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-8 sm:py-12"
    >
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-black flex items-center gap-2">
          <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
          Serviços Rápidos
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {services.map((service, index) => (
          <motion.div
            key={service.id}
            variants={itemVariants}
            whileHover={{ y: -8 }}
            onClick={() => setLocation(service.path)}
            className={`group relative bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-xl transition-shadow duration-300 cursor-pointer flex flex-col items-start ${
              index === 4 ? "md:col-span-2" : ""
            }`}
          >
            <div className={`p-3 rounded-xl bg-white group-hover:bg-green-50 transition-colors duration-300 mb-4`}>
              <service.icon 
                size={28} 
                className="text-green-500 group-hover:text-green-600 transition-colors duration-300" 
              />
            </div>
            
            <h3 className="font-bold text-black text-lg mb-1 group-hover:text-black transition-colors">
              {service.title}
            </h3>
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
              {service.subtitle}
            </p>

            <div className="mt-auto flex items-center text-green-600 text-xs font-bold opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
              SABER MAIS <ArrowRight size={14} className="ml-1" />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
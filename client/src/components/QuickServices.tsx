import { motion } from "framer-motion";
import { 
  Pill, 
  Stethoscope, 
  UserRound, 
  ShieldCheck, 
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
    title: "Consultas",
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
    title: "Seguros",
    subtitle: "Validar o seu seguro",
    icon: ShieldCheck,
    path: "/seguradoras",
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
      className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-2 sm:py-6"
    >
      <div className="mb-2 sm:mb-4">
        <h2 className="text-lg font-extrabold text-black flex items-center gap-2">
          <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
          Serviços Rápidos
        </h2>
      </div>

      {/* Mobile: 2x2 square layout | Desktop: 2 columns rectangular */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-6">
        {services.map((service) => (
          <motion.div
            key={service.id}
            variants={itemVariants}
            whileHover={{ y: -4 }}
            onClick={() => setLocation(service.path)}
            className="group relative bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 cursor-pointer overflow-hidden aspect-square md:aspect-auto p-2 sm:p-3"
          >
            <div className="flex flex-col items-center justify-center h-full md:items-start">
              <div className={`p-1 md:p-1.5 rounded-xl bg-gray-50 group-hover:bg-green-50 transition-colors duration-300 mb-1 md:mb-2`}>
                <service.icon
                  size={38}
                  className="text-green-500 group-hover:text-green-600 transition-colors duration-300 md:w-12 md:h-12"
                />
              </div>

              <h3 className="font-bold text-black text-[10px] sm:text-sm mb-0.5 md:mb-1 text-center md:text-left transition-colors">
                {service.title}
              </h3>
              <p className="text-gray-500 text-[8px] sm:text-[11px] md:text-gray-600 text-center md:text-left md:mb-2 leading-tight md:leading-relaxed hidden sm:block">
                {service.subtitle}
              </p>

              <div className="mt-auto flex items-center text-green-600 text-[10px] sm:text-xs font-bold opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0 hidden md:flex">
                SABER MAIS <ArrowRight size={14} className="ml-1" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
import { motion } from 'framer-motion';
import { Activity, MapPin, User, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickServices = () => {
  const navigate = useNavigate();

  const services = [
    {
      id: 1,
      icon: Activity,
      title: 'Farmácia',
      subtitle: 'Explore as farmácias Plataforma',
      route: '/farmacias',
    },
    {
      id: 2,
      icon: MapPin,
      title: 'Marcar Consultas',
      subtitle: 'Centros médicos próximos',
      route: '/clinicas',
    },
    {
      id: 3,
      icon: User,
      title: 'Especialistas',
      subtitle: 'Médicos credenciados',
      route: '/profissionais',
    },
    {
      id: 4,
      icon: ShieldCheck,
      title: 'Planos de Saúde',
      subtitle: 'Validar o seu seguro',
      route: '/seguros',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {services.map((service) => (
        <motion.div
          key={service.id}
          variants={itemVariants}
          initial="hidden"
          animate="show"
          className="group relative bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-sm p-6 cursor-pointer"
          whileHover={{
            y: -8,
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
          }}
          onClick={() => navigate(service.route)}
        >
          <div className="flex items-center mb-3">
            <span
              className="text-gray-500 dark:text-gray-400 transition-colors duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 mr-3"
            >
              <service.icon className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">{service.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{service.subtitle}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default QuickServices;
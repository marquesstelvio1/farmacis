import { Store, Truck } from "lucide-react";
import { motion } from "framer-motion";

interface DeliveryToggleProps {
  value: "delivery" | "pickup";
  onChange: (value: "delivery" | "pickup") => void;
  pharmacyName: string;
}

export function DeliveryToggle({ value, onChange, pharmacyName }: DeliveryToggleProps) {
  const isDelivery = value === "delivery";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wide text-slate-600">
          Método de entrega
        </label>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
          isDelivery 
            ? 'bg-blue-100 text-blue-700' 
            : 'bg-amber-100 text-amber-700'
        }`}>
          {isDelivery ? 'Entrega à domicílio' : 'Levantar na farmácia'}
        </span>
      </div>

      <div className="relative inline-flex items-center gap-2 bg-slate-100 p-1 rounded-full w-full max-w-sm">
        {/* Slider Background */}
        <motion.div
          className={`absolute h-12 rounded-full transition-all ${
            isDelivery ? 'bg-blue-500' : 'bg-amber-500'
          }`}
          animate={{
            x: isDelivery ? 0 : 'calc(100% + 4px)',
            width: isDelivery ? 'calc(50% - 2px)' : 'calc(50% - 2px)'
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />

        {/* Entrega Button */}
        <button
          type="button"
          onClick={() => onChange("delivery")}
          className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full font-bold text-sm transition-colors ${
            isDelivery 
              ? 'text-white' 
              : 'text-slate-600 hover:text-slate-700'
          }`}
        >
          <Truck size={18} />
          <span>Entrega</span>
        </button>

        {/* Reserva Button */}
        <button
          type="button"
          onClick={() => onChange("pickup")}
          className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full font-bold text-sm transition-colors ${
            !isDelivery 
              ? 'text-white' 
              : 'text-slate-600 hover:text-slate-700'
          }`}
        >
          <Store size={18} />
          <span>Reserva</span>
        </button>
      </div>

      {/* Info text */}
      <p className="text-xs text-slate-500 italic">
        {isDelivery 
          ? '✓ Entrega em sua casa com taxa de frete'
          : '✓ Levante gratuitamente na farmácia'
        }
      </p>
    </div>
  );
}

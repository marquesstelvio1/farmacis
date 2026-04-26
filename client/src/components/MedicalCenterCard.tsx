import { Star, MapPin, Clock, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MedicalCenterCardProps {
  name: string;
  specialty: string;
  rating: number;
  address: string;
  hours: string;
  phone: string;
  distance: string;
  onBookAppointment?: () => void;
}

export function MedicalCenterCard({
  name,
  specialty,
  rating,
  address,
  hours,
  phone,
  distance,
  onBookAppointment,
}: MedicalCenterCardProps) {
  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all hover:border-blue-400/50">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">{name}</h3>
            <p className="text-blue-300 text-sm font-semibold">{specialty}</p>
          </div>
          <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded-lg">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-yellow-300 font-bold text-sm">{rating}</span>
          </div>
        </div>

        <div className="space-y-2 text-sm text-slate-300">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal-400" />
            <span>{address}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-400" />
            <span>{hours}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-teal-400" />
            <a href={`tel:${phone}`} className="hover:text-white transition">
              {phone}
            </a>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal-400" />
            <span className="font-semibold">{distance}</span>
          </div>
        </div>

        <Button
          onClick={onBookAppointment}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition"
        >
          Marcar Consulta
        </Button>
      </div>
    </div>
  );
}

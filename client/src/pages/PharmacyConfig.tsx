import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Store,
  MapPin,
  Phone,
  Mail,
  Clock,
  CreditCard,
  FileText,
  Image,
  Save,
  ArrowLeft,
  Loader2,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface PharmacyData {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  lat: string;
  lng: string;
  description: string;
  logoUrl: string;
  documentUrl: string;
  iban: string;
  multicaixaExpress: string;
  accountName: string;
  openingHours: string;
}

const defaultOpeningHours = {
  monday: { open: "08:00", close: "18:00", closed: false },
  tuesday: { open: "08:00", close: "18:00", closed: false },
  wednesday: { open: "08:00", close: "18:00", closed: false },
  thursday: { open: "08:00", close: "18:00", closed: false },
  friday: { open: "08:00", close: "18:00", closed: false },
  saturday: { open: "08:00", close: "13:00", closed: false },
  sunday: { open: "08:00", close: "13:00", closed: true }
};

export default function PharmacyConfig() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pharmacy, setPharmacy] = useState<PharmacyData | null>(null);
  const [openingHours, setOpeningHours] = useState(defaultOpeningHours);

  useEffect(() => {
    fetchPharmacyData();
  }, []);

  const fetchPharmacyData = async () => {
    setLoading(true);
    try {
      // Try to get from localStorage first (pharmacy admin session)
      const sessionData = localStorage.getItem("pharmacyAdmin");
      if (sessionData) {
        const session = JSON.parse(sessionData);
        // Fetch full pharmacy details
        const res = await fetch(`/api/pharmacy/${session.pharmacyId}/details`, {
          headers: { "Authorization": `Bearer ${session.token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPharmacy(data);
          if (data.openingHours) {
            setOpeningHours({ ...defaultOpeningHours, ...JSON.parse(data.openingHours) });
          }
        }
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar dados da farmácia",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!pharmacy) return;
    
    setSaving(true);
    try {
      const sessionData = localStorage.getItem("pharmacyAdmin");
      if (!sessionData) throw new Error("Sessão não encontrada");
      
      const session = JSON.parse(sessionData);
      
      const res = await fetch(`/api/pharmacy/${pharmacy.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.token}`
        },
        body: JSON.stringify({
          ...pharmacy,
          openingHours: JSON.stringify(openingHours)
        })
      });

      if (!res.ok) throw new Error("Erro ao salvar");

      toast({
        title: "Sucesso",
        description: "Dados da farmácia atualizados com sucesso!"
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof PharmacyData, value: string) => {
    if (pharmacy) {
      setPharmacy({ ...pharmacy, [field]: value });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!pharmacy) {
    return (
      <div className="min-h-screen bg-slate-50 pb-24">
        <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <Link href="/menu-de-configuracoes">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <h1 className="font-bold text-lg">Minha Farmácia</h1>
            </div>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <Store className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-700 mb-2">Nenhuma farmácia associada</h2>
          <p className="text-slate-500">Contacte o administrador para associar uma farmácia à sua conta.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/menu-de-configuracoes">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="font-bold text-lg">Minha Farmácia</h1>
                <p className="text-sm text-slate-500">Configure os dados da sua farmácia</p>
              </div>
            </div>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Informações Básicas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5 text-green-600" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nome da Farmácia</Label>
                <Input
                  id="name"
                  value={pharmacy.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Ex: Farmácia Central"
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={pharmacy.description || ""}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Descreva a sua farmácia..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      value={pharmacy.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className="pl-10"
                      placeholder="farmacia@email.com"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="phone"
                      value={pharmacy.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      className="pl-10"
                      placeholder="+244 9XX XXX XXX"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Localização */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Localização
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Endereço Completo</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="address"
                    value={pharmacy.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    className="pl-10"
                    placeholder="Rua, número, bairro, cidade"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lat">Latitude</Label>
                  <Input
                    id="lat"
                    value={pharmacy.lat}
                    onChange={(e) => updateField("lat", e.target.value)}
                    placeholder="-8.123456"
                  />
                </div>
                <div>
                  <Label htmlFor="lng">Longitude</Label>
                  <Input
                    id="lng"
                    value={pharmacy.lng}
                    onChange={(e) => updateField("lng", e.target.value)}
                    placeholder="13.123456"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Horário de Funcionamento */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                Horário de Funcionamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(openingHours).map(([day, hours]) => (
                  <div key={day} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                    <span className="w-24 text-sm font-medium capitalize">{day === "monday" ? "Segunda" : day === "tuesday" ? "Terça" : day === "wednesday" ? "Quarta" : day === "thursday" ? "Quinta" : day === "friday" ? "Sexta" : day === "saturday" ? "Sábado" : "Domingo"}</span>
                    {hours.closed ? (
                      <span className="text-sm text-slate-500">Fechado</span>
                    ) : (
                      <>
                        <Input
                          type="time"
                          value={hours.open}
                          onChange={(e) => setOpeningHours({ ...openingHours, [day]: { ...hours, open: e.target.value } })}
                          className="w-24"
                        />
                        <span className="text-slate-400">até</span>
                        <Input
                          type="time"
                          value={hours.close}
                          onChange={(e) => setOpeningHours({ ...openingHours, [day]: { ...hours, close: e.target.value } })}
                          className="w-24"
                        />
                      </>
                    )}
                    <label className="flex items-center gap-2 ml-auto">
                      <input
                        type="checkbox"
                        checked={hours.closed}
                        onChange={(e) => setOpeningHours({ ...openingHours, [day]: { ...hours, closed: e.target.checked } })}
                        className="rounded"
                      />
                      <span className="text-sm text-slate-500">Fechado</span>
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Dados de Pagamento */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-600" />
                Dados de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="accountName">Nome da Conta</Label>
                <Input
                  id="accountName"
                  value={pharmacy.accountName || ""}
                  onChange={(e) => updateField("accountName", e.target.value)}
                  placeholder="Nome associado à conta bancária"
                />
              </div>
              <div>
                <Label htmlFor="iban">IBAN</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="iban"
                    value={pharmacy.iban || ""}
                    onChange={(e) => updateField("iban", e.target.value)}
                    className="pl-10 font-mono"
                    placeholder="AO06 0000 0000 0000 0000 0000 0"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="multicaixa">Multicaixa Express</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="multicaixa"
                    value={pharmacy.multicaixaExpress || ""}
                    onChange={(e) => updateField("multicaixaExpress", e.target.value)}
                    className="pl-10"
                    placeholder="Número Multicaixa Express"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Documentos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-600" />
                Documentos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="logoUrl">URL do Logo</Label>
                <div className="relative">
                  <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="logoUrl"
                    value={pharmacy.logoUrl || ""}
                    onChange={(e) => updateField("logoUrl", e.target.value)}
                    className="pl-10"
                    placeholder="https://exemplo.com/logo.png"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="documentUrl">URL do Documento (Alvará)</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="documentUrl"
                    value={pharmacy.documentUrl || ""}
                    onChange={(e) => updateField("documentUrl", e.target.value)}
                    className="pl-10"
                    placeholder="https://exemplo.com/alvara.pdf"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

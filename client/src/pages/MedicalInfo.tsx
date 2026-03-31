import { useState, useEffect, useCallback } from "react";
import { Heart, Phone, AlertCircle, Droplets, Save, User, Shield, Activity, UserCheck, Loader2, Plus, Trash2, Clock, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface EmergencyContact {
  name: string;
  phone: string;
}

interface MedicalInfo {
  idNumber: string;
  bloodType: string;
  allergies: string;
  chronicDiseases: string;
  medications: string;
  emergencyContacts: EmergencyContact[];
  insuranceProvider: string;
  insuranceNumber: string;
  isOrganDonor: boolean;
  observations: string;
}

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Não sei"];

export default function MedicalInfo() {
  const [medicalInfo, setMedicalInfo] = useState<MedicalInfo>({
    idNumber: "",
    bloodType: "",
    allergies: "",
    chronicDiseases: "",
    medications: "",
    emergencyContacts: [{ name: "", phone: "" }],
    insuranceProvider: "",
    insuranceNumber: "",
    isOrganDonor: false,
    observations: ""
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;

  useEffect(() => {
    const fetchMedicalInfo = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`/api/user/${user.id}/medical-info`);
        if (res.ok) {
          const data = await res.json();
          if (data.id) {
            setMedicalInfo({
              ...data,
              emergencyContacts: data.emergencyContacts ? JSON.parse(data.emergencyContacts) : [{ name: "", phone: "" }]
            });
          }
        }
      } finally {
        setLoading(false);
      }
    };
    fetchMedicalInfo();
  }, [user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/user/${user.id}/medical-info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...medicalInfo,
          emergencyContacts: JSON.stringify(medicalInfo.emergencyContacts)
        }),
      });
      if (res.ok) {
        toast({ title: "Sucesso", description: "Dados médicos atualizados com segurança." });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: keyof MedicalInfo, value: string | boolean) => {
    setMedicalInfo(prev => ({ ...prev, [field]: value }));
  };

  const updateContact = (index: number, field: keyof EmergencyContact, value: string) => {
    const newContacts = [...medicalInfo.emergencyContacts];
    newContacts[index][field] = value;

    // Auto-expand logic: if last contact is being typed and we have < 5
    const lastContact = newContacts[newContacts.length - 1];
    if (lastContact.name && lastContact.phone && newContacts.length < 5) {
      newContacts.push({ name: "", phone: "" });
    }

    setMedicalInfo(prev => ({ ...prev, emergencyContacts: newContacts }));
  };

  const removeContact = (index: number) => {
    if (medicalInfo.emergencyContacts.length <= 1) {
      setMedicalInfo(prev => ({ ...prev, emergencyContacts: [{ name: "", phone: "" }] }));
      return;
    }
    const newContacts = medicalInfo.emergencyContacts.filter((_, i) => i !== index);
    setMedicalInfo(prev => ({ ...prev, emergencyContacts: newContacts }));
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <Loader2 className="animate-spin text-blue-600 dark:text-blue-400 w-10 h-10" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Digital Medical ID Card Preview */}
        <div className="mb-10 relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-blue-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">
            <div className="bg-red-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <Heart className="fill-white animate-pulse" />
                <span className="font-black tracking-tighter text-xl">MEDICAL ID</span>
              </div>
              <div className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-widest">
                Emergência
              </div>
            </div>
            <div className="p-6 grid grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Nome</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">{user?.name || '---'}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Tipo Sanguíneo</p>
                <p className="font-black text-red-600 dark:text-red-400 text-xl">{medicalInfo.bloodType || '--'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Contacto SOS</p>
                <p className="font-semibold text-slate-700 dark:text-slate-300">{medicalInfo.emergencyContacts[0]?.phone || '---'}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Doador</p>
                <p className="font-semibold text-slate-700 dark:text-slate-300">{medicalInfo.isOrganDonor ? 'SIM' : 'NÃO'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Informações Médicas</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Mantenha suas informações médicas atualizadas para um atendimento mais seguro.
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Droplets className="w-5 h-5 text-red-500 dark:text-red-400" />
                Dados Médicos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Número do Bilhete (ID)
                </label>
                <input
                  type="text"
                  value={medicalInfo.idNumber}
                  onChange={(e) => updateField("idNumber", e.target.value)}
                  placeholder="000000000LA000"
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Tipo Sanguíneo
                </label>
                <select
                  value={medicalInfo.bloodType}
                  onChange={(e) => updateField("bloodType", e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">Selecione seu tipo sanguíneo</option>
                  {bloodTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Alergias
                </label>
                <textarea
                  value={medicalInfo.allergies}
                  onChange={(e) => updateField("allergies", e.target.value)}
                  placeholder="Liste suas alergias (medicamentos, alimentos, etc.)"
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 resize-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Doenças Crônicas
                </label>
                <textarea
                  value={medicalInfo.chronicDiseases}
                  onChange={(e) => updateField("chronicDiseases", e.target.value)}
                  placeholder="Liste doenças crônicas (diabetes, hipertensão, etc.)"
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 resize-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Medicamentos em Uso
                </label>
                <textarea
                  value={medicalInfo.medications}
                  onChange={(e) => updateField("medications", e.target.value)}
                  placeholder="Liste medicamentos que você usa atualmente"
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 resize-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Phone className="w-5 h-5 text-orange-500 dark:text-orange-400" />
                Contactos de Emergência (Máx. 5)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {medicalInfo.emergencyContacts.map((contact, index) => (
                <div key={index} className="flex gap-3 items-end p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 relative group/contact">
                  <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Nome</label>
                    <input
                      type="text"
                      value={contact.name}
                      onChange={(e) => updateContact(index, "name", e.target.value)}
                      placeholder="Ex: Maria (Mãe)"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Telefone</label>
                    <input
                      type="tel"
                      value={contact.phone}
                      onChange={(e) => updateContact(index, "phone", e.target.value)}
                      placeholder="9XXXXXXXX"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeContact(index)}
                    className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 mb-1"
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Observações Adicionais
                </label>
                <textarea
                  value={medicalInfo.observations}
                  onChange={(e) => updateField("observations", e.target.value)}
                  placeholder="Outras informações importantes para emergências"
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 resize-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl"
            >
              {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              {isSaving ? "A guardar..." : "Guardar Informações"}
            </Button>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <p className="text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              Estas informações serão usadas apenas para fornecer um atendimento mais seguro e personalizado. 
              Os dados são armazenados localmente no seu dispositivo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

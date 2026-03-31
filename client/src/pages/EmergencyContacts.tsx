import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit2, ArrowLeft, Phone, User, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";

interface EmergencyContact {
  id: number;
  name: string;
  phone: string;
  relationship: string;
}

export default function EmergencyContacts() {
  const [, setLocation] = useLocation();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    relationship: ""
  });

  useEffect(() => {
    const savedContacts = localStorage.getItem("emergencyContacts");
    if (savedContacts) {
      try {
        setContacts(JSON.parse(savedContacts));
      } catch (error) {
        console.error("Error loading contacts:", error);
      }
    }
  }, []);

  const saveContacts = (newContacts: EmergencyContact[]) => {
    setContacts(newContacts);
    localStorage.setItem("emergencyContacts", JSON.stringify(newContacts));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.relationship) {
      toast({ 
        title: "Erro", 
        description: "Preencha todos os campos!", 
        variant: "destructive" 
      });
      return;
    }

    if (editingId !== null) {
      // Update existing contact
      const updated = contacts.map(c => 
        c.id === editingId 
          ? { ...c, ...formData }
          : c
      );
      saveContacts(updated);
      toast({ 
        title: "Sucesso", 
        description: "Contacto atualizado com sucesso!" 
      });
      setEditingId(null);
    } else {
      // Add new contact
      const newContact: EmergencyContact = {
        id: Date.now(),
        ...formData
      };
      saveContacts([...contacts, newContact]);
      toast({ 
        title: "Sucesso", 
        description: "Contacto adicionado com sucesso!" 
      });
    }

    setFormData({ name: "", phone: "", relationship: "" });
    setIsAdding(false);
  };

  const handleEdit = (contact: EmergencyContact) => {
    setFormData({
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship
    });
    setEditingId(contact.id);
    setIsAdding(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja remover este contacto?")) {
      const updated = contacts.filter(c => c.id !== id);
      saveContacts(updated);
      toast({ 
        title: "Sucesso", 
        description: "Contacto removido!" 
      });
    }
  };

  const cancelForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: "", phone: "", relationship: "" });
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            className="hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Contactos de Emergência
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Pessoas que serão contactadas em caso de emergência
            </p>
          </div>
        </div>

        {/* Info Card */}
        <Card className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800 p-6">
          <div className="flex items-start gap-4">
            <Heart className="w-8 h-8 text-red-600 dark:text-red-400 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-300 mb-2">
                Porquê ter contactos de emergência?
              </h3>
              <p className="text-sm text-red-800 dark:text-red-400">
                Em caso de emergência médica, estes contactos serão notificados automaticamente 
                com a sua localização atual. Mantenha-os sempre atualizados para sua segurança.
              </p>
            </div>
          </div>
        </Card>

        {/* Add/Edit Form */}
        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="border-slate-200 dark:border-slate-700">
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {editingId ? "Editar Contacto" : "Novo Contacto"}
                  </h3>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="name" className="text-slate-700 dark:text-slate-300">
                        Nome Completo
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Ex: João Silva"
                          className="pl-10 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300">
                        Telefone
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="Ex: +244 923 456 789"
                          className="pl-10 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="relationship" className="text-slate-700 dark:text-slate-300">
                      Relação
                    </Label>
                    <Input
                      id="relationship"
                      value={formData.relationship}
                      onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                      placeholder="Ex: Esposo, Irmão, Amigo, etc."
                      className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      onClick={cancelForm}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                      {editingId ? "Atualizar" : "Adicionar"}
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Contacts List */}
        <Card className="border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Seus Contactos ({contacts.length})
            </h3>
            {!isAdding && (
              <Button
                onClick={() => setIsAdding(true)}
                className="bg-red-600 hover:bg-red-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Contacto
              </Button>
            )}
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {contacts.length === 0 ? (
              <div className="p-12 text-center">
                <Heart className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                  Nenhum contacto adicionado
                </h4>
                <p className="text-slate-500 dark:text-slate-400">
                  Adicione contactos de emergência para sua segurança
                </p>
              </div>
            ) : (
              contacts.map((contact) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                      <Heart className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                        {contact.name}
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {contact.relationship} • {contact.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(contact)}
                      className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(contact.id)}
                      className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </Card>

        {/* Help Text */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
            💡 Dica importante:
          </h4>
          <p className="text-sm text-blue-800 dark:text-blue-400">
            Mantenha sempre pelo menos 2 contactos de emergência atualizados. 
            Estas pessoas receberão uma mensagem com sua localização em caso de emergência médica.
          </p>
        </div>
      </div>
    </Layout>
  );
}

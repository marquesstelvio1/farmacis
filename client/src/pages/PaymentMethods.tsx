import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, 
  Smartphone, 
  Building2, 
  Plus, 
  Trash2, 
  Star, 
  Check,
  X,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePaymentMethods } from "@/hooks/use-payment-methods";
import { useToast } from "@/hooks/use-toast";

const paymentTypeConfig = {
  multicaixa: {
    label: "Multicaixa",
    icon: CreditCard,
    color: "bg-blue-500",
    fields: ["name", "cardNumber"],
  },
  mpesa: {
    label: "M-Pesa",
    icon: Smartphone,
    color: "bg-yellow-500",
    fields: ["name", "phoneNumber"],
  },
  unitel_money: {
    label: "Unitel Money",
    icon: Smartphone,
    color: "bg-purple-500",
    fields: ["name", "phoneNumber"],
  },
  bank_transfer: {
    label: "Transferência Bancária",
    icon: Building2,
    color: "bg-green-500",
    fields: ["name", "bankName", "accountNumber"],
  },
  stripe: {
    label: "Cartão (Stripe)",
    icon: CreditCard,
    color: "bg-indigo-500",
    fields: ["name"],
  },
};

export default function PaymentMethods() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const { methods, isLoading, addMethod, deleteMethod, setDefaultMethod } = usePaymentMethods(user?.id);
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: "",
    name: "",
    phoneNumber: "",
    cardNumber: "",
    bankName: "",
    accountNumber: "",
    isDefault: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await addMethod({
      ...formData,
      userId: user.id,
      type: formData.type as any,
    });

    if (success) {
      toast({
        title: "Sucesso",
        description: "Método de pagamento adicionado",
      });
      setIsDialogOpen(false);
      setFormData({
        type: "",
        name: "",
        phoneNumber: "",
        cardNumber: "",
        bankName: "",
        accountNumber: "",
        isDefault: false,
      });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o método de pagamento",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    const success = await deleteMethod(id);
    if (success) {
      toast({
        title: "Sucesso",
        description: "Método de pagamento removido",
      });
    }
  };

  const handleSetDefault = async (id: number) => {
    const success = await setDefaultMethod(id);
    if (success) {
      toast({
        title: "Sucesso",
        description: "Método padrão atualizado",
      });
    }
  };

  const selectedType = formData.type as keyof typeof paymentTypeConfig;
  const config = selectedType ? paymentTypeConfig[selectedType] : null;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Métodos de Pagamento</h1>
              <p className="text-slate-500 mt-1">
                Gerencie seus métodos de pagamento angolanos
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-teal-500">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Adicionar Método de Pagamento</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Tipo de Pagamento</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(paymentTypeConfig).map(([key, conf]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <conf.icon className="w-4 h-4" />
                              {conf.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {config && (
                    <>
                      <div className="space-y-2">
                        <Label>Nome do Método</Label>
                        <Input
                          placeholder="Ex: Meu M-Pesa"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>

                      {config.fields.includes("phoneNumber") && (
                        <div className="space-y-2">
                          <Label>Número de Telefone</Label>
                          <Input
                            placeholder="+244 9XX XXX XXX"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                          />
                        </div>
                      )}

                      {config.fields.includes("cardNumber") && (
                        <div className="space-y-2">
                          <Label>Últimos 4 dígitos do cartão</Label>
                          <Input
                            placeholder="1234"
                            maxLength={4}
                            value={formData.cardNumber}
                            onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                          />
                        </div>
                      )}

                      {config.fields.includes("bankName") && (
                        <div className="space-y-2">
                          <Label>Nome do Banco</Label>
                          <Input
                            placeholder="Ex: BFA"
                            value={formData.bankName}
                            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                          />
                        </div>
                      )}

                      {config.fields.includes("accountNumber") && (
                        <div className="space-y-2">
                          <Label>Número da Conta</Label>
                          <Input
                            placeholder="Número da conta bancária"
                            value={formData.accountNumber}
                            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="isDefault"
                          checked={formData.isDefault}
                          onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="isDefault" className="text-sm cursor-pointer">
                          Definir como padrão
                        </Label>
                      </div>
                    </>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-teal-500"
                    disabled={!formData.type || !formData.name}
                  >
                    Salvar
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Payment Methods List */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
              <p className="text-slate-500 mt-2">Carregando...</p>
            </div>
          ) : methods.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900">Nenhum método de pagamento</h3>
                <p className="text-slate-500 mt-1">
                  Adicione um método de pagamento para facilitar suas compras
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              <AnimatePresence>
                {methods.map((method) => {
                  const typeConfig = paymentTypeConfig[method.type];
                  const Icon = typeConfig?.icon || CreditCard;

                  return (
                    <motion.div
                      key={method.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      layout
                    >
                      <Card className={`relative overflow-hidden ${method.isDefault ? 'ring-2 ring-blue-500' : ''}`}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-xl ${typeConfig?.color || 'bg-gray-500'} flex items-center justify-center text-white`}>
                                <Icon className="w-6 h-6" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-slate-900">{method.name}</h3>
                                  {method.isDefault && (
                                    <Badge className="bg-blue-100 text-blue-700">
                                      <Star className="w-3 h-3 mr-1 fill-current" />
                                      Padrão
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-slate-500">{typeConfig?.label}</p>
                                {method.phoneNumber && (
                                  <p className="text-sm text-slate-600">{method.phoneNumber}</p>
                                )}
                                {method.cardNumber && (
                                  <p className="text-sm text-slate-600">**** {method.cardNumber}</p>
                                )}
                                {method.bankName && (
                                  <p className="text-sm text-slate-600">{method.bankName}</p>
                                )}
                                {method.accountNumber && (
                                  <p className="text-sm text-slate-600">Conta: {method.accountNumber}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {!method.isDefault && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSetDefault(method.id)}
                                  title="Definir como padrão"
                                >
                                  <Star className="w-4 h-4 text-slate-400" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(method.id)}
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* Info Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-900">Pagamentos Seguros</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Seus dados de pagamento são armazenados com segurança. 
                    Os pagamentos só são processados após a farmácia aceitar seu pedido.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

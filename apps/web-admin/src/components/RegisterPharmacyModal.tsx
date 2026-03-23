import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface RegisterPharmacyModalProps {
  onClose: () => void
  onRegister: (data: any) => Promise<void>
}

export default function RegisterPharmacyModal({ onClose, onRegister }: RegisterPharmacyModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
   address: '',
    lat: '-8.8147',
    lng: '13.2306',
   description: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
   await onRegister(formData)
  }

 return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Registrar Nova Farmácia</CardTitle>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome da Farmácia</Label>
                <Input
                  id="name"
                 value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, name: e.target.value})}
                 required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                 value={formData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, email: e.target.value})}
                 required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                 value={formData.phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+244 9XX XXX XXX"
                 required
                />
              </div>
              <div>
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                 value={formData.address}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, address: e.target.value})}
                 required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lat">Latitude</Label>
                <Input
                  id="lat"
                 value={formData.lat}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, lat: e.target.value})}
                 required
                />
              </div>
              <div>
                <Label htmlFor="lng">Longitude</Label>
                <Input
                  id="lng"
                 value={formData.lng}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, lng: e.target.value})}
                 required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <textarea
                id="description"
               value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                Registrar Farmácia
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

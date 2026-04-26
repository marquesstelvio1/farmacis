import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  placeholder?: string
  className?: string
}

export default function ImageUpload({ value, onChange, placeholder = "Carregar imagem", className }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [preview, setPreview] = useState(value || '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem válido')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    const formData = new FormData()
    formData.append('image', file)

    try {
      // Create progress simulation
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch(import.meta.env.VITE_API_URL + '/api/upload/product-image', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        throw new Error('Failed to upload image')
      }

      const data = await response.json()
      const imageUrl = data.url
      
      setPreview(imageUrl)
      onChange(imageUrl)
      toast.success('Imagem carregada com sucesso!')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Erro ao carregar imagem')
    } finally {
      setIsUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  const handleRemoveImage = () => {
    setPreview('')
    onChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {preview ? (
        <div className="relative group">
          <div className="aspect-square w-full max-w-sm mx-auto rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
            <img 
              src={preview} 
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
          
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemoveImage}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div 
          className="aspect-square w-full max-w-sm mx-auto border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
          onClick={triggerFileSelect}
        >
          {isUploading ? (
            <div className="w-full p-4 text-center">
              <div className="mb-2">
                <Upload className="w-8 h-8 mx-auto animate-pulse" />
              </div>
              <p className="text-sm text-muted-foreground mb-2">Carregando...</p>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          ) : (
            <div className="text-center p-4">
              <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-muted-foreground">{placeholder}</p>
              <p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF (max. 5MB)</p>
            </div>
          )}
        </div>
      )}
      
      {preview && (
        <div className="text-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={triggerFileSelect}
            disabled={isUploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            Alterar imagem
          </Button>
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Users as UsersIcon, Mail, Calendar } from 'lucide-react'

interface User {
  id: number
  name: string
  email: string
  emailVerified: boolean
  createdAt: string
  ordersCount: number
}

export default function Users() {
  const [searchTerm, setSearchTerm] = useState('')

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/admin/users')
      if (!response.ok) throw new Error('Failed to fetch users')
      return response.json()
    },
  })

  const filteredUsers = users?.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Usuários</h1>
        <p className="text-gray-500 dark:text-slate-400">Gerencie os usuários do sistema</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500" />
        <input
          type="text"
          placeholder="Buscar usuário..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900/70 rounded-xl shadow-sm dark:shadow-none border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-800/60">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Pedidos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Cadastro
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {filteredUsers?.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-slate-100">{user.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
                      <Mail className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.emailVerified 
                        ? 'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300' 
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-300'
                    }`}>
                      {user.emailVerified ? 'Verificado' : 'Pendente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-100">
                    {user.ordersCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
                      <Calendar className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                      {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredUsers?.length === 0 && (
        <div className="text-center py-12">
          <UsersIcon className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100">Nenhum usuário encontrado</h3>
          <p className="text-gray-500 dark:text-slate-400">Tente ajustar a busca</p>
        </div>
      )}
    </div>
  )
}

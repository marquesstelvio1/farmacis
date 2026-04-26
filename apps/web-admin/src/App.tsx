import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Pharmacies from './pages/Pharmacies'
import PharmacyDetails from './pages/PharmacyDetails'
import Orders from './pages/Orders'
import Users from './pages/Users'
import AdminUsers from './pages/AdminUsers'
import Balance from './pages/Balance'
import Settings from './pages/Settings'

function App() {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <Login />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pharmacies" element={<Pharmacies />} />
        <Route path="/pharmacies/:id" element={<PharmacyDetails />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/users" element={<Users />} />
        <Route path="/admin-users" element={<AdminUsers />} />
        <Route path="/balance" element={<Balance />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  )
}

export default App

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import MainLayout from '../components/layout/MainLayout'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import DashboardPage from '../pages/dashboard/DashboardPage'
import CertificatesPage from '../pages/certificates/CertificatesPage'
import CertificateDetailPage from '../pages/certificates/CertificateDetailPage'
import GenerateCertificatePage from '../pages/certificates/GenerateCertificatePage'
import BulkGeneratePage from '../pages/certificates/BulkGeneratePage'
import ProgramsPage from '../pages/programs/ProgramsPage'
import TemplatesPage from '../pages/templates/TemplatesPage'
import UsersPage from '../pages/users/UsersPage'

const Dashboard = DashboardPage

function PrivateRoute({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" replace />
}

function RoleRoute({ children, minRole }) {
  const { isAtLeast } = useAuth()
  return isAtLeast(minRole) ? children : <Navigate to="/dashboard" replace />
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected — all share the sidebar layout */}
        <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/certificates" element={<CertificatesPage />} />
          <Route path="/certificates/:id" element={<CertificateDetailPage />} />

          <Route path="/certificates/generate" element={
            <RoleRoute minRole="User"><GenerateCertificatePage /></RoleRoute>
          } />
          <Route path="/certificates/bulk" element={
            <RoleRoute minRole="User"><BulkGeneratePage /></RoleRoute>
          } />

          <Route path="/programs" element={
            <RoleRoute minRole="Admin"><ProgramsPage /></RoleRoute>
          } />
          <Route path="/templates" element={
            <RoleRoute minRole="Admin"><TemplatesPage /></RoleRoute>
          } />
          <Route path="/users" element={
            <RoleRoute minRole="SuperAdmin"><UsersPage /></RoleRoute>
          } />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

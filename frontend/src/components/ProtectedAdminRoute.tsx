import { Navigate, useLocation } from 'react-router-dom'
import { theme } from 'antd'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { token } = theme.useToken()
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: token.colorBgLayout,
        }}
      >
        <div style={{ textAlign: 'center', color: token.colorTextSecondary }}>Loading...</div>
      </div>
    )
  }

  if (!user?.is_admin) {
    return <Navigate to="/files" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}

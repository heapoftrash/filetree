import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import FileManager from './components/FileManager'
import Login from './components/Login'
import ProtectedRoute from './components/ProtectedRoute'
import ProtectedAdminRoute from './components/ProtectedAdminRoute'
import { AuthProvider } from './contexts/AuthContext'

const Settings = lazy(() => import('./components/Settings'))

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/files" replace />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/files/*"
            element={
              <ProtectedRoute>
                <FileManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <ProtectedAdminRoute>
                  <Suspense fallback={<Spin style={{ padding: 24 }} />}>
                    <Settings />
                  </Suspense>
                </ProtectedAdminRoute>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

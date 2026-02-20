import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import Login from "./components/Login"
import AdminDashboard from "./components/AdminDashboard"
import ClientDashboard from "./components/ClientDashboard"
import ProtectedRoute from "./components/ProtectedRoute"
import CreateAccount from "./components/CreateAccount"
import Notification from "./components/Pages/NotificationsPage"
import Notifications from "./components/Pages/NotificationsPage"
import PertesAdmin from "./components/Modal/PerteAdmin"
import AdminHistoriquePage from "./components/AdminHistoriquePage"

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/create-account" element={<CreateAccount />} />
            <Route
              path="/admin/historique"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminHistoriquePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/pertes"
              element={
                <ProtectedRoute requiredRole="admin">
                  <PertesAdmin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client"
              element={
                <ProtectedRoute requiredRole={["resto", "snack", "detente"]}>
                  <ClientDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute requiredRole={["resto", "snack", "detente", "admin"]}>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/articles/:id"
              element={
                <ProtectedRoute requiredRole={["resto", "snack", "detente", "admin"]}>
                  <Notification />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App

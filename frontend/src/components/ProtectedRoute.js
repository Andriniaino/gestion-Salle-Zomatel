"use client"
import { Navigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user, loading } = useAuth()

  // Au refresh, on attend la vérification /me avant de décider de rediriger.
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole) {
    const userRole = String(user.categorie || "").toLowerCase()

    if (Array.isArray(requiredRole)) {
      const allowedRoles = requiredRole.map((r) => String(r).toLowerCase())
      if (!allowedRoles.includes(userRole)) {
        return <Navigate to="/login" replace />
      }
    } else {
      const required = String(requiredRole).toLowerCase()
      if (userRole !== required) {
        return <Navigate to="/login" replace />
      }
    }
  }

  return children
}

export default ProtectedRoute

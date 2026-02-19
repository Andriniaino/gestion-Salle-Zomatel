"use client"
import { Navigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole) {
    if (Array.isArray(requiredRole)) {
      if (!requiredRole.includes(user.categorie)) {
        return <Navigate to="/login" replace />
      }
    } else {
      if (user.categorie !== requiredRole) {
        return <Navigate to="/login" replace />
      }
    }
  }

  return children
}

export default ProtectedRoute

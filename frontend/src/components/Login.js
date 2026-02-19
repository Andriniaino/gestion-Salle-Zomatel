"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import loginBg from "../images/noire.jpg"
import Footer from "../components/Footer"

const Login = () => {
  const [formData, setFormData] = useState({
    mail: "",
    password: "",
    categorie: "admin"
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})

  const { login, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirige automatiquement après connexion
      if (user.categorie === "admin") {
        navigate("/admin");
      } else if (["resto", "snack", "detente"].includes(user.categorie)) {
        navigate("/client");
      } else {
        navigate("/login"); // fallback
      }
    }
  }, [isAuthenticated, user, navigate]);
  
  
  

  // Validation côté client
  const validateForm = () => {
    const errors = {}

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.mail.trim()) {
      errors.mail = "L'email est requis"
    } else if (!emailRegex.test(formData.mail)) {
      errors.mail = "Format d'email invalide"
    }

    // Validation du mot de passe
    if (!formData.password.trim()) {
      errors.password = "Le mot de passe est requis"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Effacer l'erreur de validation pour ce champ
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: "" }))
    }
    setError("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation côté client
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError("")

    try {
      const result = await login(formData)
      if (!result.success) {
        // Messages d'erreur spécifiques selon les règles
        if (result.message === "Mot de passe incorrect") {
          setError("Mot de passe incorrect. Veuillez réessayer le mot de passe corect.")
        } else if (result.message === "Identifiants invalides") {
          setError("L'email n'existe pas.Veuillez contacter le responsable. ")
        } else {
          setError(result.message || "Une erreur est survenue")
        }
      }
    } catch (error) {
      console.error("Erreur lors de la connexion:", error)
      setError("Erreur de connexion. Veuillez réessayer.")
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = () => setShowPassword(!showPassword)

  return (
    <div
      className="d-flex flex-column min-vh-100"
      style={{
        backgroundImage: `url(${loginBg})`, backgroundSize: "cover",
        backgroundPosition: "center", backgroundRepeat: "no-repeat",
      }}>
      {/* Overlay sombre */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0,0,0,0.5)",
          zIndex: 1,
        }}
      ></div>

      {/* Contenu principal */}
      <div
        className="d-flex flex-column justify-content-center align-items-center flex-grow-1"
        style={{ position: "relative", zIndex: 2, padding: "20px" }}>
        <div className="text-center mb-4">
          <h2 style={{ color: "#ffffff" }}> Bienvenue dans le Gestion de Salle Zomatel Hotel</h2>
          <p style={{ color: "#ffffff" }}>Connectez-vous à votre compte</p>
        </div>


        <div className="card shadow" style={{ backgroundColor: "rgba(255, 255, 255, 0.1)", minWidth: "300px", maxWidth: "400px", width: "100%" }}>
          <div className="card-body p-4">
            {error && (
              <div className="alert alert-danger" role="alert" style={{
                backgroundColor: 'rgba(220, 53, 69, 0.9)',
                borderColor: '#dc3545',
                color: 'white'
              }}>
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-3">
                <label htmlFor="mail" className="form-label text-white">
                  Email
                  <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  className={`form-control ${validationErrors.mail ? 'is-invalid' : ''}`}
                  id="mail"
                  name="mail"
                  value={formData.mail}
                  onChange={handleChange}
                  required
                  placeholder="votre@email.com"
                  disabled={loading}
                  autoComplete="email"
                />
                {validationErrors.mail && (
                  <div className="invalid-feedback" style={{
                    color: '#ff6b6b',
                    fontWeight: '500'
                  }}>
                    <i className="bi bi-x-circle me-1"></i>
                    {validationErrors.mail}
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="password" className="form-label text-white">
                  Mot de passe
                  <span className="text-danger">*</span>
                </label>
                <div className="d-flex">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`form-control ${validationErrors.password ? 'is-invalid' : ''}`}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Votre mot de passe"
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="btn btn-outline-light ms-2"
                    onClick={togglePasswordVisibility}
                    disabled={loading}
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    style={{ borderColor: 'rgba(255, 255, 255, 0.5)' }}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
                {validationErrors.password && (
                  <div className="invalid-feedback d-block" style={{
                    color: '#ff6b6b',
                    fontWeight: '500'
                  }}>
                    <i className="bi bi-x-circle me-1"></i>
                    {validationErrors.password}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={loading}
                style={{
                  backgroundColor: loading ? '#6c757d' : '#0d6efd',
                  borderColor: loading ? '#6c757d' : '#0d6efd'
                }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Connexion...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Se connecter
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Login
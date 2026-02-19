import React, { useState } from "react"
import api from "../services/api"
import { useNavigate } from "react-router-dom"

export default function CreateAccount({ show, onClose }) {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    nom: "",
    prenoms: "",
    mail: "",
    password: "",
    confirmPassword: "",
    categorie: "resto",
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      alert("⚠️ Les mots de passe ne correspondent pas !")
      return
    }

    try {
      await api.post("/auth/register", formData)
      alert("✅ Compte créé avec succès !")
      navigate("/login")
      onClose() // fermer la modale après succès
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || "❌ Erreur lors de la création du compte")
    }
  }

  if (!show) return null // si la modale n’est pas affichée

  return (
    <div
      className="modal show fade d-block"
      tabIndex="-1"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.16)",
      }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content shadow-lg border-0">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Créer un nouveau compte</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Nom</label>
                  <input
                    type="text"
                    name="nom"
                    className="form-control"
                    value={formData.nom}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Prénoms</label>
                  <input
                    type="text"
                    name="prenoms"
                    className="form-control"
                    value={formData.prenoms}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label>Email</label>
                <input
                  type="email"
                  name="mail"
                  className="form-control"
                  value={formData.mail}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label>Mot de passe</label>
                  <div className="input-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      className="form-control"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <div className="col-md-6 mb-3">
                  <label>Confirmer le mot de passe</label>
                  <div className="input-group">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      className="form-control"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label>Catégorie</label>
                <select
                  name="categorie"
                  className="form-select"
                  value={formData.categorie}
                  onChange={handleChange}
                  required
                >
                  <option value="resto">Resto</option>
                  <option value="snack">Snack</option>
                  <option value="detente">Détente</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Annuler
              </button>
              <button type="submit" className="btn btn-primary">
                Créer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

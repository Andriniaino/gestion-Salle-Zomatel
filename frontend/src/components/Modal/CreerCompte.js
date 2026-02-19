// frontend/src/components/Modal/CreerCompte.jsx

import React, { useState } from "react";
import { createUser } from "../../services/userService";
import { FaEye, FaEyeSlash, FaUserPlus, FaTimes, FaCheck } from "react-icons/fa";

// ─── Valeur initiale ──────────────────────────────────────────────────────────
const EMPTY_FORM = {
  nom: "",
  prenoms: "",
  email: "",           // ← "email" (pas "mail") pour correspondre au backend
  password: "",
  confirmPassword: "",
  categorie: "",
};

// ─── Notification inline ──────────────────────────────────────────────────────
const Notification = ({ type, message, onClose }) => {
  if (!message) return null;
  const cfg = {
    success: { bg: "#d4edda", border: "#28a745", color: "#155724", icon: "✅" },
    error:   { bg: "#f8d7da", border: "#dc3545", color: "#721c24", icon: "❌" },
  };
  const s = cfg[type] || cfg.error;
  return (
    <div style={{
      backgroundColor: s.bg, border: `1px solid ${s.border}`,
      color: s.color, borderRadius: 6, padding: "12px 16px",
      marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 10,
    }}>
      <span style={{ fontSize: 18, marginTop: 1 }}>{s.icon}</span>
      <span style={{ flex: 1, fontWeight: 500 }}>{message}</span>
      <button type="button" onClick={onClose}
        style={{ background: "none", border: "none", cursor: "pointer", color: s.color, fontSize: 16, padding: 0 }}>
        <FaTimes />
      </button>
    </div>
  );
};

// ─── Composant principal ──────────────────────────────────────────────────────
const CreerCompte = ({ showUserModal, setShowUserModal, onUserCreated }) => {
  const [formData,            setFormData]            = useState(EMPTY_FORM);
  const [showPassword,        setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors,              setErrors]              = useState({});
  const [loading,             setLoading]             = useState(false);
  const [notif,               setNotif]               = useState(null);

  if (!showUserModal) return null;

  // ── Fermeture propre ─────────────────────────────────────────────────────────
  const handleClose = () => {
    setFormData(EMPTY_FORM);
    setErrors({});
    setLoading(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setNotif(null);
    setShowUserModal(false);
  };

  // ── Changement de champ ──────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));

    // Validation live confirmation mot de passe
    if (name === "confirmPassword" || name === "password") {
      const pwd     = name === "password"        ? value : formData.password;
      const confirm = name === "confirmPassword" ? value : formData.confirmPassword;
      if (confirm && pwd !== confirm) {
        setErrors((prev) => ({ ...prev, confirmPassword: "Les mots de passe ne correspondent pas" }));
      } else {
        setErrors((prev) => ({ ...prev, confirmPassword: "" }));
      }
    }
  };

  // ── Validation frontend ──────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!formData.nom.trim())      e.nom      = "Le nom est requis";
    if (!formData.prenoms.trim())  e.prenoms  = "Les prénoms sont requis";
    if (!formData.email.trim())    e.email    = "L'email est requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
                                   e.email    = "Format email invalide";
    if (!formData.password)        e.password = "Le mot de passe est requis";
    else if (formData.password.length < 6)
                                   e.password = "Minimum 6 caractères";
    if (!formData.confirmPassword) e.confirmPassword = "Veuillez confirmer le mot de passe";
    else if (formData.password !== formData.confirmPassword)
                                   e.confirmPassword = "Les mots de passe ne correspondent pas";
    if (!formData.categorie)       e.categorie = "Veuillez sélectionner une catégorie";
    return e;
  };

  // ── Soumission ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setNotif(null);

    // 1. Validation locale
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      // 2. Payload — noms de champs identiques à ce qu'attend Laravel
      const payload = {
        nom:             formData.nom.trim(),
        prenoms:         formData.prenoms.trim(),
        email:           formData.email.trim(),   // ← "email" comme dans le controller
        password:        formData.password,
        confirmPassword: formData.confirmPassword, // ← envoyé pour la règle same:password
        categorie:       formData.categorie,
      };

      const result = await createUser(payload);

      if (result.success) {
        // ✅ Succès
        setNotif({ type: "success", message: result.message || "Compte créé avec succès !" });
        setTimeout(() => {
          if (typeof onUserCreated === "function") onUserCreated();
          handleClose();
        }, 1800);
      } else {
        // ❌ Erreur retournée par le service (422 ou autre)
        // result.errors = objet Laravel { "email": ["..."], "nom": ["..."] }
        if (result.errors) {
          // Mapper les erreurs Laravel vers les champs du formulaire
          const mapped = {};
          Object.entries(result.errors).forEach(([field, messages]) => {
            mapped[field] = Array.isArray(messages) ? messages[0] : messages;
          });
          setErrors(mapped);
          setNotif({
            type: "error",
            message: "Veuillez corriger les erreurs dans le formulaire.",
          });
        } else {
          setNotif({
            type: "error",
            message: result.message || "Erreur lors de la création du compte",
          });
        }
        setLoading(false);
      }
    } catch (err) {
      setNotif({ type: "error", message: err.message || "Erreur réseau, veuillez réessayer" });
      setLoading(false);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const inputClass = (field) =>
    `form-control${errors[field] ? " is-invalid" : ""}`;

  const pwdMatch =
    formData.password &&
    formData.confirmPassword &&
    formData.password === formData.confirmPassword;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1055 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow-lg">

          {/* HEADER */}
          <div className="modal-header text-white" style={{ backgroundColor: "#800020" }}>
            <h5 className="modal-title d-flex align-items-center gap-2">
              <FaUserPlus /> Créer un compte
            </h5>
            <button type="button" className="btn-close btn-close-white"
              onClick={handleClose} disabled={loading} />
          </div>

          {/* FORM — englobe body + footer pour que type="submit" fonctionne */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-body p-4">

              {/* Message succès / erreur */}
              <Notification
                type={notif?.type}
                message={notif?.message}
                onClose={() => setNotif(null)}
              />

              {/* Nom */}
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Nom <span className="text-danger">*</span>
                </label>
                <input type="text" name="nom" className={inputClass("nom")}
                  value={formData.nom} onChange={handleChange}
                  placeholder="Saisir votre nom" disabled={loading} />
                {errors.nom && <div className="invalid-feedback">{errors.nom}</div>}
              </div>

              {/* Prénoms */}
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Prénoms <span className="text-danger">*</span>
                </label>
                <input type="text" name="prenoms" className={inputClass("prenoms")}
                  value={formData.prenoms} onChange={handleChange}
                  placeholder="Saisir votre preoms" disabled={loading} />
                {errors.prenoms && <div className="invalid-feedback">{errors.prenoms}</div>}
              </div>

              {/* Email */}
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Email <span className="text-danger">*</span>
                </label>
                <input type="email" name="email" className={inputClass("email")}
                  value={formData.email} onChange={handleChange}
                  placeholder="exemple@zomatel.mg" disabled={loading} />
                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
              </div>

              {/* Mot de passe */}
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Mot de passe <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    className={inputClass("password")}
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    placeholder="Minimum 6 caractères"
                    disabled={loading}
                  />
                  <button type="button" className="btn btn-outline-secondary"
                    tabIndex={-1} onClick={() => setShowPassword((s) => !s)} disabled={loading}>
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.password && (
                  <div className="invalid-feedback d-block">{errors.password}</div>
                )}
              </div>

              {/* Confirmation mot de passe */}
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Confirmer le mot de passe <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    className={`form-control${
                      errors.confirmPassword ? " is-invalid" : pwdMatch ? " is-valid" : ""
                    }`}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                    placeholder="Répétez le mot de passe"
                    disabled={loading}
                  />
                  <button type="button" className="btn btn-outline-secondary"
                    tabIndex={-1} onClick={() => setShowConfirmPassword((s) => !s)} disabled={loading}>
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <div className="invalid-feedback d-block">{errors.confirmPassword}</div>
                )}
                {pwdMatch && (
                  <div className="valid-feedback d-block">Les mots de passe correspondent ✓</div>
                )}
              </div>

              {/* Catégorie */}
              <div className="mb-1">
                <label className="form-label fw-semibold">
                  Catégorie <span className="text-danger">*</span>
                </label>
                <select name="categorie"
                  className={`form-select${errors.categorie ? " is-invalid" : ""}`}
                  value={formData.categorie} onChange={handleChange} disabled={loading}>
                  <option value="">— Sélectionner —</option>
                  <option value="Resto">Resto</option>
                  <option value="snack">Snack</option>
                  <option value="detente">Détente</option>
                  <option value="admin">Admin</option>
                </select>
                {errors.categorie && (
                  <div className="invalid-feedback">{errors.categorie}</div>
                )}
              </div>
            </div>

            {/* FOOTER */}
            <div className="modal-footer bg-light">
              <button type="button" className="btn btn-secondary"
                onClick={handleClose} disabled={loading}>
                <FaTimes className="me-1" /> Annuler
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <><span className="spinner-border spinner-border-sm me-1" role="status" />Création en cours…</>
                ) : (
                  <><FaCheck className="me-1" /> Créer</>
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default CreerCompte;
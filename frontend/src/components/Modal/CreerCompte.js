// frontend/src/components/Modal/CreerCompte.jsx

import React, { useState } from "react";
import { createUser, uploadUserAvatar } from "../../services/userService";
import { FaEye, FaEyeSlash, FaUserPlus, FaTimes, FaCheck, FaUserCircle } from "react-icons/fa";

// ─── Valeur initiale ──────────────────────────────────────────────────────────
const EMPTY_FORM = {
  nom: "",
  prenoms: "",
  email: "",
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

  // ✅ States pour l'image
  const [avatarFile,    setAvatarFile]    = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  if (!showUserModal) return null;

  // ── Fermeture propre ─────────────────────────────────────────────────────────
  const handleClose = () => {
    setFormData(EMPTY_FORM);
    setErrors({});
    setLoading(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setNotif(null);
    setAvatarFile(null);    // ✅ reset image
    setAvatarPreview(null); // ✅ reset preview
    setShowUserModal(false);
  };

  // ── Gestion de l'image ───────────────────────────────────────────────────────
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setNotif({ type: "error", message: "Veuillez sélectionner une image (JPG, PNG, GIF, WebP)" });
      e.target.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setNotif({ type: "error", message: "L'image ne doit pas dépasser 2 Mo" });
      e.target.value = "";
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleRemoveImage = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  // ── Changement de champ ──────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));

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
  
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
  
    setLoading(true);
  
    try {
      // ✅ Utiliser FormData pour envoyer texte + image ensemble
      const formPayload = new FormData();
      formPayload.append("nom",       formData.nom.trim());
      formPayload.append("prenoms",   formData.prenoms.trim());
      formPayload.append("email",     formData.email.trim());
      formPayload.append("password",  formData.password);
      formPayload.append("categorie", formData.categorie);
  
      // ✅ Ajouter l'image seulement si elle existe
      if (avatarFile) {
        formPayload.append("image", avatarFile);
      }
  
      const result = await createUser(formPayload); // ← FormData directement
  
      if (result.success) {
        setNotif({
          type: "success",
          message: result.message || "Compte créé avec succès !",
        });
        setTimeout(() => {
          if (typeof onUserCreated === "function") onUserCreated();
          handleClose();
        }, 1800);
      } else {
        if (result.errors) {
          const mapped = {};
          Object.entries(result.errors).forEach(([field, messages]) => {
            mapped[field] = Array.isArray(messages) ? messages[0] : messages;
          });
          setErrors(mapped);
          const errorMessages = Object.values(mapped).join(" • ");
          setNotif({ type: "error", message: errorMessages });
        } else {
          setNotif({ type: "error", message: result.message || "Erreur lors de la création" });
        }
        setLoading(false);
      }
  
    } catch (err) {
      setNotif({ type: "error", message: err.message || "Erreur réseau" });
      setLoading(false);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const inputClass = (field) => `form-control${errors[field] ? " is-invalid" : ""}`;

  const pwdMatch =
    formData.password &&
    formData.confirmPassword &&
    formData.password === formData.confirmPassword;

  // Initiales pour l'aperçu avatar
  const initiales =
    formData.prenoms || formData.nom
      ? `${(formData.prenoms || "").charAt(0)}${(formData.nom || "").charAt(0)}`.toUpperCase()
      : null;

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

          {/* FORM */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-body p-4">

              {/* Notification */}
              <Notification
                type={notif?.type}
                message={notif?.message}
                onClose={() => setNotif(null)}
              />

              {/* ✅ PHOTO DE PROFIL — en haut avant le champ Nom */}
              <div className="mb-4">
                <label className="form-label fw-semibold">
                  Photo de profil <span className="text-muted fw-normal">(optionnel)</span>
                </label>
                <div className="d-flex align-items-center gap-3">

                  {/* Aperçu circulaire */}
                  <div style={{
                    width: 72, height: 72, borderRadius: "50%", flexShrink: 0,
                    backgroundColor: "#e9ecef", overflow: "hidden",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    backgroundImage: avatarPreview ? `url(${avatarPreview})` : "none",
                    backgroundSize: "cover", backgroundPosition: "center",
                    border: "2px solid #dee2e6",
                    fontSize: 22, fontWeight: 700, color: "#6c757d",
                  }}>
                    {!avatarPreview && (
                      initiales
                        ? initiales
                        : <FaUserCircle style={{ fontSize: 36, color: "#adb5bd" }} />
                    )}
                  </div>

                  {/* Bouton browse + infos */}
                  <div className="d-flex flex-column gap-2">
                    <label
                      className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 mb-0"
                      style={{ cursor: loading ? "not-allowed" : "pointer", width: "fit-content" }}
                    >
                      <FaUserCircle /> Parcourir…
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="d-none"
                        disabled={loading}
                        onChange={handleImageChange}
                      />
                    </label>

                    <small className="text-muted">JPG, PNG, GIF, WebP — max 2 Mo</small>

                    {/* Bouton supprimer l'image si sélectionnée */}
                    {avatarPreview && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                        style={{ width: "fit-content", fontSize: 12 }}
                        onClick={handleRemoveImage}
                        disabled={loading}
                      >
                        <FaTimes /> Supprimer la photo
                      </button>
                    )}
                  </div>
                </div>
              </div>

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
                  placeholder="Saisir vos prénoms" disabled={loading} />
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
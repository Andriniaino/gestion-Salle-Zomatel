// frontend/src/components/Modal/ManageUsersModal.jsx

import React, { useState, useEffect } from 'react';
import { getUsers, updateUser, deleteUser, createUser, uploadUserAvatar, getUserImageUrl } from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import {
  FaUsers, FaUserPlus, FaPencilAlt, FaTrashAlt,
  FaKey, FaUnlock, FaTimes, FaCheck, FaEye, FaEyeSlash,
  FaExclamationTriangle, FaUserCircle, FaEnvelope,
  FaTag, FaSave, FaEdit
} from 'react-icons/fa';

// ─── Constantes ───────────────────────────────────────────────────────────────
const EMPTY_FORM = { nom: '', prenoms: '', email: '', categorie: '' };
const EMPTY_PWD = { oldPassword: '', newPassword: '', confirmPassword: '' };
const EMPTY_FORGOT = { newPassword: '', confirmPassword: '' };
const EMPTY_CREATE = { nom: '', prenoms: '', email: '', password: '', confirmPassword: '', categorie: '' };

// ─── Notification inline ──────────────────────────────────────────────────────
const Notif = ({ type, message, onClose }) => {
  if (!message) return null;
  const cfg = {
    success: { bg: '#d4edda', border: '#28a745', color: '#155724', icon: '✅' },
    error: { bg: '#f8d7da', border: '#dc3545', color: '#721c24', icon: '❌' },
  };
  const s = cfg[type] || cfg.error;
  return (
    <div style={{
      backgroundColor: s.bg, border: `1px solid ${s.border}`, color: s.color,
      borderRadius: 6, padding: '10px 14px', marginBottom: 14,
      display: 'flex', alignItems: 'flex-start', gap: 10,
    }}>
      <span style={{ fontSize: 16, marginTop: 2 }}>{s.icon}</span>
      <span style={{ flex: 1, fontWeight: 500, fontSize: 14 }}>{message}</span>
      <button type="button" onClick={onClose}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: s.color, fontSize: 15, padding: 0 }}>
        <FaTimes />
      </button>
    </div>
  );
};

// ─── Champ mot de passe avec toggle ──────────────────────────────────────────
const PwdInput = ({ label, value, onChange, name, error, success }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="mb-3">
      <label className="form-label fw-semibold" style={{ fontSize: 14 }}>{label}</label>
      <div className="input-group">
        <input
          type={show ? 'text' : 'password'}
          className={`form-control${error ? ' is-invalid' : success ? ' is-valid' : ''}`}
          name={name} value={value} autoComplete="new-password"
          onChange={(e) => onChange(e.target.value)}
        />
        <button type="button" className="btn btn-outline-secondary" tabIndex={-1}
          onClick={() => setShow(s => !s)}>
          {show ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
      {error && <div className="invalid-feedback d-block" style={{ fontSize: 12 }}>{error}</div>}
      {success && <div className="valid-feedback d-block" style={{ fontSize: 12 }}>{success}</div>}
    </div>
  );
};

// ─── Modale confirmation suppression ─────────────────────────────────────────
const DeleteConfirmModal = ({ user, onConfirm, onCancel, loading }) => {
  if (!user) return null;
  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1070 }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 420 }}>
        <div className="modal-content shadow-lg border-0">
          <div className="modal-header border-0 pb-0">
            <div className="w-100 text-center pt-3">
              <div style={{
                width: 64, height: 64, borderRadius: '50%', backgroundColor: '#fff3cd',
                margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FaExclamationTriangle style={{ fontSize: 28, color: '#dc3545' }} />
              </div>
              <h5 className="fw-bold text-danger mb-0">Confirmer la suppression</h5>
            </div>
          </div>
          <div className="modal-body text-center px-4 py-3">
            <p className="text-muted mb-1">Vous êtes sur le point de supprimer :</p>
            <p className="fw-bold fs-6 mb-1">{user.prenoms} {user.nom}</p>
            <p className="text-muted small mb-3">{user.email}</p>
            <div className="alert alert-danger py-2 px-3 text-start small mb-0">
              <strong>⚠ Attention :</strong> Cette action est <strong>irréversible</strong>.
            </div>
          </div>
          <div className="modal-footer border-0 justify-content-center gap-3 pt-0 pb-4">
            <button type="button" className="btn btn-outline-secondary px-4"
              onClick={onCancel} disabled={loading}>
              <FaTimes className="me-1" />Annuler
            </button>
            <button type="button" className="btn btn-danger px-4"
              onClick={onConfirm} disabled={loading}>
              {loading
                ? <><span className="spinner-border spinner-border-sm me-1" />Suppression…</>
                : <><FaTrashAlt className="me-1" />Supprimer</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Badge catégorie ──────────────────────────────────────────────────────────
const badgeClass = (cat) => {
  const m = {
    admin: 'bg-danger',
    manager: 'bg-warning text-dark',
    Resto: 'bg-info text-dark',
    snack: 'bg-primary',
    detente: 'bg-success',
  };
  return `badge ${m[cat] || 'bg-secondary'}`;
};

const pwdMatch = (a, b) => a && b && a === b;

// ─────────────────────────────────────────────────────────────────────────────
// PANNEAU MON PROFIL
// ─────────────────────────────────────────────────────────────────────────────
const MonProfilPanel = ({ user, onClose, onSaved }) => {
  const { refreshUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ nom: user.nom || '', prenoms: user.prenoms || '', email: user.email || '' });
  const [errors, setErrors] = useState({});
  const [notif, setNotif] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageUrl = getUserImageUrl(user);

  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwdData, setPwdData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdErrors, setPwdErrors] = useState({});
  const [pwdLoading, setPwdLoading] = useState(false);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotData, setForgotData] = useState({ newPassword: '', confirmPassword: '' });
  const [forgotErrors, setForgotErrors] = useState({});
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const validateInfo = () => {
    const e = {};
    if (!formData.nom.trim()) e.nom = 'Le nom est requis';
    if (!formData.prenoms.trim()) e.prenoms = 'Les prénoms sont requis';
    if (!formData.email.trim()) e.email = "L'email est requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Email invalide';
    return e;
  };

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    const errs = validateInfo();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const r = await updateUser(user.id, { nom: formData.nom.trim(), prenoms: formData.prenoms.trim(), email: formData.email.trim() });
      if (r.success) {
        setNotif({ type: 'success', message: r.message || 'Profil mis à jour avec succès !' });
        setEditMode(false);
        if (typeof onSaved === 'function') onSaved();
      } else {
        if (r.errors) {
          const mapped = {};
          Object.entries(r.errors).forEach(([k, v]) => { mapped[k] = Array.isArray(v) ? v[0] : v; });
          setErrors(mapped);
        }
        setNotif({ type: 'error', message: r.message || 'Erreur de mise à jour' });
      }
    } catch (err) {
      setNotif({ type: 'error', message: err.message || 'Erreur réseau' });
    } finally { setSaving(false); }
  };

  const handleCancelEdit = () => {
    setFormData({ nom: user.nom || '', prenoms: user.prenoms || '', email: user.email || '' });
    setErrors({});
    setEditMode(false);
  };

  const validatePwd = () => {
    const e = {};
    if (!pwdData.oldPassword) e.oldPassword = 'Ancien mot de passe requis';
    if (!pwdData.newPassword) e.newPassword = 'Nouveau mot de passe requis';
    else if (pwdData.newPassword.length < 6) e.newPassword = 'Minimum 6 caractères';
    if (pwdData.newPassword !== pwdData.confirmPassword) e.confirmPassword = 'Les mots de passe ne correspondent pas';
    return e;
  };

  const handleSavePwd = async (e) => {
    e.preventDefault();
    const errs = validatePwd();
    if (Object.keys(errs).length) { setPwdErrors(errs); return; }
    setPwdLoading(true);
    try {
      const r = await updateUser(user.id, { oldPassword: pwdData.oldPassword, password: pwdData.newPassword });
      if (r.success) {
        setNotif({ type: 'success', message: r.message || 'Mot de passe modifié avec succès !' });
        setPwdOpen(false); setPwdData({ oldPassword: '', newPassword: '', confirmPassword: '' }); setPwdErrors({});
      } else {
        setNotif({ type: 'error', message: r.error || 'Erreur de changement de mot de passe' });
      }
    } catch (err) { setNotif({ type: 'error', message: err.message || 'Erreur réseau' }); }
    finally { setPwdLoading(false); }
  };

  const validateForgot = () => {
    const e = {};
    if (!forgotData.newPassword) e.newPassword = 'Nouveau mot de passe requis';
    else if (forgotData.newPassword.length < 6) e.newPassword = 'Minimum 6 caractères';
    if (forgotData.newPassword !== forgotData.confirmPassword) e.confirmPassword = 'Les mots de passe ne correspondent pas';
    return e;
  };

  const handleSaveForgot = async (e) => {
    e.preventDefault();
    const errs = validateForgot();
    if (Object.keys(errs).length) { setForgotErrors(errs); return; }
    setForgotLoading(true);
    try {
      const r = await updateUser(user.id, { password: forgotData.newPassword });
      if (r.success) {
        setNotif({ type: 'success', message: r.message || 'Mot de passe réinitialisé avec succès !' });
        setForgotOpen(false); setForgotData({ newPassword: '', confirmPassword: '' }); setForgotErrors({});
      } else {
        setNotif({ type: 'error', message: r.error || 'Erreur' });
      }
    } catch (err) { setNotif({ type: 'error', message: err.message || 'Erreur réseau' }); }
    finally { setForgotLoading(false); }
  };

  const initiales = `${(user.prenoms || '').charAt(0)}${(user.nom || '').charAt(0)}`.toUpperCase();

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      setNotif({ type: 'error', message: 'Veuillez sélectionner une image (JPG, PNG, GIF, WebP)' });
      return;
    }
    {/*if (file.size > 2 * 1024 * 1024) {
      setNotif({ type: 'error', message: "L'image ne doit pas dépasser 2 Mo" });
      return;
    }*/}
    setUploadingImage(true);
    setNotif(null);
    try {
      const r = await uploadUserAvatar(user.id, file);
      if (r.success) {
        await refreshUser();
        setNotif({ type: 'success', message: r.message || 'Photo mise à jour !' });
        if (typeof onSaved === 'function') onSaved();
      } else {
        setNotif({ type: 'error', message: r.error || "Erreur lors de l'upload" });
      }
    } catch (err) {
      setNotif({ type: 'error', message: err.message || 'Erreur réseau' });
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <>
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
        <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 560 }}>
          <div className="modal-content shadow-lg border-0">

            <div className="modal-header text-white border-0" style={{ backgroundColor: '#800020' }}>
              <h5 className="modal-title d-flex align-items-center gap-2">
                <FaUserCircle /> Mon Profil
              </h5>
              <button className="btn-close btn-close-white" onClick={onClose} />
            </div>

            <div className="modal-body p-0">
              <div className="text-center py-4"
                style={{ background: 'linear-gradient(135deg, #800020 0%, #b0003a 100%)' }}>
                <label className="d-inline-block position-relative" style={{ cursor: uploadingImage ? 'wait' : 'pointer' }}>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="d-none"
                    onChange={handleImageChange}
                    disabled={uploadingImage}
                  />
                  <div style={{
                    width: 100, height: 100, borderRadius: '50%',
                    border: '3px solid rgba(255,255,255,0.6)', margin: '0 auto 10px',
                    overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 32, fontWeight: 700, color: '#fff', letterSpacing: 2,
                    backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
                    backgroundSize: 'cover', backgroundPosition: 'center',
                  }}>
                    {!imageUrl && initiales}
                  </div>
                  {uploadingImage && (
                    <div style={{
                      position: 'absolute', inset: 0, borderRadius: '50%',
                      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span className="spinner-border text-white" />
                    </div>
                  )}
                  {!uploadingImage && (
                    <small className="text-white d-block mt-1 opacity-90">
                      <FaEdit size={12} /> Cliquer pour modifier la photo
                    </small>
                  )}
                </label>
                <div className="text-white fw-bold mt-2" style={{ fontSize: 18 }}>
                  {user.prenoms} {user.nom}
                </div>
                <span className={`${badgeClass(user.categorie)} mt-1`}
                  style={{ fontSize: 12, padding: '4px 12px' }}>
                  {user.categorie}
                </span>
              </div>

              <div className="p-4">
                <Notif type={notif?.type} message={notif?.message} onClose={() => setNotif(null)} />

                {!editMode && (
                  <>
                    <div className="card border-0 bg-light rounded-3 mb-3">
                      <div className="card-body py-3">
                        <div className="row g-3">
                          <div className="col-6">
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <FaUserCircle className="text-muted" style={{ fontSize: 13 }} />
                              <span className="text-muted" style={{ fontSize: 12 }}>Nom</span>
                            </div>
                            <div className="fw-semibold">{user.nom}</div>
                          </div>
                          <div className="col-6">
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <FaUserCircle className="text-muted" style={{ fontSize: 13 }} />
                              <span className="text-muted" style={{ fontSize: 12 }}>Prénoms</span>
                            </div>
                            <div className="fw-semibold">{user.prenoms}</div>
                          </div>
                          <div className="col-12">
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <FaEnvelope className="text-muted" style={{ fontSize: 13 }} />
                              <span className="text-muted" style={{ fontSize: 12 }}>Email</span>
                            </div>
                            <div className="fw-semibold">{user.email}</div>
                          </div>
                          <div className="col-12">
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <FaTag className="text-muted" style={{ fontSize: 13 }} />
                              <span className="text-muted" style={{ fontSize: 12 }}>Catégorie</span>
                            </div>
                            <span className={badgeClass(user.categorie)}>{user.categorie}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* ✅ Admin → bouton Modifier | Autres → lecture seule */}
                    {user.categorie === 'admin' ? (
                      <div className="d-flex flex-wrap gap-2">
                        <button
                          className="btn btn-primary d-flex align-items-center gap-2"
                          onClick={() => setEditMode(true)}
                        >
                          <FaEdit /> Modifier mes informations
                        </button>
                      </div>
                    ) : (
                      <div
                        className="alert alert-info py-2 px-3 mb-0 d-flex align-items-center gap-2"
                        style={{ fontSize: 13 }}
                      >
                        <FaTag />
                        Vos informations sont en lecture seule. Contactez un administrateur pour toute modification.
                      </div>
                    )}
                  </>
                )}

                {editMode && (
                  <form onSubmit={handleSaveInfo} noValidate>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold" style={{ fontSize: 14 }}>
                          Nom <span className="text-danger">*</span>
                        </label>
                        <input type="text" name="nom"
                          className={`form-control${errors.nom ? ' is-invalid' : ''}`}
                          value={formData.nom} onChange={handleChange} disabled={saving} />
                        {errors.nom && <div className="invalid-feedback">{errors.nom}</div>}
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold" style={{ fontSize: 14 }}>
                          Prénoms <span className="text-danger">*</span>
                        </label>
                        <input type="text" name="prenoms"
                          className={`form-control${errors.prenoms ? ' is-invalid' : ''}`}
                          value={formData.prenoms} onChange={handleChange} disabled={saving} />
                        {errors.prenoms && <div className="invalid-feedback">{errors.prenoms}</div>}
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold" style={{ fontSize: 14 }}>
                          Email <span className="text-danger">*</span>
                        </label>
                        <input type="email" name="email"
                          className={`form-control${errors.email ? ' is-invalid' : ''}`}
                          value={formData.email} onChange={handleChange} disabled={saving} />
                        {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold" style={{ fontSize: 14 }}>Catégorie</label>
                        <input type="text" className="form-control bg-light"
                          value={user.categorie} disabled readOnly />
                        <small className="text-muted">La catégorie ne peut pas être modifiée ici.</small>
                      </div>
                    </div>
                    <div className="d-flex gap-2 mt-3">
                      <button type="submit" className="btn btn-success d-flex align-items-center gap-2"
                        disabled={saving}>
                        {saving
                          ? <><span className="spinner-border spinner-border-sm" />Enregistrement…</>
                          : <><FaSave />Enregistrer</>}
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}
                        disabled={saving}>
                        <FaTimes className="me-1" />Annuler
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {pwdOpen && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 440 }}>
            <div className="modal-content shadow-lg">
              <div className="modal-header text-white" style={{ backgroundColor: '#1a6bbf' }}>
                <h6 className="modal-title d-flex align-items-center gap-2 mb-0">
                  <FaKey />Changer le mot de passe
                </h6>
                <button className="btn-close btn-close-white"
                  onClick={() => { setPwdOpen(false); setPwdData({ oldPassword: '', newPassword: '', confirmPassword: '' }); setPwdErrors({}); }} />
              </div>
              <div className="modal-body p-4">
                <form onSubmit={handleSavePwd} noValidate>
                  <PwdInput label="Ancien mot de passe" name="old_p" value={pwdData.oldPassword}
                    onChange={(v) => setPwdData(p => ({ ...p, oldPassword: v }))} error={pwdErrors.oldPassword} />
                  <PwdInput label="Nouveau mot de passe" name="new_p" value={pwdData.newPassword}
                    onChange={(v) => setPwdData(p => ({ ...p, newPassword: v }))} error={pwdErrors.newPassword} />
                  <PwdInput label="Confirmer le mot de passe" name="conf_p" value={pwdData.confirmPassword}
                    onChange={(v) => setPwdData(p => ({ ...p, confirmPassword: v }))}
                    error={pwdErrors.confirmPassword}
                    success={pwdMatch(pwdData.newPassword, pwdData.confirmPassword) ? 'Mots de passe identiques ✓' : null} />
                  <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-secondary"
                      onClick={() => { setPwdOpen(false); setPwdData({ oldPassword: '', newPassword: '', confirmPassword: '' }); setPwdErrors({}); }}>
                      <FaTimes className="me-1" />Annuler
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={pwdLoading}>
                      {pwdLoading ? <span className="spinner-border spinner-border-sm me-1" /> : <FaCheck className="me-1" />}
                      Confirmer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {forgotOpen && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 440 }}>
            <div className="modal-content shadow-lg">
              <div className="modal-header text-white" style={{ backgroundColor: '#c0392b' }}>
                <h6 className="modal-title d-flex align-items-center gap-2 mb-0">
                  <FaUnlock />Réinitialiser mon mot de passe
                </h6>
                <button className="btn-close btn-close-white"
                  onClick={() => { setForgotOpen(false); setForgotData({ newPassword: '', confirmPassword: '' }); setForgotErrors({}); }} />
              </div>
              <div className="modal-body p-4">
                <div className="alert alert-warning py-2 small mb-3">
                  <strong>Attention :</strong> Le mot de passe sera remplacé sans vérification de l'ancien.
                </div>
                <form onSubmit={handleSaveForgot} noValidate>
                  <PwdInput label="Nouveau mot de passe" name="forgot_new" value={forgotData.newPassword}
                    onChange={(v) => setForgotData(p => ({ ...p, newPassword: v }))} error={forgotErrors.newPassword} />
                  <PwdInput label="Confirmer le mot de passe" name="forgot_conf" value={forgotData.confirmPassword}
                    onChange={(v) => setForgotData(p => ({ ...p, confirmPassword: v }))}
                    error={forgotErrors.confirmPassword}
                    success={pwdMatch(forgotData.newPassword, forgotData.confirmPassword) ? 'Mots de passe identiques ✓' : null} />
                  <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-secondary"
                      onClick={() => { setForgotOpen(false); setForgotData({ newPassword: '', confirmPassword: '' }); setForgotErrors({}); }}>
                      <FaTimes className="me-1" />Annuler
                    </button>
                    <button type="submit" className="btn btn-danger" disabled={forgotLoading}>
                      {forgotLoading ? <span className="spinner-border spinner-border-sm me-1" /> : <FaUnlock className="me-1" />}
                      Réinitialiser
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
const ManageUsersModal = ({ show, onClose, showProfil = false }) => {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // panel : null | 'edit' | 'create' | 'profil'
  const [panel, setPanel] = useState(null);

  const [editUser, setEditUser] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const [createData, setCreateData] = useState(EMPTY_CREATE);
  const [createErrors, setCreateErrors] = useState({});
  const [createNotif, setCreateNotif] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);

  // ✅ Nouveaux states pour l'image lors de la création
  const [createAvatarFile, setCreateAvatarFile] = useState(null);
  const [createPreview, setCreatePreview] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [pwdModal, setPwdModal] = useState(false);
  const [pwdTarget, setPwdTarget] = useState(null);
  const [pwdData, setPwdData] = useState(EMPTY_PWD);
  const [pwdErrors, setPwdErrors] = useState({});
  const [pwdLoading, setPwdLoading] = useState(false);

  const [forgotModal, setForgotModal] = useState(false);
  const [forgotTarget, setForgotTarget] = useState(null);
  const [forgotData, setForgotData] = useState(EMPTY_FORGOT);
  const [forgotErrors, setForgotErrors] = useState({});
  const [forgotLoading, setForgotLoading] = useState(false);

  const [tableNotif, setTableNotif] = useState(null);

  useEffect(() => {
    if (show) {
      fetchUsers();
      if (showProfil) setPanel('profil');
    }
  }, [show, showProfil]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const r = await getUsers();
      if (r.success) setUsers(r.data);
      else setTableNotif({ type: 'error', message: r.error });
    } catch { setTableNotif({ type: 'error', message: 'Erreur de chargement' }); }
    finally { setLoading(false); }
  };

  const handleClose = () => {
    setPanel(null);
    setEditUser(null); setFormData(EMPTY_FORM);
    setCreateData(EMPTY_CREATE); setCreateErrors({}); setCreateNotif(null); setCreateLoading(false);
    // ✅ Reset des states image création
    setCreateAvatarFile(null);
    setCreatePreview(null);
    setDeleteTarget(null); setDeleteLoading(false);
    setPwdModal(false); setPwdTarget(null); setPwdData(EMPTY_PWD); setPwdErrors({});
    setForgotModal(false); setForgotTarget(null); setForgotData(EMPTY_FORGOT); setForgotErrors({});
    setTableNotif(null);
    onClose();
  };

  if (show && panel === 'profil' && currentUser) {
    return (
      <MonProfilPanel
        user={currentUser}
        onClose={handleClose}
        onSaved={fetchUsers}
      />
    );
  }

  if (!show) return null;

  // ── SUPPRESSION ──────────────────────────────────────────────────────────────
  const handleDeleteClick = (user) => setDeleteTarget(user);
  const handleDeleteCancel = () => setDeleteTarget(null);
  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      const r = await deleteUser(deleteTarget.id);
      if (r.success) { setTableNotif({ type: 'success', message: r.message || 'Utilisateur supprimé' }); fetchUsers(); }
      else setTableNotif({ type: 'error', message: r.error || 'Erreur de suppression' });
    } catch { setTableNotif({ type: 'error', message: 'Erreur de suppression' }); }
    finally { setDeleteLoading(false); setDeleteTarget(null); }
  };

  // ── CRÉATION ─────────────────────────────────────────────────────────────────
  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setCreateData(p => ({ ...p, [name]: value }));
    if (createErrors[name]) setCreateErrors(p => ({ ...p, [name]: '' }));
    if (name === 'password' || name === 'confirmPassword') {
      const pwd = name === 'password' ? value : createData.password;
      const conf = name === 'confirmPassword' ? value : createData.confirmPassword;
      if (conf && pwd !== conf) setCreateErrors(p => ({ ...p, confirmPassword: 'Les mots de passe ne correspondent pas' }));
      else setCreateErrors(p => ({ ...p, confirmPassword: '' }));
    }
  };

  const validateCreate = () => {
    const e = {};
    if (!createData.nom.trim()) e.nom = 'Le nom est requis';
    if (!createData.prenoms.trim()) e.prenoms = 'Les prénoms sont requis';
    if (!createData.email.trim()) e.email = "L'email est requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createData.email)) e.email = 'Email invalide';
    if (!createData.password) e.password = 'Le mot de passe est requis';
    else if (createData.password.length < 6) e.password = 'Minimum 6 caractères';
    if (!createData.confirmPassword) e.confirmPassword = 'Veuillez confirmer';
    else if (createData.password !== createData.confirmPassword) e.confirmPassword = 'Ne correspond pas';
    if (!createData.categorie) e.categorie = 'Sélectionner une catégorie';
    return e;
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault(); setCreateNotif(null);
    const errs = validateCreate();
    if (Object.keys(errs).length) { setCreateErrors(errs); return; }
    setCreateLoading(true);
    try {
      // ✅ FormData pour envoyer texte + image ensemble en multipart
      const formPayload = new FormData();
      formPayload.append('nom', createData.nom.trim());
      formPayload.append('prenoms', createData.prenoms.trim());
      formPayload.append('email', createData.email.trim());
      formPayload.append('password', createData.password);
      formPayload.append('categorie', createData.categorie);
      // ✅ Ajouter l'image seulement si elle existe
      if (createAvatarFile) {
        formPayload.append('image', createAvatarFile);
      }

      const r = await createUser(formPayload);

      if (r.success) {
        setCreateNotif({ type: 'success', message: r.message || 'Compte créé avec succès !' });
        setTimeout(() => {
          setCreateData(EMPTY_CREATE);
          setCreateErrors({});
          setCreateNotif(null);
          setCreateAvatarFile(null);
          setCreatePreview(null);
          setPanel(null);
          fetchUsers();
        }, 1600);
      } else {
        if (r.errors) {
          const m = {};
          Object.entries(r.errors).forEach(([k, v]) => { m[k] = Array.isArray(v) ? v[0] : v; });
          setCreateErrors(m);
          // ✅ Affiche le détail des erreurs Laravel
          const errorMessages = Object.values(m).join(' • ');
          setCreateNotif({ type: 'error', message: errorMessages || r.message || 'Erreur de validation' });
        } else {
          setCreateNotif({ type: 'error', message: r.message || 'Erreur lors de la création' });
        }
        setCreateLoading(false);
      }
    } catch (err) {
      setCreateNotif({ type: 'error', message: err.message || 'Erreur réseau' });
      setCreateLoading(false);
    }
  };

  // ── ÉDITION ──────────────────────────────────────────────────────────────────
  const handleEdit = (user) => {
    setPanel('edit');
    setEditUser(user);
    setFormData({ nom: user.nom || '', prenoms: user.prenoms || '', email: user.email || '', categorie: user.categorie || '' });
  };
  const handleCancelEdit = () => { setPanel(null); setEditUser(null); setFormData(EMPTY_FORM); };
  const handleSubmitInfo = async (e) => {
    e.preventDefault();
    try {
      const r = await updateUser(editUser.id, formData);
      if (r.success) { setTableNotif({ type: 'success', message: r.message || 'Modifié' }); handleCancelEdit(); fetchUsers(); }
      else setTableNotif({ type: 'error', message: r.error || 'Erreur' });
    } catch { setTableNotif({ type: 'error', message: 'Erreur de modification' }); }
  };

  // ── MOT DE PASSE ─────────────────────────────────────────────────────────────
  const openPwdModal = (u) => { setPwdTarget(u); setPwdData(EMPTY_PWD); setPwdErrors({}); setPwdModal(true); };
  const closePwdModal = () => { setPwdModal(false); setPwdTarget(null); setPwdData(EMPTY_PWD); setPwdErrors({}); };
  const validatePwd = () => {
    const e = {};
    if (!pwdData.oldPassword) e.oldPassword = 'Ancien mot de passe requis';
    if (!pwdData.newPassword) e.newPassword = 'Nouveau requis';
    else if (pwdData.newPassword.length < 6) e.newPassword = 'Minimum 6 caractères';
    if (pwdData.newPassword !== pwdData.confirmPassword) e.confirmPassword = 'Ne correspond pas';
    return e;
  };
  const handleSubmitPwd = async (e) => {
    e.preventDefault(); const errs = validatePwd(); if (Object.keys(errs).length) { setPwdErrors(errs); return; }
    setPwdLoading(true);
    try {
      const r = await updateUser(pwdTarget.id, { oldPassword: pwdData.oldPassword, password: pwdData.newPassword });
      if (r.success) { setTableNotif({ type: 'success', message: r.message || 'Mot de passe modifié' }); closePwdModal(); }
      else setTableNotif({ type: 'error', message: r.error || 'Erreur' });
    } catch { setTableNotif({ type: 'error', message: 'Erreur réseau' }); }
    finally { setPwdLoading(false); }
  };

  const openForgotModal = (u) => { setForgotTarget(u); setForgotData(EMPTY_FORGOT); setForgotErrors({}); setForgotModal(true); };
  const closeForgotModal = () => { setForgotModal(false); setForgotTarget(null); setForgotData(EMPTY_FORGOT); setForgotErrors({}); };
  const validateForgot = () => {
    const e = {};
    if (!forgotData.newPassword) e.newPassword = 'Requis';
    else if (forgotData.newPassword.length < 6) e.newPassword = 'Minimum 6 caractères';
    if (forgotData.newPassword !== forgotData.confirmPassword) e.confirmPassword = 'Ne correspond pas';
    return e;
  };
  const handleSubmitForgot = async (e) => {
    e.preventDefault(); const errs = validateForgot(); if (Object.keys(errs).length) { setForgotErrors(errs); return; }
    setForgotLoading(true);
    try {
      const r = await updateUser(forgotTarget.id, { password: forgotData.newPassword });
      if (r.success) { setTableNotif({ type: 'success', message: r.message || 'Réinitialisé' }); closeForgotModal(); }
      else setTableNotif({ type: 'error', message: r.error || 'Erreur' });
    } catch { setTableNotif({ type: 'error', message: 'Erreur réseau' }); }
    finally { setForgotLoading(false); }
  };

  return (
    <>
      {/* ══════════ MODALE PRINCIPALE ══════════ */}
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
        <div className="modal-dialog modal-xl modal-dialog-scrollable">
          <div className="modal-content shadow-lg">

            <div className="modal-header text-white" style={{ backgroundColor: '#800020' }}>
              <h5 className="modal-title d-flex align-items-center gap-2">
                <FaUsers /> Gestion des utilisateurs
              </h5>

              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={handleClose}
              />
            </div>

            <div className="modal-body p-4">
              <Notif type={tableNotif?.type} message={tableNotif?.message} onClose={() => setTableNotif(null)} />

              {/* ══════════ PANNEAU CRÉER ══════════ */}
              {panel === 'create' && (
                <div className="card mb-4 border-0 shadow-sm">
                  <div className="card-header text-white d-flex justify-content-between align-items-center"
                    style={{ backgroundColor: '#28a745' }}>
                    <span className="fw-bold"><FaUserPlus className="me-2" />Créer un nouveau compte</span>
                    <button className="btn btn-sm btn-light" type="button"
                      onClick={() => {
                        setPanel(null);
                        setCreateData(EMPTY_CREATE);
                        setCreateErrors({});
                        setCreateNotif(null);
                        setCreateAvatarFile(null);
                        setCreatePreview(null);
                      }}>
                      <FaTimes />
                    </button>
                  </div>

                  <div className="card-body">
                    <Notif type={createNotif?.type} message={createNotif?.message} onClose={() => setCreateNotif(null)} />
                    <form onSubmit={handleSubmitCreate} noValidate>
                      <div className="row g-3">

                        {/* ✅ BLOC PHOTO DE PROFIL */}
                        <div className="col-12 mb-1">
                          <label className="form-label fw-semibold">Photo de profil <span className="text-muted fw-normal"></span></label>
                          <div className="d-flex align-items-center gap-3">

                           
                            <div style={{
                              width: 64, height: 64, borderRadius: '50%', overflow: 'hidden',
                              backgroundColor: '#e9ecef', flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              backgroundImage: createPreview ? `url(${createPreview})` : 'none',
                              backgroundSize: 'cover', backgroundPosition: 'center',
                              fontSize: 20, fontWeight: 600, color: '#6c757d',
                              border: '2px solid #dee2e6',
                            }}>
                              {!createPreview && (
                                createData.prenoms || createData.nom
                                  ? `${(createData.prenoms || '').charAt(0)}${(createData.nom || '').charAt(0)}`.toUpperCase()
                                  : <FaUserCircle style={{ fontSize: 30, color: '#adb5bd' }} />
                              )}
                            </div>

                            {/* Input fichier + actions */}
                            <div className="d-flex flex-column gap-1">
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                className="form-control form-control-sm"
                                style={{ maxWidth: 240 }}
                                disabled={createLoading}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                 {/* if (file.size > 2 * 1024 * 1024) {
                                    setCreateNotif({ type: 'error', message: "L'image ne doit pas dépasser 2 Mo" });
                                    e.target.value = '';
                                    return;
                                  }*/}
                                  setCreateAvatarFile(file);
                                  setCreatePreview(URL.createObjectURL(file));
                                  e.target.value = '';
                                }}
                              />
                              <div className="d-flex align-items-center gap-2">
                                <small className="text-muted">JPG, PNG, GIF, WebP</small>
                                {createPreview && (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger py-0 px-2"
                                    style={{ fontSize: 11 }}
                                    onClick={() => { setCreateAvatarFile(null); setCreatePreview(null); }}
                                  >
                                    <FaTimes /> Supprimer
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Champs du formulaire */}
                        <div className="col-md-4">
                          <label className="form-label fw-semibold" style={{ fontSize: 14 }}>Nom <span className="text-danger">*</span></label>
                          <input type="text" name="nom"
                            className={`form-control${createErrors.nom ? ' is-invalid' : ''}`}
                            value={createData.nom} onChange={handleCreateChange}
                            placeholder="Saisir votre nom" disabled={createLoading} />
                          {createErrors.nom && <div className="invalid-feedback">{createErrors.nom}</div>}
                        </div>

                        <div className="col-md-4">
                          <label className="form-label fw-semibold" style={{ fontSize: 14 }}>Prénoms <span className="text-danger">*</span></label>
                          <input type="text" name="prenoms"
                            className={`form-control${createErrors.prenoms ? ' is-invalid' : ''}`}
                            value={createData.prenoms} onChange={handleCreateChange}
                            placeholder="Saisir votre Prénoms" disabled={createLoading} />
                          {createErrors.prenoms && <div className="invalid-feedback">{createErrors.prenoms}</div>}
                        </div>

                        <div className="col-md-4">
                          <label className="form-label fw-semibold" style={{ fontSize: 14 }}>Email <span className="text-danger">*</span></label>
                          <input type="email" name="email"
                            className={`form-control${createErrors.email ? ' is-invalid' : ''}`}
                            value={createData.email} onChange={handleCreateChange}
                            placeholder="exemple@zomatel.mg" disabled={createLoading} />
                          {createErrors.email && <div className="invalid-feedback">{createErrors.email}</div>}
                        </div>

                        <div className="col-md-4">
                          <PwdInput
                            label={<>Mot de passe <span className="text-danger">*</span></>}
                            name="pwd_c" value={createData.password}
                            onChange={(v) => handleCreateChange({ target: { name: 'password', value: v } })}
                            error={createErrors.password} />
                        </div>

                        <div className="col-md-4">
                          <PwdInput
                            label={<>Confirmer le mot de passe <span className="text-danger">*</span></>}
                            name="pwd_cc" value={createData.confirmPassword}
                            onChange={(v) => handleCreateChange({ target: { name: 'confirmPassword', value: v } })}
                            error={createErrors.confirmPassword}
                            success={pwdMatch(createData.password, createData.confirmPassword) ? 'Identiques ✓' : null} />
                        </div>

                        <div className="col-md-4">
                          <label className="form-label fw-semibold" style={{ fontSize: 14 }}>Catégorie <span className="text-danger">*</span></label>
                          <select name="categorie"
                            className={`form-select${createErrors.categorie ? ' is-invalid' : ''}`}
                            value={createData.categorie} onChange={handleCreateChange} disabled={createLoading}>
                            <option value="">— Sélectionner —</option>
                            <option value="Resto">Resto</option>
                            <option value="snack">Snack</option>
                            <option value="detente">Détente</option>
                            <option value="admin">Admin</option>
                          </select>
                          {createErrors.categorie && <div className="invalid-feedback">{createErrors.categorie}</div>}
                        </div>

                        <div className="col-12 d-flex gap-2">
                          <button type="submit" className="btn btn-success" disabled={createLoading}>
                            {createLoading
                              ? <><span className="spinner-border spinner-border-sm me-1" />Création…</>
                              : <><FaCheck className="me-1" />Valider</>}
                          </button>
                          <button type="button" className="btn btn-secondary" disabled={createLoading}
                            onClick={() => {
                              setPanel(null);
                              setCreateData(EMPTY_CREATE);
                              setCreateErrors({});
                              setCreateNotif(null);
                              setCreateAvatarFile(null);
                              setCreatePreview(null);
                            }}>
                            <FaTimes className="me-1" />Annuler
                          </button>
                        </div>

                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* ══════════ PANNEAU ÉDITER ══════════ */}
              {panel === 'edit' && editUser && (
                <div className="card mb-4 border-0 shadow-sm">
                  <div className="card-header text-white d-flex justify-content-between align-items-center"
                    style={{ backgroundColor: '#1a6bbf' }}>
                    <span className="fw-bold"><FaPencilAlt className="me-2" />Modifier : {editUser.prenoms} {editUser.nom}</span>
                    <button className="btn btn-sm btn-light" type="button" onClick={handleCancelEdit}><FaTimes /></button>
                  </div>
                  <div className="card-body">
                    <form onSubmit={handleSubmitInfo}>
                      <div className="row g-3">
                        <div className="col-12 mb-3">
                          <label className="form-label fw-semibold">Photo de profil</label>
                          <div className="d-flex align-items-center gap-3">
                            <div style={{
                              width: 60, height: 60, borderRadius: '50%', overflow: 'hidden',
                              backgroundColor: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              backgroundImage: getUserImageUrl(editUser) ? `url(${getUserImageUrl(editUser)})` : 'none',
                              backgroundSize: 'cover', backgroundPosition: 'center',
                              fontSize: 18, fontWeight: 600, color: '#6c757d',
                            }}>
                              {!getUserImageUrl(editUser) && `${(editUser.prenoms || '').charAt(0)}${(editUser.nom || '').charAt(0)}`.toUpperCase()}
                            </div>
                            <div>
                              <input type="file" accept="image/*" className="form-control form-control-sm" style={{ maxWidth: 220 }}
                                onChange={async (e) => {
                                  const f = e.target.files?.[0];
                                  if (f) {
                                    const r = await uploadUserAvatar(editUser.id, f);
                                    if (r.success) {
                                      setTableNotif({ type: 'success', message: r.message });
                                      fetchUsers();
                                      setEditUser(r.data?.user || editUser);
                                    } else {
                                      setTableNotif({ type: 'error', message: r.error });
                                    }
                                  }
                                  e.target.value = '';
                                }} />
                              <small className="text-muted">JPG, PNG, GIF, WebP</small>
                            </div>
                          </div>
                        </div>

                        <div className="col-md-3">
                          <label className="form-label fw-semibold" style={{ fontSize: 14 }}>Nom</label>
                          <input className="form-control" value={formData.nom} required
                            onChange={(e) => setFormData({ ...formData, nom: e.target.value })} />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label fw-semibold" style={{ fontSize: 14 }}>Prénoms</label>
                          <input className="form-control" value={formData.prenoms} required
                            onChange={(e) => setFormData({ ...formData, prenoms: e.target.value })} />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label fw-semibold" style={{ fontSize: 14 }}>Email</label>
                          <input type="email" className="form-control" value={formData.email} required
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label fw-semibold" style={{ fontSize: 14 }}>Catégorie</label>
                          <select className="form-select" value={formData.categorie}
                            onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}>
                            <option value="Resto">Resto</option>
                            <option value="snack">Snack</option>
                            <option value="detente">Détente</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        <div className="col-12 d-flex flex-wrap gap-2">
                          <button type="submit" className="btn btn-primary"><FaCheck className="me-1" />Enregistrer</button>
                          <button type="button" className="btn btn-success text-white" onClick={() => openPwdModal(editUser)}><FaKey className="me-1" />Changer le mot de passe</button>
                          <button type="button" className="btn btn-outline-danger" onClick={() => openForgotModal(editUser)}><FaUnlock className="me-1" />Mot de passe oublié</button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* ── Bouton Créer ── */}
              {panel === null && (
                <div className="d-flex justify-content-end mb-3">
                  <button className="btn btn-success d-flex align-items-center gap-2" onClick={() => setPanel('create')}>
                    <FaUserPlus /> Créer un compte
                  </button>
                </div>
              )}

              {/* ── Tableau utilisateurs ── */}
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border" style={{ color: '#800020' }} role="status" />
                  <p className="mt-3 text-muted">Chargement…</p>
                </div>
              ) : users.length === 0 ? (
                <div className="alert alert-info">Aucun utilisateur trouvé</div>
              ) : (
                <div className="table-responsive rounded shadow-sm">
                  <table className="table table-hover table-striped align-middle mb-0">
                    <thead style={{ backgroundColor: '#800020', color: 'white' }}>
                      <tr>
                        <th>#</th>
                        <th>Photo</th>
                        <th>Nom</th>
                        <th>Prénoms</th>
                        <th>Email</th>
                        <th>Catégorie</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u, idx) => (
                        <tr key={u.id} className={editUser?.id === u.id ? 'table-primary' : ''}>
                          <td className="text-muted">{idx + 1}</td>
                          <td>
                            <div style={{
                              width: 40, height: 40, borderRadius: '50%', overflow: 'hidden',
                              backgroundColor: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              backgroundImage: getUserImageUrl(u) ? `url(${getUserImageUrl(u)})` : 'none',
                              backgroundSize: 'cover', backgroundPosition: 'center',
                              fontSize: 14, fontWeight: 600, color: '#6c757d',
                            }}>
                              {!getUserImageUrl(u) && `${(u.prenoms || '').charAt(0)}${(u.nom || '').charAt(0)}`.toUpperCase()}
                            </div>
                          </td>
                          <td className="fw-semibold">{u.nom}</td>
                          <td>{u.prenoms}</td>
                          <td className="text-muted small">{u.email}</td>
                          <td><span className={badgeClass(u.categorie)}>{u.categorie}</span></td>
                          <td className="text-center">
                            <button className="btn btn-sm btn-primary me-1" title="Modifier" onClick={() => handleEdit(u)}><FaPencilAlt /></button>
                            <button className="btn btn-sm btn-danger" title="Supprimer" onClick={() => handleDeleteClick(u)}><FaTrashAlt /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer bg-light">
              <span className="text-muted me-auto small">{users.length} utilisateur(s)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ CONFIRMATION SUPPRESSION ══════════ */}
      <DeleteConfirmModal
        user={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        loading={deleteLoading}
      />

      {/* ══════════ CHANGER MOT DE PASSE ══════════ */}
      {pwdModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 460 }}>
            <div className="modal-content shadow-lg">
              <div className="modal-header text-white" style={{ backgroundColor: '#1a6bbf' }}>
                <h6 className="modal-title d-flex align-items-center gap-2 mb-0">
                  <FaKey />Changer le mot de passe — {pwdTarget?.prenoms} {pwdTarget?.nom}
                </h6>
                <button className="btn-close btn-close-white" onClick={closePwdModal} />
              </div>
              <div className="modal-body p-4">
                <form onSubmit={handleSubmitPwd} noValidate>
                  <PwdInput label="Ancien mot de passe" name="op" value={pwdData.oldPassword}
                    onChange={(v) => setPwdData(p => ({ ...p, oldPassword: v }))} error={pwdErrors.oldPassword} />
                  <PwdInput label="Nouveau mot de passe" name="np" value={pwdData.newPassword}
                    onChange={(v) => setPwdData(p => ({ ...p, newPassword: v }))} error={pwdErrors.newPassword} />
                  <PwdInput label="Confirmer" name="cp" value={pwdData.confirmPassword}
                    onChange={(v) => setPwdData(p => ({ ...p, confirmPassword: v }))}
                    error={pwdErrors.confirmPassword}
                    success={pwdMatch(pwdData.newPassword, pwdData.confirmPassword) ? 'Identiques ✓' : null} />
                  <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-secondary" onClick={closePwdModal}>
                      <FaTimes className="me-1" />Annuler
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={pwdLoading}>
                      {pwdLoading ? <span className="spinner-border spinner-border-sm me-1" /> : <FaCheck className="me-1" />}
                      Confirmer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ MOT DE PASSE OUBLIÉ ══════════ */}
      {forgotModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 460 }}>
            <div className="modal-content shadow-lg">
              <div className="modal-header text-white" style={{ backgroundColor: '#c0392b' }}>
                <h6 className="modal-title d-flex align-items-center gap-2 mb-0">
                  <FaUnlock />Réinitialiser — {forgotTarget?.prenoms} {forgotTarget?.nom}
                </h6>
                <button className="btn-close btn-close-white" onClick={closeForgotModal} />
              </div>
              <div className="modal-body p-4">
                <div className="alert alert-warning py-2 small mb-3">
                  <strong>Attention :</strong> Remplace sans vérification de l'ancien.
                </div>
                <form onSubmit={handleSubmitForgot} noValidate>
                  <PwdInput label="Nouveau mot de passe" name="fn" value={forgotData.newPassword}
                    onChange={(v) => setForgotData(p => ({ ...p, newPassword: v }))} error={forgotErrors.newPassword} />
                  <PwdInput label="Confirmer" name="fc" value={forgotData.confirmPassword}
                    onChange={(v) => setForgotData(p => ({ ...p, confirmPassword: v }))}
                    error={forgotErrors.confirmPassword}
                    success={pwdMatch(forgotData.newPassword, forgotData.confirmPassword) ? 'Identiques ✓' : null} />
                  <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-secondary" onClick={closeForgotModal}>
                      <FaTimes className="me-1" />Annuler
                    </button>
                    <button type="submit" className="btn btn-danger" disabled={forgotLoading}>
                      {forgotLoading ? <span className="spinner-border spinner-border-sm me-1" /> : <FaUnlock className="me-1" />}
                      Réinitialiser
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ManageUsersModal;
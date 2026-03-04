// src/components/Modal/UserProfils.js

import React, { useState, useEffect } from 'react';
import {
  FaUserCircle, FaEnvelope, FaTag, FaEdit,
  FaSave, FaTimes, FaKey, FaCheck, FaUnlock,
  FaEye, FaEyeSlash,
} from 'react-icons/fa';

import { useAuth }                                       from '../../contexts/AuthContext';
import { updateUser, uploadUserAvatar, getUserImageUrl } from '../../services/userService';

// ─── Badge catégorie ──────────────────────────────────────────────────────────
const badgeClass = (cat) => {
  const m = {
    admin:   'bg-danger',
    manager: 'bg-warning text-dark',
    Resto:   'bg-info text-dark',
    snack:   'bg-primary',
    detente: 'bg-success',
  };
  return `badge ${m[cat] || 'bg-secondary'}`;
};

const pwdMatch = (a, b) => a && b && a === b;

// ─── Notification inline ──────────────────────────────────────────────────────
const Notif = ({ type, message, onClose }) => {
  if (!message) return null;
  const cfg = {
    success: { bg: '#d4edda', border: '#28a745', color: '#155724', icon: '✅' },
    error:   { bg: '#f8d7da', border: '#dc3545', color: '#721c24', icon: '❌' },
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
      {error   && <div className="invalid-feedback d-block" style={{ fontSize: 12 }}>{error}</div>}
      {success && <div className="valid-feedback d-block"   style={{ fontSize: 12 }}>{success}</div>}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
const UserProfils = ({ user: userProp, onClose, onSaved }) => {
  const { setUser, refreshUser } = useAuth();

  // ✅ FIX PRINCIPAL : on utilise userProp EN PRIORITÉ (comme editUser dans ManageUsersModal)
  // userProp vient de currentUser dans ManageUsersModal → il a toujours l'id correct
  // On ne prend PAS currentUser du contexte directement car il peut ne pas avoir l'id
  const [user, setLocalUser] = useState(userProp);

  const [editMode,       setEditMode]       = useState(false);
  const [formData,       setFormData]       = useState({
    nom:     userProp?.nom     || '',
    prenoms: userProp?.prenoms || '',
    email:   userProp?.email   || '',
  });
  const [errors,         setErrors]         = useState({});
  const [notif,          setNotif]          = useState(null);
  const [saving,         setSaving]         = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageTimestamp, setImageTimestamp] = useState(() => Date.now());

  const rawUrl   = getUserImageUrl(user);
  const cleanUrl = rawUrl ? rawUrl.split('?')[0] : null;
  const imageUrl = cleanUrl ? `${cleanUrl}?t=${imageTimestamp}` : null;

  const [pwdOpen,    setPwdOpen]    = useState(false);
  const [pwdData,    setPwdData]    = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdErrors,  setPwdErrors]  = useState({});
  const [pwdLoading, setPwdLoading] = useState(false);

  const [forgotOpen,    setForgotOpen]    = useState(false);
  const [forgotData,    setForgotData]    = useState({ newPassword: '', confirmPassword: '' });
  const [forgotErrors,  setForgotErrors]  = useState({});
  const [forgotLoading, setForgotLoading] = useState(false);

  // ✅ Met à jour le user local ET le contexte Auth ET localStorage
  const applyUpdate = (updatedUser) => {
    setLocalUser(updatedUser);
    setUser(updatedUser);
    try { localStorage.setItem('user', JSON.stringify(updatedUser)); } catch {}
  };

  // Sync formData si userProp change de l'extérieur
  useEffect(() => {
    if (userProp) {
      setLocalUser(userProp);
      if (!editMode) {
        setFormData({
          nom:     userProp.nom     || '',
          prenoms: userProp.prenoms || '',
          email:   userProp.email   || '',
        });
      }
    }
  }, [userProp?.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const validateInfo = () => {
    const e = {};
    if (!formData.nom.trim())     e.nom     = 'Le nom est requis';
    if (!formData.prenoms.trim()) e.prenoms = 'Les prénoms sont requis';
    if (!formData.email.trim())   e.email   = "L'email est requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Email invalide';
    return e;
  };

  // ✅ Même logique que handleSubmitInfo dans ManageUsersModal
  const handleSaveInfo = async (e) => {
    e.preventDefault();
    const errs = validateInfo();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const r = await updateUser(user.id, {
        nom:     formData.nom.trim(),
        prenoms: formData.prenoms.trim(),
        email:   formData.email.trim(),
      });

      if (r.success) {
        // Même logique que ManageUsersModal pour récupérer le user mis à jour
        const updated = r.data?.user || r.data || {
          ...user,
          nom:     formData.nom.trim(),
          prenoms: formData.prenoms.trim(),
          email:   formData.email.trim(),
        };
        applyUpdate(updated);
        if (typeof refreshUser === 'function') {
          try { await refreshUser(); } catch {}
        }
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
    setFormData({ nom: user?.nom || '', prenoms: user?.prenoms || '', email: user?.email || '' });
    setErrors({});
    setEditMode(false);
  };

  const validatePwd = () => {
    const e = {};
    if (!pwdData.oldPassword)                            e.oldPassword     = 'Ancien mot de passe requis';
    if (!pwdData.newPassword)                            e.newPassword     = 'Nouveau mot de passe requis';
    else if (pwdData.newPassword.length < 6)             e.newPassword     = 'Minimum 6 caractères';
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
        const updated = r.data?.user || r.data || user;
        applyUpdate(updated);
        setNotif({ type: 'success', message: r.message || 'Mot de passe modifié avec succès !' });
        setPwdOpen(false);
        setPwdData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        setPwdErrors({});
      } else {
        setNotif({ type: 'error', message: r.error || 'Erreur de changement de mot de passe' });
      }
    } catch (err) { setNotif({ type: 'error', message: err.message || 'Erreur réseau' }); }
    finally { setPwdLoading(false); }
  };

  const validateForgot = () => {
    const e = {};
    if (!forgotData.newPassword)                              e.newPassword     = 'Nouveau mot de passe requis';
    else if (forgotData.newPassword.length < 6)               e.newPassword     = 'Minimum 6 caractères';
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
        const updated = r.data?.user || r.data || user;
        applyUpdate(updated);
        setNotif({ type: 'success', message: r.message || 'Mot de passe réinitialisé avec succès !' });
        setForgotOpen(false);
        setForgotData({ newPassword: '', confirmPassword: '' });
        setForgotErrors({});
      } else {
        setNotif({ type: 'error', message: r.error || 'Erreur' });
      }
    } catch (err) { setNotif({ type: 'error', message: err.message || 'Erreur réseau' }); }
    finally { setForgotLoading(false); }
  };

  const initiales = `${(user?.prenoms || '').charAt(0)}${(user?.nom || '').charAt(0)}`.toUpperCase();

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      setNotif({ type: 'error', message: 'Veuillez sélectionner une image (JPG, PNG, GIF, WebP)' });
      return;
    }
    setUploadingImage(true);
    setNotif(null);
    try {
      const r = await uploadUserAvatar(user.id, file);
      if (r.success) {
        const updated = r.data?.user || r.data || user;
        applyUpdate(updated);
        if (typeof refreshUser === 'function') {
          try { await refreshUser(); } catch {}
        }
        setImageTimestamp(Date.now());
        setNotif({ type: 'success', message: r.message || 'Photo mise à jour !' });
        if (typeof onSaved === 'function') onSaved();
      } else {
        setNotif({ type: 'error', message: r.error || "Erreur lors de l'upload" });
      }
    } catch (err) {
      setNotif({ type: 'error', message: err.message || 'Erreur réseau' });
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  if (!user) return null;

  return (
    <>
      {/* ══ MODALE PRINCIPALE ══ */}
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

              {/* Bandeau avatar */}
              <div className="text-center py-4"
                style={{ background: 'linear-gradient(135deg, #800020 0%, #b0003a 100%)' }}>
                <label className="d-inline-block position-relative"
                  style={{ cursor: uploadingImage ? 'wait' : 'pointer' }}>
                  <input type="file" accept="image/jpeg,image/png,image/gif,image/webp"
                    className="d-none" onChange={handleImageChange} disabled={uploadingImage} />

                  <div style={{
                    width: 100, height: 100, borderRadius: '50%',
                    border: '3px solid rgba(255,255,255,0.6)',
                    margin: '0 auto 10px', overflow: 'hidden',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 32, fontWeight: 700, color: '#fff', letterSpacing: 2,
                    position: 'relative',
                  }}>
                    {imageUrl ? (
                      <img key={imageTimestamp} src={imageUrl} alt="avatar" style={{
                        width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center',
                        position: 'absolute', top: 0, left: 0, borderRadius: '50%',
                      }} />
                    ) : (
                      <span>{initiales}</span>
                    )}
                  </div>

                  {uploadingImage && (
                    <div style={{
                      position: 'absolute', inset: 0, borderRadius: '50%',
                      background: 'rgba(0,0,0,0.5)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
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

              {/* Corps */}
              <div className="p-4">
                <Notif type={notif?.type} message={notif?.message} onClose={() => setNotif(null)} />

                {/* Vue lecture */}
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

                    {user.categorie === 'admin' ? (
                      <div className="d-flex flex-wrap gap-2">
                        <button className="btn btn-primary d-flex align-items-center gap-2"
                          onClick={() => setEditMode(true)}>
                          <FaEdit /> Modifier mes informations
                        </button>
                        
                      </div>
                    ) : (
                      <>
                        <div className="alert alert-info py-2 px-3 mb-2 d-flex align-items-center gap-2"
                          style={{ fontSize: 13 }}>
                          <FaTag />
                          Vos informations sont en lecture seule. Contactez un administrateur pour toute modification.
                        </div>
                        
                      </>
                    )}
                  </>
                )}

                {/* Vue édition */}
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
                      <button type="button" className="btn btn-secondary"
                        onClick={handleCancelEdit} disabled={saving}>
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
      {/* ══ MODALE MOT DE PASSE OUBLIÉ ══ */}
      {forgotOpen && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 440 }}>
            <div className="modal-content shadow-lg">
              <div className="modal-header text-white" style={{ backgroundColor: '#c0392b' }}>
                <h6 className="modal-title d-flex align-items-center gap-2 mb-0">
                  <FaUnlock /> Réinitialiser mon mot de passe
                </h6>
                <button className="btn-close btn-close-white"
                  onClick={() => { setForgotOpen(false); setForgotData({ newPassword: '', confirmPassword: '' }); setForgotErrors({}); }} />
              </div>
              <div className="modal-body p-4">
                <div className="alert alert-warning py-2 small mb-3">
                  <strong>Attention :</strong> Le mot de passe sera remplacé sans vérification de l'ancien.
                </div>
                <form onSubmit={handleSaveForgot} noValidate>
                  <PwdInput label="Nouveau mot de passe" name="forgot_new"
                    value={forgotData.newPassword}
                    onChange={(v) => setForgotData(p => ({ ...p, newPassword: v }))}
                    error={forgotErrors.newPassword} />
                  <PwdInput label="Confirmer le mot de passe" name="forgot_conf"
                    value={forgotData.confirmPassword}
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

export default UserProfils;
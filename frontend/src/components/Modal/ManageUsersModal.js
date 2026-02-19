// frontend/src/components/Modal/ManageUsersModal.jsx

import React, { useState, useEffect } from 'react';
import { getUsers, updateUser, deleteUser, createUser } from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import {
  FaUsers, FaUserPlus, FaPencilAlt, FaTrashAlt,
  FaKey, FaUnlock, FaTimes, FaCheck, FaEye, FaEyeSlash,
  FaExclamationTriangle, FaUserCircle, FaEnvelope,
  FaTag, FaSave, FaEdit
} from 'react-icons/fa';

// ─── Constantes ───────────────────────────────────────────────────────────────
const EMPTY_FORM   = { nom: '', prenoms: '', email: '', categorie: '' };
const EMPTY_PWD    = { oldPassword: '', newPassword: '', confirmPassword: '' };
const EMPTY_FORGOT = { newPassword: '', confirmPassword: '' };
const EMPTY_CREATE = { nom: '', prenoms: '', email: '', password: '', confirmPassword: '', categorie: '' };

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
    admin:   'bg-danger',
    manager: 'bg-warning text-dark',
    Resto:   'bg-info text-dark',
    snack:   'bg-primary',
    detente: 'bg-success',
  };
  return `badge ${m[cat] || 'bg-secondary'}`;
};

const pwdMatch = (a, b) => a && b && a === b;

// ─────────────────────────────────────────────────────────────────────────────
// PANNEAU MON PROFIL
// ─────────────────────────────────────────────────────────────────────────────
const MonProfilPanel = ({ user, onClose, onSaved }) => {
  const [editMode, setEditMode]   = useState(false);
  const [formData, setFormData]   = useState({ nom: user.nom || '', prenoms: user.prenoms || '', email: user.email || '' });
  const [errors,   setErrors]     = useState({});
  const [notif,    setNotif]      = useState(null);
  const [saving,   setSaving]     = useState(false);

  // Modale changement mot de passe
  const [pwdOpen,   setPwdOpen]   = useState(false);
  const [pwdData,   setPwdData]   = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdErrors, setPwdErrors] = useState({});
  const [pwdLoading,setPwdLoading]= useState(false);

  // Modale mot de passe oublié
  const [forgotOpen,   setForgotOpen]   = useState(false);
  const [forgotData,   setForgotData]   = useState({ newPassword: '', confirmPassword: '' });
  const [forgotErrors, setForgotErrors] = useState({});
  const [forgotLoading,setForgotLoading]= useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const validateInfo = () => {
    const e = {};
    if (!formData.nom.trim())    e.nom    = 'Le nom est requis';
    if (!formData.prenoms.trim())e.prenoms= 'Les prénoms sont requis';
    if (!formData.email.trim())  e.email  = "L'email est requis";
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

  // ── Changer mot de passe ────────────────────────────────────────────────────
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

  // ── Mot de passe oublié ─────────────────────────────────────────────────────
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

  // ── Initiales avatar ────────────────────────────────────────────────────────
  const initiales = `${(user.prenoms || '').charAt(0)}${(user.nom || '').charAt(0)}`.toUpperCase();

  return (
    <>
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
        <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 560 }}>
          <div className="modal-content shadow-lg border-0">

            {/* Header */}
            <div className="modal-header text-white border-0" style={{ backgroundColor: '#800020' }}>
              <h5 className="modal-title d-flex align-items-center gap-2">
                <FaUserCircle /> Mon Profil
              </h5>
              <button className="btn-close btn-close-white" onClick={onClose} />
            </div>

            <div className="modal-body p-0">

              {/* ── Bandeau avatar ── */}
              <div className="text-center py-4"
                style={{ background: 'linear-gradient(135deg, #800020 0%, #b0003a 100%)' }}>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)',
                  border: '3px solid rgba(255,255,255,0.6)', margin: '0 auto 10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: 2,
                }}>
                  {initiales}
                </div>
                <div className="text-white fw-bold" style={{ fontSize: 18 }}>
                  {user.prenoms} {user.nom}
                </div>
                <span className={`${badgeClass(user.categorie)} mt-1`}
                  style={{ fontSize: 12, padding: '4px 12px' }}>
                  {user.categorie}
                </span>
              </div>

              <div className="p-4">
                <Notif type={notif?.type} message={notif?.message} onClose={() => setNotif(null)} />

                {/* ── MODE VUE ── */}
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

                    {/* Actions */}
                    <div className="d-flex flex-wrap gap-2">
                      <button className="btn btn-primary d-flex align-items-center gap-2"
                        onClick={() => setEditMode(true)}>
                        <FaEdit /> Modifier mes informations
                      </button>
                     {/* <button className="btn btn-warning text-white d-flex align-items-center gap-2"
                        onClick={() => setPwdOpen(true)}>
                        <FaKey /> Changer le mot de passe
                      </button>
                      <button className="btn btn-outline-danger d-flex align-items-center gap-2"
                        onClick={() => setForgotOpen(true)}>
                        <FaUnlock /> Mot de passe oublié
                      </button>*/}
                    </div>
                  </>
                )}

                {/* ── MODE ÉDITION ── */}
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

      {/* ── Sous-modale : changer mot de passe ── */}
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

      {/* ── Sous-modale : mot de passe oublié ── */}
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

// 
// COMPOSANT PRINCIPAL

const ManageUsersModal = ({ show, onClose, showProfil = false }) => {
  const { user: currentUser } = useAuth();

  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(false);

  // panel : null | 'edit' | 'create' | 'profil'
  const [panel, setPanel] = useState(null);

  const [editUser, setEditUser] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const [createData,    setCreateData]    = useState(EMPTY_CREATE);
  const [createErrors,  setCreateErrors]  = useState({});
  const [createNotif,   setCreateNotif]   = useState(null);
  const [createLoading, setCreateLoading] = useState(false);

  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [pwdModal,   setPwdModal]   = useState(false);
  const [pwdTarget,  setPwdTarget]  = useState(null);
  const [pwdData,    setPwdData]    = useState(EMPTY_PWD);
  const [pwdErrors,  setPwdErrors]  = useState({});
  const [pwdLoading, setPwdLoading] = useState(false);

  const [forgotModal,   setForgotModal]   = useState(false);
  const [forgotTarget,  setForgotTarget]  = useState(null);
  const [forgotData,    setForgotData]    = useState(EMPTY_FORGOT);
  const [forgotErrors,  setForgotErrors]  = useState({});
  const [forgotLoading, setForgotLoading] = useState(false);

  const [tableNotif, setTableNotif] = useState(null);

  // Ouvre directement le profil si showProfil=true
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
    setDeleteTarget(null); setDeleteLoading(false);
    setPwdModal(false); setPwdTarget(null); setPwdData(EMPTY_PWD); setPwdErrors({});
    setForgotModal(false); setForgotTarget(null); setForgotData(EMPTY_FORGOT); setForgotErrors({});
    setTableNotif(null);
    onClose();
  };

  // ── Si le panneau profil est actif → affiche MonProfilPanel ─────────────────
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

  //  SUPPRESSION 
  const handleDeleteClick  = (user) => setDeleteTarget(user);
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

  // ════════ CRÉATION ════════
  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setCreateData(p => ({ ...p, [name]: value }));
    if (createErrors[name]) setCreateErrors(p => ({ ...p, [name]: '' }));
    if (name === 'password' || name === 'confirmPassword') {
      const pwd = name === 'password' ? value : createData.password;
      const conf= name === 'confirmPassword' ? value : createData.confirmPassword;
      if (conf && pwd !== conf) setCreateErrors(p => ({ ...p, confirmPassword: 'Les mots de passe ne correspondent pas' }));
      else setCreateErrors(p => ({ ...p, confirmPassword: '' }));
    }
  };

  const validateCreate = () => {
    const e = {};
    if (!createData.nom.trim())     e.nom      = 'Le nom est requis';
    if (!createData.prenoms.trim()) e.prenoms  = 'Les prénoms sont requis';
    if (!createData.email.trim())   e.email    = "L'email est requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createData.email)) e.email = 'Email invalide';
    if (!createData.password)       e.password = 'Le mot de passe est requis';
    else if (createData.password.length < 6) e.password = 'Minimum 6 caractères';
    if (!createData.confirmPassword) e.confirmPassword = 'Veuillez confirmer';
    else if (createData.password !== createData.confirmPassword) e.confirmPassword = 'Ne correspond pas';
    if (!createData.categorie)      e.categorie = 'Sélectionner une catégorie';
    return e;
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault(); setCreateNotif(null);
    const errs = validateCreate();
    if (Object.keys(errs).length) { setCreateErrors(errs); return; }
    setCreateLoading(true);
    try {
      const r = await createUser({ nom: createData.nom.trim(), prenoms: createData.prenoms.trim(), email: createData.email.trim(), password: createData.password, confirmPassword: createData.confirmPassword, categorie: createData.categorie });
      if (r.success) {
        setCreateNotif({ type: 'success', message: r.message || 'Compte créé avec succès !' });
        setTimeout(() => { setCreateData(EMPTY_CREATE); setCreateErrors({}); setCreateNotif(null); setPanel(null); fetchUsers(); }, 1600);
      } else {
        if (r.errors) { const m={}; Object.entries(r.errors).forEach(([k,v])=>{ m[k]=Array.isArray(v)?v[0]:v; }); setCreateErrors(m); }
        setCreateNotif({ type: 'error', message: r.message || 'Erreur lors de la création' });
        setCreateLoading(false);
      }
    } catch (err) { setCreateNotif({ type: 'error', message: err.message || 'Erreur réseau' }); setCreateLoading(false); }
  };

  // ════════ ÉDITION ════════
  const handleEdit = (user) => { setPanel('edit'); setEditUser(user); setFormData({ nom: user.nom||'', prenoms: user.prenoms||'', email: user.email||'', categorie: user.categorie||'' }); };
  const handleCancelEdit = () => { setPanel(null); setEditUser(null); setFormData(EMPTY_FORM); };
  const handleSubmitInfo = async (e) => {
    e.preventDefault();
    try {
      const r = await updateUser(editUser.id, formData);
      if (r.success) { setTableNotif({ type: 'success', message: r.message||'Modifié' }); handleCancelEdit(); fetchUsers(); }
      else setTableNotif({ type: 'error', message: r.error||'Erreur' });
    } catch { setTableNotif({ type: 'error', message: 'Erreur de modification' }); }
  };

  // ════════ MOT DE PASSE ════════
  const openPwdModal   = (u) => { setPwdTarget(u); setPwdData(EMPTY_PWD); setPwdErrors({}); setPwdModal(true); };
  const closePwdModal  = () => { setPwdModal(false); setPwdTarget(null); setPwdData(EMPTY_PWD); setPwdErrors({}); };
  const validatePwd = () => {
    const e={};
    if (!pwdData.oldPassword) e.oldPassword='Ancien mot de passe requis';
    if (!pwdData.newPassword) e.newPassword='Nouveau requis';
    else if (pwdData.newPassword.length<6) e.newPassword='Minimum 6 caractères';
    if (pwdData.newPassword!==pwdData.confirmPassword) e.confirmPassword='Ne correspond pas';
    return e;
  };
  const handleSubmitPwd = async (e) => {
    e.preventDefault(); const errs=validatePwd(); if(Object.keys(errs).length){setPwdErrors(errs);return;}
    setPwdLoading(true);
    try {
      const r=await updateUser(pwdTarget.id,{oldPassword:pwdData.oldPassword,password:pwdData.newPassword});
      if(r.success){setTableNotif({type:'success',message:r.message||'Mot de passe modifié'});closePwdModal();}
      else setTableNotif({type:'error',message:r.error||'Erreur'});
    } catch{setTableNotif({type:'error',message:'Erreur réseau'});}
    finally{setPwdLoading(false);}
  };

  const openForgotModal  = (u) => { setForgotTarget(u); setForgotData(EMPTY_FORGOT); setForgotErrors({}); setForgotModal(true); };
  const closeForgotModal = () => { setForgotModal(false); setForgotTarget(null); setForgotData(EMPTY_FORGOT); setForgotErrors({}); };
  const validateForgot = () => {
    const e={};
    if(!forgotData.newPassword) e.newPassword='Requis';
    else if(forgotData.newPassword.length<6) e.newPassword='Minimum 6 caractères';
    if(forgotData.newPassword!==forgotData.confirmPassword) e.confirmPassword='Ne correspond pas';
    return e;
  };
  const handleSubmitForgot = async (e) => {
    e.preventDefault(); const errs=validateForgot(); if(Object.keys(errs).length){setForgotErrors(errs);return;}
    setForgotLoading(true);
    try {
      const r=await updateUser(forgotTarget.id,{password:forgotData.newPassword});
      if(r.success){setTableNotif({type:'success',message:r.message||'Réinitialisé'});closeForgotModal();}
      else setTableNotif({type:'error',message:r.error||'Erreur'});
    } catch{setTableNotif({type:'error',message:'Erreur réseau'});}
    finally{setForgotLoading(false);}
  };

  return (
    <>
      {/*  MODALE PRINCIPALE  */}
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
        <div className="modal-dialog modal-xl modal-dialog-scrollable">
          <div className="modal-content shadow-lg">

            <div className="modal-header text-white" style={{ backgroundColor: '#800020' }}>
              <h5 className="modal-title d-flex align-items-center gap-2">
                <FaUsers /> Gestion des utilisateurs
              </h5>
              {/* Bouton Mon Profil dans le header */}
              
              <button className="btn-close btn-close-white" onClick={handleClose} />
            </div>

            <div className="modal-body p-4">
              <Notif type={tableNotif?.type} message={tableNotif?.message} onClose={() => setTableNotif(null)} />

              {/* ── Panneau CRÉER ── */}
              {panel === 'create' && (
                <div className="card mb-4 border-0 shadow-sm">
                  <div className="card-header text-white d-flex justify-content-between align-items-center"
                    style={{ backgroundColor: '#28a745' }}>
                    <span className="fw-bold"><FaUserPlus className="me-2" />Créer un nouveau compte</span>
                    <button className="btn btn-sm btn-light" type="button"
                      onClick={() => { setPanel(null); setCreateData(EMPTY_CREATE); setCreateErrors({}); setCreateNotif(null); }}>
                      <FaTimes />
                    </button>
                  </div>
                  <div className="card-body">
                    <Notif type={createNotif?.type} message={createNotif?.message} onClose={() => setCreateNotif(null)} />
                    <form onSubmit={handleSubmitCreate} noValidate>
                      <div className="row g-3">
                        <div className="col-md-4">
                          <label className="form-label fw-semibold" style={{ fontSize: 14 }}>Nom <span className="text-danger">*</span></label>
                          <input type="text" name="nom" className={`form-control${createErrors.nom?' is-invalid':''}`}
                            value={createData.nom} onChange={handleCreateChange} placeholder="Saisir votre nom" disabled={createLoading} />
                          {createErrors.nom && <div className="invalid-feedback">{createErrors.nom}</div>}
                        </div>
                        <div className="col-md-4">
                          <label className="form-label fw-semibold" style={{ fontSize: 14 }}>Prénoms <span className="text-danger">*</span></label>
                          <input type="text" name="prenoms" className={`form-control${createErrors.prenoms?' is-invalid':''}`}
                            value={createData.prenoms} onChange={handleCreateChange} placeholder="Saisir votre Prenoms" disabled={createLoading} />
                          {createErrors.prenoms && <div className="invalid-feedback">{createErrors.prenoms}</div>}
                        </div>
                        <div className="col-md-4">
                          <label className="form-label fw-semibold" style={{ fontSize: 14 }}>Email <span className="text-danger">*</span></label>
                          <input type="email" name="email" className={`form-control${createErrors.email?' is-invalid':''}`}
                            value={createData.email} onChange={handleCreateChange} placeholder="exemple@zomatel.mg" disabled={createLoading} />
                          {createErrors.email && <div className="invalid-feedback">{createErrors.email}</div>}
                        </div>
                        <div className="col-md-4">
                          <PwdInput label={<>Mot de passe <span className="text-danger">*</span></>}
                            name="pwd_c" value={createData.password}
                            onChange={(v) => handleCreateChange({ target: { name: 'password', value: v } })}
                            error={createErrors.password} />
                        </div>
                        <div className="col-md-4">
                          <PwdInput label={<>Confirmer le mot de passe <span className="text-danger">*</span></>}
                            name="pwd_cc" value={createData.confirmPassword}
                            onChange={(v) => handleCreateChange({ target: { name: 'confirmPassword', value: v } })}
                            error={createErrors.confirmPassword}
                            success={pwdMatch(createData.password, createData.confirmPassword) ? 'Identiques ✓' : null} />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label fw-semibold" style={{ fontSize: 14 }}>Catégorie <span className="text-danger">*</span></label>
                          <select name="categorie" className={`form-select${createErrors.categorie?' is-invalid':''}`}
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
                            {createLoading ? <><span className="spinner-border spinner-border-sm me-1" />Création…</> : <><FaCheck className="me-1" />Créer le compte</>}
                          </button>
                          <button type="button" className="btn btn-secondary" disabled={createLoading}
                            onClick={() => { setPanel(null); setCreateData(EMPTY_CREATE); setCreateErrors({}); setCreateNotif(null); }}>
                            <FaTimes className="me-1" />Annuler
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* ── Panneau ÉDITER ── */}
              {panel === 'edit' && editUser && (
                <div className="card mb-4 border-0 shadow-sm">
                  <div className="card-header text-white d-flex justify-content-between align-items-center"
                    style={{ backgroundColor: '#1a6bbf' }}>
                    <span className="fw-bold"><FaPencilAlt className="me-2" />Modifier : {editUser.nom} {editUser.prenoms}</span>
                    <button className="btn btn-sm btn-light" type="button" onClick={handleCancelEdit}><FaTimes /></button>
                  </div>
                  <div className="card-body">
                    <form onSubmit={handleSubmitInfo}>
                      <div className="row g-3">
                        <div className="col-md-3">
                          <label className="form-label fw-semibold" style={{ fontSize: 14 }}>Nom</label>
                          <input className="form-control" value={formData.nom} required onChange={(e) => setFormData({ ...formData, nom: e.target.value })} />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label fw-semibold" style={{ fontSize: 14 }}>Prénoms</label>
                          <input className="form-control" value={formData.prenoms} required onChange={(e) => setFormData({ ...formData, prenoms: e.target.value })} />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label fw-semibold" style={{ fontSize: 14 }}>Email</label>
                          <input type="email" className="form-control" value={formData.email} required onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label fw-semibold" style={{ fontSize: 14 }}>Catégorie</label>
                          <select className="form-select" value={formData.categorie} onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}>
                            <option value="Resto">Resto</option><option value="snack">Snack</option>
                            <option value="detente">Détente</option><option value="admin">Admin</option>
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

              {/* ── Bouton Créer + Tableau ── */}
              {panel === null && (
                <div className="d-flex justify-content-end mb-3">
                  <button className="btn btn-success d-flex align-items-center gap-2" onClick={() => setPanel('create')}>
                    <FaUserPlus /> Créer un compte
                  </button>
                </div>
              )}

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
                      <tr><th>#</th><th>Nom</th><th>Prénoms</th><th>Email</th><th>Catégorie</th><th className="text-center">Actions</th></tr>
                    </thead>
                    <tbody>
                      {users.map((u, idx) => (
                        <tr key={u.id} className={editUser?.id === u.id ? 'table-primary' : ''}>
                          <td className="text-muted">{idx + 1}</td>
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
              {/*<button className="btn btn-secondary" onClick={handleClose}><FaTimes className="me-1" />Fermer</button>*/}
            </div>
          </div>
        </div>
      </div>

      {/*  CONFIRMATION SUPPRESSION  */}
      <DeleteConfirmModal user={deleteTarget} onConfirm={handleDeleteConfirm} onCancel={handleDeleteCancel} loading={deleteLoading} />

      {/*  CHANGER MOT DE PASSE  */}
      {pwdModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 460 }}>
            <div className="modal-content shadow-lg">
              <div className="modal-header text-white" style={{ backgroundColor: '#1a6bbf' }}>
                <h6 className="modal-title d-flex align-items-center gap-2 mb-0"><FaKey />Changer le mot de passe — {pwdTarget?.nom} {pwdTarget?.prenoms}</h6>
                <button className="btn-close btn-close-white" onClick={closePwdModal} />
              </div>
              <div className="modal-body p-4">
                <form onSubmit={handleSubmitPwd} noValidate>
                  <PwdInput label="Ancien mot de passe" name="op" value={pwdData.oldPassword} onChange={(v) => setPwdData(p=>({...p,oldPassword:v}))} error={pwdErrors.oldPassword} />
                  <PwdInput label="Nouveau mot de passe" name="np" value={pwdData.newPassword} onChange={(v) => setPwdData(p=>({...p,newPassword:v}))} error={pwdErrors.newPassword} />
                  <PwdInput label="Confirmer" name="cp" value={pwdData.confirmPassword} onChange={(v) => setPwdData(p=>({...p,confirmPassword:v}))}
                    error={pwdErrors.confirmPassword} success={pwdMatch(pwdData.newPassword,pwdData.confirmPassword)?'Identiques ✓':null} />
                  <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-secondary" onClick={closePwdModal}><FaTimes className="me-1" />Annuler</button>
                    <button type="submit" className="btn btn-primary" disabled={pwdLoading}>
                      {pwdLoading?<span className="spinner-border spinner-border-sm me-1"/>:<FaCheck className="me-1"/>}Confirmer
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
                <h6 className="modal-title d-flex align-items-center gap-2 mb-0"><FaUnlock />Réinitialiser — {forgotTarget?.nom} {forgotTarget?.prenoms}</h6>
                <button className="btn-close btn-close-white" onClick={closeForgotModal} />
              </div>
              <div className="modal-body p-4">
                <div className="alert alert-warning py-2 small mb-3"><strong>Attention :</strong> Remplace sans vérification de l'ancien.</div>
                <form onSubmit={handleSubmitForgot} noValidate>
                  <PwdInput label="Nouveau mot de passe" name="fn" value={forgotData.newPassword} onChange={(v) => setForgotData(p=>({...p,newPassword:v}))} error={forgotErrors.newPassword} />
                  <PwdInput label="Confirmer" name="fc" value={forgotData.confirmPassword} onChange={(v) => setForgotData(p=>({...p,confirmPassword:v}))}
                    error={forgotErrors.confirmPassword} success={pwdMatch(forgotData.newPassword,forgotData.confirmPassword)?'Identiques ✓':null} />
                  <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-secondary" onClick={closeForgotModal}><FaTimes className="me-1" />Annuler</button>
                    <button type="submit" className="btn btn-danger" disabled={forgotLoading}>
                      {forgotLoading?<span className="spinner-border spinner-border-sm me-1"/>:<FaUnlock className="me-1"/>}Réinitialiser
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
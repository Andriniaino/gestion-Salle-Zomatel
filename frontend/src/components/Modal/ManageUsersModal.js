// src/components/Modal/ManageUsersModal.jsx

import React, { useState, useEffect } from 'react';
import {
  getUsers, updateUser, deleteUser,
  createUser, uploadUserAvatar, getUserImageUrl,
} from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import {
  FaUsers, FaUserPlus, FaPencilAlt, FaTrashAlt,
  FaKey, FaUnlock, FaTimes, FaCheck, FaEye, FaEyeSlash,
  FaExclamationTriangle, FaUserCircle,
} from 'react-icons/fa';

import UserProfils from './UserProfils';

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
            <button type="button" className="btn btn-outline-secondary px-4" onClick={onCancel} disabled={loading}>
              <FaTimes className="me-1" />Annuler
            </button>
            <button type="button" className="btn btn-danger px-4" onClick={onConfirm} disabled={loading}>
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


const ManageUsersModal = ({ show, onClose, showProfil = false }) => {
  const { user: currentUser, setUser } = useAuth();

  const [users,           setUsers]           = useState([]);
  const [loading,         setLoading]         = useState(false);
  const [panel,           setPanel]           = useState(null); // null | 'create' | 'edit' | 'profil'
  const [editUser,        setEditUser]        = useState(null);
  const [formData,        setFormData]        = useState(EMPTY_FORM);

  const [createData,       setCreateData]       = useState(EMPTY_CREATE);
  const [createErrors,     setCreateErrors]     = useState({});
  const [createNotif,      setCreateNotif]      = useState(null);
  const [createLoading,    setCreateLoading]    = useState(false);
  const [createAvatarFile, setCreateAvatarFile] = useState(null);
  const [createPreview,    setCreatePreview]    = useState(null);

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

  // ── Chargement initial ───────────────────────────────────────────────────────
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
    } catch {
      setTableNotif({ type: 'error', message: 'Erreur de chargement' });
    } finally {
      setLoading(false);
    }
  };

  // ── Fermeture complète ───────────────────────────────────────────────────────
  const handleClose = () => {
    setPanel(null); setEditUser(null); setFormData(EMPTY_FORM);
    setCreateData(EMPTY_CREATE); setCreateErrors({}); setCreateNotif(null);
    setCreateLoading(false); setCreateAvatarFile(null); setCreatePreview(null);
    setDeleteTarget(null); setDeleteLoading(false);
    setPwdModal(false); setPwdTarget(null); setPwdData(EMPTY_PWD); setPwdErrors({});
    setForgotModal(false); setForgotTarget(null); setForgotData(EMPTY_FORGOT); setForgotErrors({});
    setTableNotif(null);
    onClose();
  };

  // ── Si le profil est affiché, on cache toute la modale principale ────────────
  // et on rend uniquement UserProfils au premier plan
  if (!show) return null;

  if (panel === 'profil' && currentUser) {
    return (
      <UserProfils
        user={currentUser}
        onClose={handleClose}
        onSaved={() => { fetchUsers(); setPanel(null); }}
      />
    );
  }

  // ── SUPPRESSION ──────────────────────────────────────────────────────────────
  const handleDeleteClick   = (u) => setDeleteTarget(u);
  const handleDeleteCancel  = () => setDeleteTarget(null);
  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      const r = await deleteUser(deleteTarget.id);
      if (r.success) {
        setTableNotif({ type: 'success', message: r.message || 'Utilisateur supprimé' });
        fetchUsers();
      } else {
        setTableNotif({ type: 'error', message: r.error || 'Erreur de suppression' });
      }
    } catch {
      setTableNotif({ type: 'error', message: 'Erreur de suppression' });
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  // ── CRÉATION ─────────────────────────────────────────────────────────────────
  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setCreateData(p => ({ ...p, [name]: value }));
    if (createErrors[name]) setCreateErrors(p => ({ ...p, [name]: '' }));
    if (name === 'password' || name === 'confirmPassword') {
      const pwd  = name === 'password'        ? value : createData.password;
      const conf = name === 'confirmPassword' ? value : createData.confirmPassword;
      if (conf && pwd !== conf)
        setCreateErrors(p => ({ ...p, confirmPassword: 'Les mots de passe ne correspondent pas' }));
      else
        setCreateErrors(p => ({ ...p, confirmPassword: '' }));
    }
  };

  const validateCreate = () => {
    const e = {};
    if (!createData.nom.trim())     e.nom      = 'Le nom est requis';
    if (!createData.prenoms.trim()) e.prenoms  = 'Les prénoms sont requis';
    if (!createData.email.trim())   e.email    = "L'email est requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createData.email)) e.email = 'Email invalide';
    if (!createData.password)                       e.password        = 'Le mot de passe est requis';
    else if (createData.password.length < 6)        e.password        = 'Minimum 6 caractères';
    if (!createData.confirmPassword)                e.confirmPassword = 'Veuillez confirmer';
    else if (createData.password !== createData.confirmPassword) e.confirmPassword = 'Ne correspond pas';
    if (!createData.categorie) e.categorie = 'Sélectionner une catégorie';
    return e;
  };

  const resetCreate = () => {
    setCreateData(EMPTY_CREATE); setCreateErrors({}); setCreateNotif(null);
    setCreateAvatarFile(null); setCreatePreview(null);
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault(); setCreateNotif(null);
    const errs = validateCreate();
    if (Object.keys(errs).length) { setCreateErrors(errs); return; }
    setCreateLoading(true);
    try {
      const formPayload = new FormData();
      formPayload.append('nom',       createData.nom.trim());
      formPayload.append('prenoms',   createData.prenoms.trim());
      formPayload.append('email',     createData.email.trim());
      formPayload.append('password',  createData.password);
      formPayload.append('categorie', createData.categorie);
      if (createAvatarFile) formPayload.append('image', createAvatarFile);

      const r = await createUser(formPayload);
      if (r.success) {
        setCreateNotif({ type: 'success', message: r.message || 'Compte créé avec succès !' });
        setTimeout(() => { resetCreate(); setPanel(null); fetchUsers(); }, 1600);
      } else {
        if (r.errors) {
          const m = {};
          Object.entries(r.errors).forEach(([k, v]) => { m[k] = Array.isArray(v) ? v[0] : v; });
          setCreateErrors(m);
          setCreateNotif({ type: 'error', message: Object.values(m).join(' • ') || r.message || 'Erreur de validation' });
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
  const handleEdit = (u) => {
    setPanel('edit'); setEditUser(u);
    setFormData({ nom: u.nom || '', prenoms: u.prenoms || '', email: u.email || '', categorie: u.categorie || '' });
  };
  const handleCancelEdit = () => { setPanel(null); setEditUser(null); setFormData(EMPTY_FORM); };

  const handleSubmitInfo = async (e) => {
    e.preventDefault();
    try {
      const r = await updateUser(editUser.id, formData);
      if (r.success) {
        setTableNotif({ type: 'success', message: r.message || 'Modifié avec succès' });
        handleCancelEdit(); fetchUsers();
        if (currentUser && editUser.id === currentUser.id) {
          const updated = r.data?.user || { ...currentUser, ...formData };
          setUser(updated);
          try { localStorage.setItem('user', JSON.stringify(updated)); } catch {}
        }
      } else {
        setTableNotif({ type: 'error', message: r.error || 'Erreur de modification' });
      }
    } catch {
      setTableNotif({ type: 'error', message: 'Erreur de modification' });
    }
  };

  // ── MOT DE PASSE ─────────────────────────────────────────────────────────────
  const openPwdModal  = (u) => { setPwdTarget(u); setPwdData(EMPTY_PWD); setPwdErrors({}); setPwdModal(true); };
  const closePwdModal = ()  => { setPwdModal(false); setPwdTarget(null); setPwdData(EMPTY_PWD); setPwdErrors({}); };

  const validatePwd = () => {
    const e = {};
    if (!pwdData.oldPassword)                              e.oldPassword     = 'Ancien mot de passe requis';
    if (!pwdData.newPassword)                              e.newPassword     = 'Nouveau requis';
    else if (pwdData.newPassword.length < 6)               e.newPassword     = 'Minimum 6 caractères';
    if (pwdData.newPassword !== pwdData.confirmPassword)   e.confirmPassword = 'Ne correspond pas';
    return e;
  };

  const handleSubmitPwd = async (e) => {
    e.preventDefault();
    const errs = validatePwd();
    if (Object.keys(errs).length) { setPwdErrors(errs); return; }
    setPwdLoading(true);
    try {
      const r = await updateUser(pwdTarget.id, { oldPassword: pwdData.oldPassword, password: pwdData.newPassword });
      if (r.success) { setTableNotif({ type: 'success', message: r.message || 'Mot de passe modifié' }); closePwdModal(); }
      else setTableNotif({ type: 'error', message: r.error || 'Erreur' });
    } catch { setTableNotif({ type: 'error', message: 'Erreur réseau' }); }
    finally { setPwdLoading(false); }
  };

  // ── MOT DE PASSE OUBLIÉ ───────────────────────────────────────────────────────
  const openForgotModal  = (u) => { setForgotTarget(u); setForgotData(EMPTY_FORGOT); setForgotErrors({}); setForgotModal(true); };
  const closeForgotModal = ()  => { setForgotModal(false); setForgotTarget(null); setForgotData(EMPTY_FORGOT); setForgotErrors({}); };

  const validateForgot = () => {
    const e = {};
    if (!forgotData.newPassword)                              e.newPassword     = 'Requis';
    else if (forgotData.newPassword.length < 6)               e.newPassword     = 'Minimum 6 caractères';
    if (forgotData.newPassword !== forgotData.confirmPassword) e.confirmPassword = 'Ne correspond pas';
    return e;
  };

  const handleSubmitForgot = async (e) => {
    e.preventDefault();
    const errs = validateForgot();
    if (Object.keys(errs).length) { setForgotErrors(errs); return; }
    setForgotLoading(true);
    try {
      const r = await updateUser(forgotTarget.id, { password: forgotData.newPassword });
      if (r.success) { setTableNotif({ type: 'success', message: r.message || 'Réinitialisé' }); closeForgotModal(); }
      else setTableNotif({ type: 'error', message: r.error || 'Erreur' });
    } catch { setTableNotif({ type: 'error', message: 'Erreur réseau' }); }
    finally { setForgotLoading(false); }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDU PRINCIPAL (profil déjà géré plus haut — rendu exclusif)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
        <div className="modal-dialog modal-xl modal-dialog-scrollable">
          <div className="modal-content shadow-lg">

            <div className="modal-header text-white" style={{ backgroundColor: '#800020' }}>
              <h5 className="modal-title d-flex align-items-center gap-2"><FaUsers /> Gestion des utilisateurs</h5>
              <button type="button" className="btn-close btn-close-white" onClick={handleClose} />
            </div>

            <div className="modal-body p-4">
              <Notif type={tableNotif?.type} message={tableNotif?.message} onClose={() => setTableNotif(null)} />

              {/* ══ PANNEAU CRÉER ══ */}
              {panel === 'create' && (
                <div className="card mb-4 border-0 shadow-sm">
                  <div className="card-header text-white d-flex justify-content-between align-items-center"
                    style={{ backgroundColor: '#28a745' }}>
                    <span className="fw-bold"><FaUserPlus className="me-2" />Créer un nouveau compte</span>
                    <button className="btn btn-sm btn-light" type="button"
                      onClick={() => { setPanel(null); resetCreate(); }}><FaTimes /></button>
                  </div>
                  <div className="card-body">
                    <Notif type={createNotif?.type} message={createNotif?.message} onClose={() => setCreateNotif(null)} />
                    <form onSubmit={handleSubmitCreate} noValidate>
                      <div className="row g-3">

                        {/* Photo */}
                        <div className="col-12 mb-1">
                          <label className="form-label fw-semibold">Photo de profil</label>
                          <div className="d-flex align-items-center gap-3">
                            <div style={{
                              width: 64, height: 64, borderRadius: '50%', overflow: 'hidden',
                              backgroundColor: '#e9ecef', flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              backgroundImage: createPreview ? `url(${createPreview})` : 'none',
                              backgroundSize: 'cover', backgroundPosition: 'center',
                              fontSize: 20, fontWeight: 600, color: '#6c757d', border: '2px solid #dee2e6',
                            }}>
                              {!createPreview && (createData.prenoms || createData.nom
                                ? `${(createData.prenoms || '').charAt(0)}${(createData.nom || '').charAt(0)}`.toUpperCase()
                                : <FaUserCircle style={{ fontSize: 30, color: '#adb5bd' }} />)}
                            </div>
                            <div className="d-flex flex-column gap-1">
                              <input type="file" accept="image/jpeg,image/png,image/gif,image/webp"
                                className="form-control form-control-sm" style={{ maxWidth: 240 }}
                                disabled={createLoading}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  setCreateAvatarFile(file);
                                  setCreatePreview(URL.createObjectURL(file));
                                  e.target.value = '';
                                }} />
                              <div className="d-flex align-items-center gap-2">
                                <small className="text-muted">JPG, PNG, GIF, WebP</small>
                                {createPreview && (
                                  <button type="button" className="btn btn-sm btn-outline-danger py-0 px-2"
                                    style={{ fontSize: 11 }}
                                    onClick={() => { setCreateAvatarFile(null); setCreatePreview(null); }}>
                                    <FaTimes /> Supprimer
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="col-md-4">
                          <label className="form-label fw-semibold" style={{ fontSize: 14 }}>Nom <span className="text-danger">*</span></label>
                          <input type="text" name="nom"
                            className={`form-control${createErrors.nom ? ' is-invalid' : ''}`}
                            value={createData.nom} onChange={handleCreateChange}
                            placeholder="Saisir le nom" disabled={createLoading} />
                          {createErrors.nom && <div className="invalid-feedback">{createErrors.nom}</div>}
                        </div>
                        <div className="col-md-4">
                          <label className="form-label fw-semibold" style={{ fontSize: 14 }}>Prénoms <span className="text-danger">*</span></label>
                          <input type="text" name="prenoms"
                            className={`form-control${createErrors.prenoms ? ' is-invalid' : ''}`}
                            value={createData.prenoms} onChange={handleCreateChange}
                            placeholder="Saisir les prénoms" disabled={createLoading} />
                          {createErrors.prenoms && <div className="invalid-feedback">{createErrors.prenoms}</div>}
                        </div>
                        <div className="col-md-4">
                          <label className="form-label fw-semibold" style={{ fontSize: 14 }}>Email <span className="text-danger">*</span></label>
                          <input type="email" name="email"
                            className={`form-control${createErrors.email ? ' is-invalid' : ''}`}
                            value={createData.email} onChange={handleCreateChange}
                            placeholder="zomatel@zomatel.com" disabled={createLoading} />
                          {createErrors.email && <div className="invalid-feedback">{createErrors.email}</div>}
                        </div>
                        <div className="col-md-4">
                          <PwdInput label={<>Mot de passe <span className="text-danger">*</span></>}
                            name="pwd_c" value={createData.password}
                            onChange={(v) => handleCreateChange({ target: { name: 'password', value: v } })}
                            error={createErrors.password} />
                        </div>
                        <div className="col-md-4">
                          <PwdInput label={<>Confirmer <span className="text-danger">*</span></>}
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
                            {createLoading ? <><span className="spinner-border spinner-border-sm me-1" />Création…</> : <><FaCheck className="me-1" />Valider</>}
                          </button>
                          <button type="button" className="btn btn-secondary" disabled={createLoading}
                            onClick={() => { setPanel(null); resetCreate(); }}>
                            <FaTimes className="me-1" />Annuler
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* ══ PANNEAU ÉDITER ══ */}
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
                        {/* Photo édition */}
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
                              {!getUserImageUrl(editUser) &&
                                `${(editUser.prenoms || '').charAt(0)}${(editUser.nom || '').charAt(0)}`.toUpperCase()}
                            </div>
                            <div>
                              <input type="file" accept="image/*"
                                className="form-control form-control-sm" style={{ maxWidth: 220 }}
                                onChange={async (e) => {
                                  const f = e.target.files?.[0];
                                  if (f) {
                                    const r = await uploadUserAvatar(editUser.id, f);
                                    if (r.success) {
                                      setTableNotif({ type: 'success', message: r.message });
                                      fetchUsers();
                                      const updatedUser = r.data?.user || editUser;
                                      setEditUser(updatedUser);
                                      if (currentUser && updatedUser.id === currentUser.id) {
                                        setUser(updatedUser);
                                        try { localStorage.setItem('user', JSON.stringify(updatedUser)); } catch {}
                                      }
                                    } else { setTableNotif({ type: 'error', message: r.error }); }
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
                          <button type="button" className="btn btn-success text-white" onClick={() => openPwdModal(editUser)}>
                            <FaKey className="me-1" />Changer le mot de passe
                          </button>
                          <button type="button" className="btn btn-outline-danger" onClick={() => openForgotModal(editUser)}>
                            <FaUnlock className="me-1" />Mot de passe oublié
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Bouton créer */}
              {panel === null && (
                <div className="d-flex justify-content-end mb-3">
                  <button className="btn btn-success d-flex align-items-center gap-2" onClick={() => setPanel('create')}>
                    <FaUserPlus /> Créer un compte
                  </button>
                </div>
              )}

              {/* Tableau */}
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
                        <th>#</th><th>Photo</th><th>Nom</th><th>Prénoms</th>
                        <th>Email</th><th>Catégorie</th><th className="text-center">Actions</th>
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
                              {!getUserImageUrl(u) &&
                                `${(u.prenoms || '').charAt(0)}${(u.nom || '').charAt(0)}`.toUpperCase()}
                            </div>
                          </td>
                          <td className="fw-semibold">{u.nom}</td>
                          <td>{u.prenoms}</td>
                          <td className="text-muted small">{u.email}</td>
                          <td><span className={badgeClass(u.categorie)}>{u.categorie}</span></td>
                          <td className="text-center">
                            <button className="btn btn-sm btn-primary me-1" title="Modifier" onClick={() => handleEdit(u)}>
                              <FaPencilAlt />
                            </button>
                            <button className="btn btn-sm btn-danger" title="Supprimer" onClick={() => handleDeleteClick(u)}>
                              <FaTrashAlt />
                            </button>
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

      {/* ══ SUPPRESSION ══ */}
      <DeleteConfirmModal
        user={deleteTarget} loading={deleteLoading}
        onConfirm={handleDeleteConfirm} onCancel={handleDeleteCancel}
      />

      {/* ══ MOT DE PASSE ══ */}
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
                      {pwdLoading ? <span className="spinner-border spinner-border-sm me-1" /> : <FaCheck className="me-1" />}Confirmer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ MOT DE PASSE OUBLIÉ ══ */}
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
                      {forgotLoading ? <span className="spinner-border spinner-border-sm me-1" /> : <FaUnlock className="me-1" />}Réinitialiser
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
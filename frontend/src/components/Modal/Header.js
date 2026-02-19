"use client"
import { useEffect, useState } from "react"
import { useAuth } from "../../contexts/AuthContext"
import Zomatel from "../../images/zoma.jpeg"
import { useNavigate, Link, useLocation } from "react-router-dom"
import Notification from "../Notification"
import ManageUsersModal from '../Modal/ManageUsersModal'
import { FaSignOutAlt, FaTimes } from "react-icons/fa"

// ─── Modale confirmation déconnexion ─────────────────────────────────────────
const LogoutConfirmModal = ({ show, onConfirm, onCancel, loading, user }) => {
  if (!show) return null;

  // Initiales pour l'avatar
  const initiales = user
    ? `${(user.prenoms || '').charAt(0)}${(user.nom || '').charAt(0)}`.toUpperCase()
    : '?';

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 2000 }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 400 }}>
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16, overflow: 'hidden' }}>

          {/* ── Bandeau haut ── */}
          <div style={{
            background: 'linear-gradient(135deg, #800020 0%, #b0003a 100%)',
            padding: '28px 24px 20px',
            textAlign: 'center',
          }}>
            {/* Avatar initiales */}
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.2)',
              border: '3px solid rgba(255,255,255,0.5)',
              margin: '0 auto 12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: 1,
            }}>
              {initiales}
            </div>
            {user && (
              <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: 500 }}>
                {user.prenoms} {user.nom}
              </div>
            )}
          </div>

          {/* ── Corps ── */}
          <div className="modal-body text-center px-4 pt-4 pb-2">
            {/* Icône déconnexion */}
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              backgroundColor: '#fff3cd',
              margin: '0 auto 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FaSignOutAlt style={{ fontSize: 22, color: '#dc3545' }} />
            </div>

            <h5 className="fw-bold mb-2" style={{ color: '#2d2d2d' }}>
              Déconnexion
            </h5>
            <p className="text-muted mb-0" style={{ fontSize: 14 }}>
              Êtes-vous sûr de vouloir vous déconnecter ?
              <br />Votre session sera fermée.
            </p>
          </div>

          {/* ── Footer ── */}
          <div className="modal-footer border-0 justify-content-center gap-3 pb-4 pt-3">
            <button
              type="button"
              className="btn btn-outline-secondary px-4"
              onClick={onCancel}
              disabled={loading}
              style={{ borderRadius: 8, minWidth: 110 }}
            >
              <FaTimes className="me-1" /> Annuler
            </button>
            <button
              type="button"
              className="btn btn-danger px-4"
              onClick={onConfirm}
              disabled={loading}
              style={{ borderRadius: 8, minWidth: 110 }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status" />
                  Déconnexion…
                </>
              ) : (
                <>
                  <FaSignOutAlt className="me-1" /> Se déconnecter
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

// ─── Header ───────────────────────────────────────────────────────────────────
const Header = ({ setShowUserModal, showWeekView, setShowWeekView, handleCategoryFilter, serviceFilter = "all" }) => {
  const { user, logout } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  const [showManageUsersModal, setShowManageUsersModal] = useState(false)
  const [openWithProfil,       setOpenWithProfil]       = useState(false)

  // ── État modale déconnexion ──────────────────────────────────────────────────
  const [showLogoutModal,  setShowLogoutModal]  = useState(false)
  const [logoutLoading,    setLogoutLoading]    = useState(false)

  const openGestion = () => { setOpenWithProfil(false); setShowManageUsersModal(true) }
  const openProfil  = () => { setOpenWithProfil(true);  setShowManageUsersModal(true) }

  const handleDashboard = () => { setShowWeekView(false); navigate("/admin") }
  const handlePertes    = () => { navigate("/admin/pertes") }

  const [activeServiceFilter, setActiveServiceFilter] = useState(serviceFilter || "all")

  const activeServiceDisplay = {
    snack:   "Snack",
    resto:   "Resto",
    detente: "Détente",
    all:     "Tous les services",
  }[activeServiceFilter] || "Tous les services"

  useEffect(() => {
    if (serviceFilter && serviceFilter !== activeServiceFilter)
      setActiveServiceFilter(serviceFilter)
  }, [serviceFilter])

  const handleServiceClick = (service) => {
    setActiveServiceFilter(service)
    if (handleCategoryFilter) handleCategoryFilter(service === "all" ? "" : service)
  }

  const handleSetView = (value) => {
    if (typeof setShowWeekView === "function") setShowWeekView(value)
  }

  // ── Déconnexion ──────────────────────────────────────────────────────────────
  const handleLogoutConfirm = async () => {
    setLogoutLoading(true)
    try {
      if (logout) await logout()
      navigate("/login")
    } catch (error) {
      console.error("Erreur déconnexion:", error)
      navigate("/login")
    } finally {
      setLogoutLoading(false)
      setShowLogoutModal(false)
    }
  }

  return (
    <>
      {/* ── Modale déconnexion ── */}
      <LogoutConfirmModal
        show={showLogoutModal}
        user={user}
        loading={logoutLoading}
        onConfirm={handleLogoutConfirm}
        onCancel={() => setShowLogoutModal(false)}
      />

      {/* ── Modale gestion utilisateurs / profil ── */}
      <ManageUsersModal
        show={showManageUsersModal}
        onClose={() => setShowManageUsersModal(false)}
        showProfil={openWithProfil}
      />

      <nav className="navbar navbar-expand-lg navbar-dark fixed-top shadow" style={{ backgroundColor: "#800020" }}>
        <div className="container-fluid">
          <Link to="/admin" className="navbar-brand d-flex align-items-center text-decoration-none">
            <div className="bg-white rounded me-2 d-flex align-items-center justify-content-center"
              style={{ height: "53px", width: "80px" }}>
              <img src={Zomatel} alt="Logo Zomatel"
                style={{ maxHeight: "150%", maxWidth: "150%", objectFit: "contain", borderRadius: "6px" }} />
            </div>
            <span className="fw-semibold d-none d-md-inline">Gestion de Salle</span>
          </Link>

          <button className="navbar-toggler" type="button"
            data-bs-toggle="collapse" data-bs-target="#navbarMain"
            aria-controls="navbarMain" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarMain">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">

              {/* ── Vue ── */}
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" href="#" role="button"
                  data-bs-toggle="dropdown" aria-expanded="false">
                  <i className="bi bi-layout-text-sidebar-reverse me-1"></i>
                  Vue : {showWeekView ? "Historique" : "Dashboard"}
                </a>
                <ul className="dropdown-menu">
                  <li>
                    <button className={`dropdown-item ${location.pathname === "/admin" ? "active" : ""}`}
                      onClick={handleDashboard}>
                      <i className="bi bi-table me-2"></i>Dashboard
                    </button>
                  </li>
                  <li>
                    <button className={`dropdown-item ${showWeekView ? "active" : ""}`}
                      onClick={() => handleSetView(true)}>
                      <i className="bi bi-calendar-week me-2"></i>Historique
                    </button>
                  </li>
                  <li>
                    <button className={`dropdown-item ${location.pathname === "/admin/pertes" ? "active" : ""}`}
                      onClick={handlePertes}>
                      📉 Pertes
                    </button>
                  </li>
                </ul>
              </li>

              {/* ── Services ── */}
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle d-flex align-items-center" href="#"
                  role="button" data-bs-toggle="dropdown" aria-expanded="false">
                  <i className="bi bi-grid me-1"></i>
                  Services : <strong className="ms-1">{activeServiceDisplay}</strong>
                </a>
                <ul className="dropdown-menu">
                  {[
                    { key: "snack",   icon: "cup-straw",  label: "Snack"   },
                    { key: "resto",   icon: "egg-fried",  label: "Resto"   },
                    { key: "detente", icon: "controller", label: "Détente" },
                  ].map(({ key, icon, label }) => (
                    <li key={key}>
                      <button
                        className={`dropdown-item ${activeServiceFilter === key ? "active fw-bold" : ""}`}
                        onClick={() => handleServiceClick(key)}>
                        <i className={`bi bi-${icon} me-2`}></i>{label}
                      </button>
                    </li>
                  ))}
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className={`dropdown-item ${activeServiceFilter === "all" ? "active fw-bold" : ""}`}
                      onClick={() => handleServiceClick("all")}>
                      <i className="bi bi-arrow-repeat me-2"></i>Tous les services
                    </button>
                  </li>
                </ul>
              </li>
            </ul>

            <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-center">
              <Notification />
              <li className="nav-item d-none d-lg-block">
                <span className="nav-link px-0">|</span>
              </li>

              {/* ── Menu utilisateur ── */}
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle d-flex align-items-center" href="#"
                  role="button" data-bs-toggle="dropdown" aria-expanded="false">
                  <i className="bi bi-person-circle fs-5 me-2"></i>
                  <span className="d-none d-md-inline">
                    {user ? `${user.prenoms} ${user.nom}` : "Non connecté"}
                  </span>
                </a>
                <ul className="dropdown-menu dropdown-menu-end shadow">

                  {/* Infos utilisateur */}
                  {user && (
                    <li className="px-3 py-2 border-bottom">
                      <div className="fw-bold">{user.prenoms} {user.nom}</div>
                      <small className="text-muted text-capitalize">{user.categorie}</small>
                    </li>
                  )}

                  {/* Mon profil — tous les utilisateurs */}
                  {user && (
                    <li>
                      <button className="dropdown-item" onClick={openProfil}>
                        <i className="bi bi-person-badge me-2 text-secondary"></i>Mon profil
                      </button>
                    </li>
                  )}

                  {/* Options admin */}
                  {user?.categorie === "admin" && (
                    <>
                      <li><hr className="dropdown-divider my-1" /></li>
                      <li>
                        <button className="dropdown-item" onClick={openGestion}>
                          <i className="bi bi-people me-2 text-primary"></i>Gérer les utilisateurs
                        </button>
                      </li>
                      <li>
                        <button className="dropdown-item"
                          onClick={() => { if (typeof setShowUserModal === "function") setShowUserModal(true) }}>
                          <i className="bi bi-person-plus me-2 text-warning"></i>Créer un compte
                        </button>
                      </li>
                    </>
                  )}

                  <li><hr className="dropdown-divider" /></li>

                  {/* Déconnexion → ouvre la modale */}
                  <li>
                    <button
                      className="dropdown-item text-danger"
                      disabled={!user}
                      onClick={() => setShowLogoutModal(true)}
                    >
                      <i className="bi bi-box-arrow-right me-2"></i>Déconnexion
                    </button>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </>
  )
}

export default Header
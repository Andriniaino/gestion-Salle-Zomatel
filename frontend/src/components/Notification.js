"use client"

import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useNotifications } from "../hooks/useNotifications"
import { useAuth } from "../contexts/AuthContext"

/**
 * Composant NotificationIcon
 * 
 * Affiche une icône de notification avec un compteur de notifications non lues
 * et un dropdown avec les dernières notifications
 */
const Notification = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { unreadCount, notifications, loading, markAsRead, isConnected } = useNotifications()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)
  const [hasNewNotification, setHasNewNotification] = useState(false)

  // Écouter les nouvelles notifications pour l'animation
  useEffect(() => {
    const handleNewNotification = (event) => {
      if (event?.detail) {
        setHasNewNotification(true)
        // Réinitialiser l'animation après 2 secondes
        setTimeout(() => {
          setHasNewNotification(false)
        }, 2000)
      }
    }

    window.addEventListener("newNotificationReceived", handleNewNotification)
    return () => {
      window.removeEventListener("newNotificationReceived", handleNewNotification)
    }
  }, [])

  // Fermer le dropdown si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showDropdown])

  // Ne pas afficher pour les non-admins
  if (!user || user.categorie !== "admin") {
    return null
  }

  const handleNotificationClick = async (notification) => {
    // Marquer comme lue
    if (!notification.lu) {
      await markAsRead(notification.id)
    }

    // Naviguer vers la page de notifications
    navigate("/notifications")
    setShowDropdown(false)
  }

  const handleVoirToutes = () => {
    navigate("/notifications")
    setShowDropdown(false)
  }

  // Formater la date et l'heure
  const formatDateTime = (dateStr, timeStr) => {
    try {
      const date = new Date(`${dateStr} ${timeStr}`)
      return date.toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      return `${dateStr} ${timeStr}`
    }
  }

  // Obtenir les 3 dernières notifications non lues
  const recentNotifications = notifications
    .filter((n) => !n.lu)
    .slice(0, 3)

  return (
    <div className="nav-item dropdown me-2" ref={dropdownRef}>
      <button
        className="nav-link position-relative btn btn-link text-white p-0"
        type="button"
        onClick={() => {
          setShowDropdown(!showDropdown)
          setHasNewNotification(false)
        }}
        style={{ 
          border: "none", 
          background: "none",
          transition: "transform 0.2s ease-in-out"
        }}
        aria-expanded={showDropdown}
      >
        <i 
          className={`bi bi-bell fs-5 ${hasNewNotification ? 'animate__animated animate__tada' : ''}`}
          style={{
            animation: hasNewNotification ? 'pulse 0.5s ease-in-out' : 'none',
            transform: hasNewNotification ? 'scale(1.2)' : 'scale(1)',
            transition: 'transform 0.2s ease-in-out'
          }}
        ></i>
        {unreadCount > 0 && (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ 
              fontSize: "0.6rem",
              animation: hasNewNotification ? 'pulse 0.5s ease-in-out' : 'none'
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
        {!isConnected && (
          <span
            className="position-absolute top-0 start-0 translate-middle badge rounded-pill bg-warning"
            style={{ fontSize: "0.4rem" }}
            title="Connexion WebSocket inactive"
          >
            ⚠
          </span>
        )}
      </button>

      {showDropdown && (
        <div
          className="dropdown-menu dropdown-menu-end shadow show"
          style={{
            minWidth: "350px",
            maxHeight: "500px",
            overflowY: "auto",
            position: "absolute",
            right: 0,
            top: "100%",
            zIndex: 1050,
          }}
        >
          <div className="px-3 py-2 bg-light border-bottom">
            <div className="d-flex justify-content-between align-items-center">
              <span className="fw-bold">🔔 Notifications</span>
              {unreadCount > 0 && (
                <span className="badge bg-primary">{unreadCount} nouvelle(s)</span>
              )}
            </div>
          </div>

          <div className="px-3 py-2">
            <button
              className="btn btn-sm btn-primary w-100"
              onClick={handleVoirToutes}
            >
              <i className="bi bi-arrow-right-circle me-1"></i> Voir toutes les notifications
            </button>
          </div>

          {loading ? (
            <div className="px-3 py-3 text-center">
              <div className="spinner-border spinner-border-sm text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
            </div>
          ) : recentNotifications.length === 0 ? (
            <div className="px-3 py-3 text-center">
              <i className="bi bi-inbox text-muted fs-3 d-block mb-2"></i>
              <span className="small text-muted">Aucune nouvelle notification</span>
            </div>
          ) : (
            <>
              {recentNotifications.map((notification) => (
                <button
                  key={notification.id}
                  className="dropdown-item py-2 border-bottom"
                  onClick={() => handleNotificationClick(notification)}
                  style={{
                    whiteSpace: "normal",
                    backgroundColor: notification.lu ? "#fff" : "#FFA50033", // blanc / orange léger
                  }}
                >
                  <div className="d-flex align-items-start">
                    <i
                      className="bi bi-circle-fill text-success me-2 mt-1"
                      style={{ fontSize: "0.5rem" }}
                    ></i>
                    <div className="flex-grow-1">
                      <div className="small fw-semibold">
                        🆕 Stock mis à jour: {notification.libelle}
                      </div>
                      <div className="small text-muted">
                        Catégorie: {notification.categorie}
                      </div>
                      <div className="small text-muted">
                        Quantité ajoutée: {notification.produit} {notification.unite}
                      </div>
                      <div className="small text-muted mt-1">
                        <i className="bi bi-clock me-1"></i>
                        {formatDateTime(notification.date_ajout, notification.heure_ajout)}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}

          {recentNotifications.length > 0 && (
            <div className="px-3 py-2 border-top bg-light">
              <small className="text-muted">
                {unreadCount > 3
                  ? `Et ${unreadCount - 3} autre(s) notification(s)...`
                  : "Toutes les notifications affichées"}
              </small>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Notification

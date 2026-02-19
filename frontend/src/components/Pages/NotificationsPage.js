"use client"

import { useEffect, useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import Header from "../Modal/Header"
import CreerCompte from "../Modal/CreerCompte"
import { getNotifications, backupAndDeleteNotifications } from "../../services/notificationService"
import echo from "../../services/echo"


export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [showAll, setShowAll] = useState(false)
  const [dateDebut, setDateDebut] = useState("")
  const [dateFin, setDateFin] = useState("")
  const [showModal, setShowModal] = useState(false);
  const [clicked, setClicked] = useState(false);

  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState({ key: "date_ajout", direction: "desc" })
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showWeekView, setShowWeekView] = useState(false)
  // creer compte

  const [showUserModal, setShowUserModal] = useState(false)
  const [formDataUser, setFormDataUser] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleChangeUser = (e) => {
    const { name, value } = e.target
    setFormDataUser({ ...formDataUser, [name]: value })
  }


  const handleSubmitUser = (e) => {
    e.preventDefault()
    // Handle form submission logic here
  }

  // 🔹 Filtres service & catégorie
  const [serviceFilter, setServiceFilter] = useState("all") // resto | snack | detente | all
  const [categoryFilter] = useState("all") // boisson | salle | all
  const itemsPerPage = 10
  const navigate = useNavigate()

  // 🔹 Helpers pour extraire service / catégorie depuis le champ "categorie" (ex: "boisson/resto")
  const getServiceFromCategorie = (categorie = "") => (categorie?.split("/")?.[1] || "").toLowerCase()
  const getCategoryFromCategorie = (categorie = "") => (categorie?.split("/")?.[0] || "").toLowerCase()

  // 🔹 Gestion du filtre service depuis le Header
  const handleServiceFilter = (service) => {
    setServiceFilter(service || "all")
    setCurrentPage(1)
  }

  // 🔹 Gestion de la vue (pour le dropdown Vue)
  const handleSetView = (value) => {
    setShowWeekView(value)
    localStorage.setItem("showWeekView", JSON.stringify(value))

    if (!value) {
      // Vue Actuelle → retour au dashboard admin par défaut
      setTimeout(() => {
        navigate("/admin")
      }, 300)
    } else {
      // Vue Historique → rester sur la page de notifications
      navigate(`/notifications?view=historique`)
    }
  }

  // 🔹 Charger les préférences au démarrage (+ synchroniser avec l'URL ?view=)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const viewParam = searchParams.get("view")
    if (viewParam === "historique") {
      setShowWeekView(true)
      localStorage.setItem("showWeekView", JSON.stringify(true))
      return
    }
    if (viewParam === "actuelle") {
      setShowWeekView(false)
      localStorage.setItem("showWeekView", JSON.stringify(false))
      return
    }
    // fallback: préférence stockée
    const savedView = localStorage.getItem("showWeekView")
    if (savedView) {
      setShowWeekView(JSON.parse(savedView))
    }
  }, [])

  // 🔹 Charger les notifications depuis la base de données
  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("🔄 Tentative de chargement des notifications...")

      const result = await getNotifications()

      if (result.success) {
        const notificationsData = Array.isArray(result.data) ? result.data : []
        console.log("✅ Données reçues")
        console.log("📊 Nombre de notifications:", notificationsData.length)
        setNotifications(notificationsData)
      } else {
        throw new Error(result.error || "Erreur lors du chargement des notifications")
      }
    } catch (error) {
      console.error("❌ Erreur finale:", error)
      const errorMessage = error.message || "Impossible de charger les notifications"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // 🔹 Charger au démarrage et écouter les notifications en temps réel via WebSocket
  useEffect(() => {
    fetchNotifications()

    // Connexion au canal WebSocket pour les notifications
    const channel = echo.channel("notifications")

    // Écouter l'événement "notification.created" depuis Laravel
    channel.listen(".notification.created", (notificationData) => {
      console.log("📩 Nouvelle notification reçue en temps réel :", notificationData)

      if (notificationData) {
        const notifService = getServiceFromCategorie(notificationData.categorie)
        const notifCategory = getCategoryFromCategorie(notificationData.categorie)

        // ✅ N'ajoute que les notifications correspondant aux filtres actifs
        if (
          (serviceFilter === "all" || notifService === serviceFilter) &&
          (categoryFilter === "all" || notifCategory === categoryFilter)
        ) {
          setNotifications((prev) => [notificationData, ...prev])
        }
      }
    })

    // Nettoyer les écouteurs lors du démontage
    return () => {
      channel.stopListening(".notification.created")
      echo.leave("notifications")
    }
  }, [serviceFilter, categoryFilter])

  // 🔹 Recharger quand showAll change
  useEffect(() => {
    fetchNotifications()
  }, [showAll, serviceFilter, categoryFilter])

  // 🔹 CORRECTION : Initialiser avec la date d'aujourd'hui uniquement
  useEffect(() => {
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, "0")
    const dd = String(today.getDate()).padStart(2, "0")
    const formatted = `${yyyy}-${mm}-${dd}`

    // ✅ INITIALISER UNIQUEMENT AVEC AUJOURD'HUI
    setDateDebut(formatted)
    setDateFin(formatted)
  }, [])

  // 🔹 Ajuster la période quand on bascule de vue (Actuelle vs Historique)
  useEffect(() => {
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, "0")
    const dd = String(today.getDate()).padStart(2, "0")
    const formatted = `${yyyy}-${mm}-${dd}`

    if (!showWeekView) {
      // Vue actuelle → uniquement aujourd'hui
      setDateDebut(formatted)
      setDateFin(formatted)
    } else {
      // Vue historique → on laisse l'utilisateur choisir, par défaut 30 derniers jours
      const past = new Date()
      past.setDate(past.getDate() - 30)
      const pastStr = `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, "0")}-${String(past.getDate()).padStart(2, "0")}`
      setDateDebut(pastStr)
      setDateFin(formatted)
    }
  }, [showWeekView])

  // 🔹 CORRECTION : Fonction robuste pour parser les dates
  const parseDate = (dateString) => {
    if (!dateString) return null

    try {
      let date

      // Format PostgreSQL standard: "2024-01-15"
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        date = new Date(dateString)
      }
      // Format avec timestamp: "2024-01-15T10:30:00.000Z"
      else if (dateString.match(/^\d{4}-\d{2}-\d{2}T/)) {
        date = new Date(dateString)
      }
      // Format français: "15/01/2024"
      else if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [day, month, year] = dateString.split("/")
        date = new Date(`${year}-${month}-${day}`)
      }
      // Autres formats
      else {
        date = new Date(dateString)
      }

      return isNaN(date.getTime()) ? null : date
    } catch (error) {
      console.error("❌ Erreur parsing date:", dateString, error)
      return null
    }
  }

  // 🔹 CORRECTION : Filtrer selon la période (version corrigée)
  const filtered = useMemo(() => {
    console.log("🔍 Début du filtrage...", {
      dateDebut,
      dateFin,
      searchTerm,
      totalNotifications: notifications.length,
      serviceFilter,
      categoryFilter,
    })

    const result = notifications.filter((n) => {
      if (!n.date_ajout) return false
      const notifService = getServiceFromCategorie(n.categorie)
      const notifCategory = getCategoryFromCategorie(n.categorie)

      if (serviceFilter !== "all" && notifService !== serviceFilter) return false
      if (categoryFilter !== "all" && notifCategory !== categoryFilter) return false

      // 🔹 Recherche globale (catégorie, libellé, quantité, unité)
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase().trim()
        const categorieMatch = (n.categorie || "").toLowerCase().includes(searchLower)
        const libelleMatch = (n.libelle || "").toLowerCase().includes(searchLower)
        const quantiteMatch = String(n.produit || "").includes(searchLower)
        const uniteMatch = (n.unite || "").toLowerCase().includes(searchLower)

        if (!categorieMatch && !libelleMatch && !quantiteMatch && !uniteMatch) {
          return false
        }
      }

      try {
        const dateNotif = parseDate(n.date_ajout)
        if (!dateNotif) {
          console.log("❌ Date invalide:", n.date_ajout)
          return false
        }

        const dateD = parseDate(dateDebut)
        const dateF = parseDate(dateFin)

        // ✅ CORRECTION : Normaliser les dates à minuit pour la comparaison
        const notifDate = new Date(dateNotif)
        notifDate.setHours(0, 0, 0, 0)

        const startDate = dateD ? new Date(dateD) : null
        if (startDate) startDate.setHours(0, 0, 0, 0)

        const endDate = dateF ? new Date(dateF) : null
        if (endDate) endDate.setHours(23, 59, 59, 999) // ✅ Jusqu'à la fin de la journée

        console.log("📊 Comparaison dates:", {
          notification: n.date_ajout,
          notifDate: notifDate.toISOString(),
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
          libelle: n.libelle,
        })

        // Filtrage par date début
        if (startDate && notifDate < startDate) {
          return false
        }

        // Filtrage par date fin
        if (endDate && notifDate > endDate) {
          return false
        }

        // Filtrage par statut (lu/non lu)
        return showAll ? true : !n.lu
      } catch (error) {
        console.error("❌ Erreur filtre date:", error, n)
        return false
      }
    })

    console.log("✅ Filtrage terminé:", {
      notificationsTotal: notifications.length,
      notificationsFiltrees: result.length,
      periode: `${dateDebut} à ${dateFin}`,
    })

    return result
  }, [notifications, dateDebut, dateFin, searchTerm, showAll, serviceFilter, categoryFilter])

  // 🔹 CORRECTION : Fonction robuste pour formater la date en français
  const formatDateFR = (dateString) => {
    if (!dateString) return "-"

    try {
      const date = parseDate(dateString)
      if (!date) return dateString

      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch (error) {
      console.error("❌ Erreur formatage date:", dateString, error)
      return dateString
    }
  }

  // 🔹 Fonction pour formater l'heure (HH:MM)
  const formatTime = (timeString) => {
    if (!timeString) return "-"

    try {
      if (typeof timeString === "string") {
        return timeString.substring(0, 5)
      }
      return String(timeString).substring(0, 5)
    } catch (error) {
      console.error("❌ Erreur formatage heure:", timeString, error)
      return "-"
    }
  }

  // 🔹 Tri amélioré avec gestion robuste des dates
  const sortedData = useMemo(() => {
    const sortable = [...filtered]
    if (sortConfig.key) {
      sortable.sort((a, b) => {
        const aValue = a[sortConfig.key] || ""
        const bValue = b[sortConfig.key] || ""

        if (sortConfig.key === "date_ajout") {
          const dateA = parseDate(aValue) || new Date(0)
          const dateB = parseDate(bValue) || new Date(0)
          return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA
        }

        if (sortConfig.key === "heure_ajout") {
          const timeA = aValue || ""
          const timeB = bValue || ""
          return sortConfig.direction === "asc" ? timeA.localeCompare(timeB) : timeB.localeCompare(timeA)
        }

        if (!isNaN(Number.parseFloat(aValue)) && !isNaN(Number.parseFloat(bValue))) {
          const numA = Number.parseFloat(aValue) || 0
          const numB = Number.parseFloat(bValue) || 0
          return sortConfig.direction === "asc" ? numA - numB : numB - numA
        }

        return sortConfig.direction === "asc"
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue))
      })
    }
    return sortable
  }, [filtered, sortConfig])

  // 🔹 Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage)
  const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const requestSort = (key) => {
    let direction = "asc"
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }


  // 🔹 CORRECTION : Bouton pour afficher toutes les dates
  const handleShowAllDates = () => {
    setDateDebut("")
    setDateFin("")
    console.log("📅 Affichage de toutes les dates")
  }

  const serviceOptions = [
    { value: "all", label: "Tous les services" },
    { value: "snack", label: "Snack" },
    { value: "resto", label: "Resto" },
    { value: "detente", label: "Détente" },
  ]

  const categoryOptions = useMemo(() => {
    const uniques = new Set(notifications.map((n) => getCategoryFromCategorie(n.categorie)).filter((c) => c))
    return ["all", ...uniques]
  }, [notifications])

  if (loading) {
    return (
      <div className="container-fluid mt-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "50vh" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <span className="ms-2">Chargement des notifications...</span>
        </div>
      </div>
    )
  }

  const handleBackupDelete = async () => {
    setLoading(true);

    await backupAndDeleteNotifications();

    setLoading(false);
    setShowModal(false);

    fetchNotifications(); // refresh auto silencieux
  };

  return (
    <div className="container-fluid p-4">
      <div>

        <div className="col-12 col-md-9 col-lg-10 p-4">
          <Header
            setShowUserModal={setShowUserModal}
            showWeekView={showWeekView}
            setShowWeekView={handleSetView}
            handleCategoryFilter={handleServiceFilter}
            serviceFilter={serviceFilter}
            layout="sidebar"
          />
        </div>
        <div className="card mb-3">
          <div className="card-body">
            <div className="d-flex align-items gap-5 flex-wrap">
              <div className="d-flex align-items gap-2" style={{ flex: "0 0 70px", minWidth: "300px" }}>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder=" Recherche :Catégorie, libellé, quantité, unité..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                />
              </div>

              {/* 📅 DATE DE DÉBUT */}
              <div className="d-flex align-items-center gap-2">
                <label className="fw-bold text-black mb-0">Du :</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  style={{ width: "150px" }}
                  value={dateDebut}
                  onChange={(e) => {
                    const newDebut = e.target.value
                    setDateDebut(newDebut)

                    // ⚠️ Si la date de fin devient inférieure à la date de début → ajuster automatiquement
                    if (dateFin && newDebut && dateFin < newDebut) {
                      setDateFin(newDebut)
                    }

                    setCurrentPage(1)
                  }}
                />
              </div>

              {/* 📅 DATE DE FIN (≥ date début) */}
              <div className="d-flex align-items-center gap-2">
                <label className="fw-bold text-black mb-0">Au :</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  style={{ width: "150px" }}
                  value={dateFin}
                  min={dateDebut || undefined}
                  disabled={!dateDebut}
                  title={!dateDebut ? "Sélectionnez d'abord la date de début" : "La date de fin doit être supérieure ou égale à la date de début"}
                  onChange={(e) => {
                    const newFin = e.target.value

                    // 🔒 Sécurité : la date de fin ne doit JAMAIS être inférieure à la date de début
                    if (dateDebut && newFin < dateDebut) {
                      setDateFin(dateDebut)
                      return
                    }

                    setDateFin(newFin)
                    setCurrentPage(1)
                  }}
                />
                <button
                  className="btn btn-outline-success btn-sm"
                  onClick={() => {
                    const today = new Date().toISOString().split("T")[0]
                    setDateDebut(today)
                    setDateFin(today)
                    setCurrentPage(1)
                  }}
                >
                  📅 Aujourd’hui
                </button>
                <button
                  className="btn btn-outline-success btn-sm"
                  onClick={() => {
                    setDateDebut("")
                    setDateFin("")
                    setCurrentPage(1)
                  }}
                >
                  📆 Toutes dates
                </button>
                <button
                  className={`btn btn-sm ${showAll ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => {
                    setShowAll(!showAll)
                    setCurrentPage(1)
                  }}
                  title={showAll ? "Masquer les notifications lues" : "Afficher toutes les notifications (lues et non lues)"}
                >
                  {showAll ? "📖 Toutes" : "📕 Non lues"}
                </button>

              </div>

              {/* 🔘 Boutons rapides */}
              <div className="d-flex gap-2">
                
                {/* ✅ NOUVEAU BOUTON : Afficher lues/non lues */}
                
                <button
                  className={`btn btn-sm ${clicked ? "btn-danger" : "btn-outline-danger"}`}
                  onClick={() => {
                    setClicked(true);
                    setShowModal(true);
                  }}>
                  Effacer tous
                </button>

                {/* ℹ️ Affichage période */}
                <span className="text-muted small">
                  {dateDebut && dateFin
                    ? `Période : ${formatDateFR(dateDebut)} → ${formatDateFR(dateFin)}`
                    : "Toutes les dates affichées"}
                </span>
                {/* 🪟 MODAL */}
                {showModal && (
                  <div className="modal fade show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                      <div className="modal-content">
                        <div className="modal-header">
                          <h5 className="modal-title">Confirmation</h5>
                          <button
                            className="btn-close"
                            onClick={() => setShowModal(false)}
                          ></button>
                        </div>
                        <div className="modal-body">
                          Voulez-vous sauvegarder puis supprimer toutes les notifications ?
                        </div>
                        <div className="modal-footer">
                          <button
                            className="btn btn-secondary"
                            onClick={() => setShowModal(false)}
                          >
                            Annuler
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={handleBackupDelete}
                            disabled={loading}
                          >
                            {loading ? "Traitement..." : "OK"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Tableau des notifications */}
        <div className="table-responsive p-0 m-0 w-100">
          <table className="table table-hover table-bordered bg-white m-0 w-100">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th onClick={() => requestSort("categorie")} style={{ cursor: "pointer" }}>
                  Catégorie {sortConfig.key === "categorie" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th onClick={() => requestSort("libelle")} style={{ cursor: "pointer" }}>
                  Libellé {sortConfig.key === "libelle" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th onClick={() => requestSort("produit")} style={{ cursor: "pointer" }}>
                  Quantité {sortConfig.key === "produit" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th onClick={() => requestSort("unite")} style={{ cursor: "pointer" }}>
                  Unité {sortConfig.key === "unite" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th onClick={() => requestSort("prix")} style={{ cursor: "pointer" }}>
                  Prix {sortConfig.key === "prix" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th onClick={() => requestSort("date_ajout")} style={{ cursor: "pointer" }}>
                  Date {sortConfig.key === "date_ajout" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th onClick={() => requestSort("heure_ajout")} style={{ cursor: "pointer" }}>
                  Heure {sortConfig.key === "heure_ajout" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th onClick={() => requestSort("lu")} style={{ cursor: "pointer", width: "100px" }}>
                  Statut {sortConfig.key === "lu" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center text-muted py-4">
                    {notifications.length === 0
                      ? "Aucune notification disponible"
                      : `Aucune notification ${showAll ? "" : "non lue"} pour la période ${formatDateFR(
                        dateDebut,
                      )} - ${formatDateFR(dateFin)}`}
                  </td>
                </tr>
              ) : (
                paginatedData.map((n, index) => (
                  <tr key={n.id || index} className={!n.lu ? "table-warning" : ""}>
                    <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td>{n.categorie || "-"}</td>
                    <td className="fw-bold">{n.libelle || "-"}</td>
                    <td>
                      <span
                        className={
                          n.produit > 0 ? "text-success fw-bold" : n.produit < 0 ? "text-danger fw-bold" : ""
                        }
                      >
                        {n.produit > 0 ? "+" : ""}
                        {n.produit || "0"}
                      </span>
                    </td>
                    <td>{n.unite || "-"}</td>
                    <td>{n.prix ? `${Number.parseFloat(n.prix).toLocaleString("fr-FR")} Ar` : "-"}</td>
                    <td>{formatDateFR(n.date_ajout)}</td>
                    <td>{formatTime(n.heure_ajout)}</td>
                    <td>
                      <span
                        className={`badge ${n.lu ? "bg-success" : "bg-warning text-dark"}`}
                        style={{
                          padding: "6px 12px",
                          fontSize: "12px",
                          fontWeight: "600",
                          minWidth: "70px",
                          textAlign: "center",
                          display: "inline-block",
                        }}
                      >
                        {n.lu ? "✓ Lue" : "● Non lue"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination simple Suivant / Précédent */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-2">
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={currentPage === 1}
              onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
            >
              ◀️ Précédent
            </button>
            <span className="text-muted small">
              Page {currentPage} / {totalPages} —{" "}
              {sortedData.length} notification{sortedData.length > 1 ? "s" : ""}
            </span>
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={currentPage === totalPages}
              onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
            >
              Suivant ▶️
            </button>
          </div>
        )}
        {/* Ancien Header en doublon supprimé */}
        <CreerCompte
          showUserModal={showUserModal}
          setShowUserModal={setShowUserModal}
          formDataUser={formDataUser}
          handleChangeUser={handleChangeUser}
          handleSubmitUser={handleSubmitUser}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          showConfirmPassword={showConfirmPassword}
          setShowConfirmPassword={setShowConfirmPassword}
        />
      </div>
    </div>
  )
}

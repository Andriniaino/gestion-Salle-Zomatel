import { useEffect, useState, useMemo, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import Header from "../Modal/Header"
import CreerCompte from "../Modal/CreerCompte"
import { getNotifications, backupAndDeleteNotifications, markNotificationAsRead } from "../../services/notificationService"
import echo from "../../services/echo"
import ToastNotification, { useToast } from "../Toastnotification"

export default function NotificationsPage() {

  const { toast, showToast, clearToast } = useToast()

  const [notifications, setNotifications] = useState([])
  const [showAll, setShowAll] = useState(false)
  const [dateDebut, setDateDebut] = useState("")
  const [dateFin, setDateFin] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [clicked, setClicked] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState({ key: "date_ajout", direction: "desc" })
  const [loading, setLoading] = useState(true)
  const [showWeekView, setShowWeekView] = useState(false)

  const processingIds = useRef(new Set())

  // ─── DataTables refs ──────────────────────────────────────────────────────
  const tableRef     = useRef(null)
  const dtRef        = useRef(null)
  const handleRowRef = useRef(null)   // handler courant accessible depuis jQuery

  const [showUserModal, setShowUserModal] = useState(false)
  const [formDataUser, setFormDataUser] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleChangeUser = (e) => {
    const { name, value } = e.target
    setFormDataUser({ ...formDataUser, [name]: value })
  }
  const handleSubmitUser = (e) => { e.preventDefault() }

  const [serviceFilter, setServiceFilter] = useState("all")
  const [categoryFilter] = useState("all")
  const navigate = useNavigate()

  const getServiceFromCategorie  = (categorie = "") => (categorie?.split("/")?.[1] || "").toLowerCase()
  const getCategoryFromCategorie = (categorie = "") => (categorie?.split("/")?.[0] || "").toLowerCase()

  const getTodayStr = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  }

  const handleServiceFilter = (service) => setServiceFilter(service || "all")

  const handleSetView = (value) => {
    setShowWeekView(value)
    localStorage.setItem("showWeekView", JSON.stringify(value))
    if (!value) setTimeout(() => navigate("/admin"), 300)
    else navigate(`/notifications?view=historique`)
  }

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const viewParam = searchParams.get("view")
    if (viewParam === "historique") { setShowWeekView(true); localStorage.setItem("showWeekView", JSON.stringify(true)); return }
    if (viewParam === "actuelle")   { setShowWeekView(false); localStorage.setItem("showWeekView", JSON.stringify(false)); return }
    const savedView = localStorage.getItem("showWeekView")
    if (savedView) setShowWeekView(JSON.parse(savedView))
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const result = await getNotifications()
      if (result.success) {
        const data = Array.isArray(result.data) ? result.data : []
        setNotifications(data.map((n) => ({ ...n, lu: Boolean(n.lu) })))
      } else {
        throw new Error(result.error || "Erreur chargement")
      }
    } catch (err) {
      console.error("❌ fetchNotifications:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    const channel = echo.channel("notifications")
    channel.listen(".notification.created", (notificationData) => {
      if (!notificationData) return
      const notifService  = getServiceFromCategorie(notificationData.categorie)
      const notifCategory = getCategoryFromCategorie(notificationData.categorie)
      if (
        (serviceFilter === "all" || notifService === serviceFilter) &&
        (categoryFilter === "all" || notifCategory === categoryFilter)
      ) {
        setNotifications((prev) => [{ ...notificationData, lu: false }, ...prev])
      }
    })
    return () => { channel.stopListening(".notification.created"); echo.leave("notifications") }
  }, [serviceFilter, categoryFilter]) // eslint-disable-line

  useEffect(() => { fetchNotifications() }, [serviceFilter, categoryFilter]) // eslint-disable-line

  useEffect(() => {
    const today = getTodayStr(); setDateDebut(today); setDateFin(today)
  }, [])

  useEffect(() => {
    const today = getTodayStr()
    if (!showWeekView) {
      setDateDebut(today); setDateFin(today)
    } else {
      const past = new Date(); past.setDate(past.getDate() - 30)
      const pastStr = `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, "0")}-${String(past.getDate()).padStart(2, "0")}`
      setDateDebut(pastStr); setDateFin(today)
    }
  }, [showWeekView])

  // ✅ useCallback pour stabiliser la référence du handler
  const handleRowClick = useCallback(async (notification) => {
    if (notification.lu) return
    if (processingIds.current.has(notification.id)) return
    processingIds.current.add(notification.id)

    setNotifications((prev) => prev.map((n) => n.id === notification.id ? { ...n, lu: true } : n))

    try {
      const result = await markNotificationAsRead(notification.id)
      if (!result || !result.success) {
        setNotifications((prev) => prev.map((n) => n.id === notification.id ? { ...n, lu: false } : n))
      } else {
        window.dispatchEvent(new CustomEvent("notificationMarkedAsRead", { detail: { id: notification.id } }))
      }
    } catch (err) {
      console.error("❌ Erreur réseau, rollback:", err)
      setNotifications((prev) => prev.map((n) => n.id === notification.id ? { ...n, lu: false } : n))
    } finally {
      processingIds.current.delete(notification.id)
    }
  }, [])

  const parseDate = (dateString) => {
    if (!dateString) return null
    try {
      let date
      if (typeof dateString === "string" && dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [day, month, year] = dateString.split("/")
        date = new Date(`${year}-${month}-${day}`)
      } else {
        date = new Date(dateString)
      }
      return isNaN(date.getTime()) ? null : date
    } catch { return null }
  }

  const formatDateFR = (dateString) => {
    if (!dateString) return "-"
    const date = parseDate(dateString)
    if (!date) return dateString
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  const formatTime = (timeString) => {
    if (!timeString) return "-"
    return String(timeString).substring(0, 5)
  }

  const handleBackupDelete = async () => {
    setLoading(true)
    try {
      await backupAndDeleteNotifications()
      setShowModal(false); setClicked(false)
      await fetchNotifications()
      showToast("Toutes les notifications ont été supprimées avec succès !", "success")
    } catch (err) {
      console.error("❌ Erreur suppression:", err)
      setShowModal(false); setClicked(false)
      showToast("Erreur lors de la suppression des notifications.", "error")
    } finally {
      setLoading(false)
    }
  }

  // ─── Données filtrées + triées — INCHANGÉES ───────────────────────────────
  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (!n.date_ajout) return false
      if (serviceFilter !== "all" && getServiceFromCategorie(n.categorie) !== serviceFilter) return false
      if (categoryFilter !== "all" && getCategoryFromCategorie(n.categorie) !== categoryFilter) return false
      if (!showAll && n.lu === true) return false
      if (searchTerm.trim()) {
        const s = searchTerm.toLowerCase().trim()
        const match =
          (n.categorie || "").toLowerCase().includes(s) ||
          (n.libelle || "").toLowerCase().includes(s) ||
          String(n.produit || "").includes(s) ||
          (n.unite || "").toLowerCase().includes(s)
        if (!match) return false
      }
      try {
        const notifDate = parseDate(n.date_ajout)
        if (!notifDate) return false
        notifDate.setHours(0, 0, 0, 0)
        if (dateDebut) {
          const start = parseDate(dateDebut)
          if (start) { start.setHours(0, 0, 0, 0); if (notifDate < start) return false }
        }
        if (dateFin) {
          const end = parseDate(dateFin)
          if (end) { end.setHours(23, 59, 59, 999); if (notifDate > end) return false }
        }
      } catch { return false }
      return true
    })
  }, [notifications, dateDebut, dateFin, searchTerm, showAll, serviceFilter, categoryFilter])

  const sortedData = useMemo(() => {
    const sortable = [...filtered]
    if (!sortConfig.key) return sortable
    sortable.sort((a, b) => {
      const aVal = a[sortConfig.key] || ""
      const bVal = b[sortConfig.key] || ""
      if (sortConfig.key === "date_ajout") {
        const dA = parseDate(aVal) || new Date(0)
        const dB = parseDate(bVal) || new Date(0)
        return sortConfig.direction === "asc" ? dA - dB : dB - dA
      }
      if (!isNaN(parseFloat(aVal)) && !isNaN(parseFloat(bVal))) {
        return sortConfig.direction === "asc" ? parseFloat(aVal) - parseFloat(bVal) : parseFloat(bVal) - parseFloat(aVal)
      }
      return sortConfig.direction === "asc" ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal))
    })
    return sortable
  }, [filtered, sortConfig])

  const requestSort = (key) => {
    setSortConfig((prev) => ({ key, direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc" }))
  }

  const unreadCount = notifications.filter((n) => !n.lu).length

  // ─── DataTables : tbody VIDE, lignes injectées via jQuery data ────────────
  // Évite le conflit insertBefore/removeChild entre React et DataTables
  useEffect(() => {
    if (!tableRef.current || !window.$) return
    const $ = window.$

    // Toujours mettre à jour le ref du handler courant (closure fraîche)
    handleRowRef.current = handleRowClick

    // Détruire proprement
    if (dtRef.current) {
      $(tableRef.current).off("click", ".dt-row-click")
      dtRef.current.destroy()
      dtRef.current = null
      $(tableRef.current).find("tbody").empty()
    }

    // Construire les lignes pour DataTables
    const rows = sortedData.map((n, index) => {
      const isRead     = n.lu === true
      const rowStyle   = isRead
        ? "background-color:#ffffff;cursor:default;"
        : "background-color:#fff3cd;cursor:pointer;"
      const badgeClass = isRead ? "bg-success" : "bg-warning text-dark"
      const badgeTxt   = isRead ? "✓ Lue" : "● Non lue"
      const produitCss = n.produit > 0 ? "color:green;font-weight:bold"
        : n.produit < 0 ? "color:red;font-weight:bold" : ""
      const produitTxt = `${n.produit > 0 ? "+" : ""}${n.produit || "0"}`
      const prixTxt    = n.prix ? `${parseFloat(n.prix).toLocaleString("fr-FR")} Ar` : "-"
      // Sérialiser la notif entière pour la récupérer au clic
      const encoded    = encodeURIComponent(JSON.stringify(n))

      return [
        index + 1,
        `<span class="dt-row-click" data-notif="${encoded}" style="${rowStyle};display:block">${n.categorie || "-"}</span>`,
        `<strong class="dt-row-click" data-notif="${encoded}" style="${rowStyle}">${n.libelle || "-"}</strong>`,
        `<span class="dt-row-click" data-notif="${encoded}" style="${rowStyle};${produitCss}">${produitTxt}</span>`,
        `<span class="dt-row-click" data-notif="${encoded}" style="${rowStyle}">${n.unite || "-"}</span>`,
        `<span class="dt-row-click" data-notif="${encoded}" style="${rowStyle}">${prixTxt}</span>`,
        `<span class="dt-row-click" data-notif="${encoded}" style="${rowStyle}">${formatDateFR(n.date_ajout)}</span>`,
        `<span class="dt-row-click" data-notif="${encoded}" style="${rowStyle}">${formatTime(n.heure_ajout)}</span>`,
        `<span class="badge ${badgeClass} dt-row-click" data-notif="${encoded}" style="padding:6px 12px;font-size:12px;font-weight:600;min-width:80px;text-align:center;display:inline-block">${badgeTxt}</span>`,
      ]
    })

    dtRef.current = $(tableRef.current).DataTable({
      data: rows,
      order: [],
      pageLength: 10,
      lengthMenu: [5, 10, 25, 50, 100],
      retrieve: true,
      ordering: false,   // tri géré par React (sortedData)
      searching: false,  // recherche gérée par React (filtered)
      language: {
        lengthMenu: "Afficher _MENU_ lignes",
        info:       "Affichage de _START_ à _END_ sur _TOTAL_ entrées",
        paginate: {
          first:    "Premier",
          last:     "Dernier",
          next:     "Suivant ➡",
          previous: "⬅ Précédent",
        },
        zeroRecords: "Aucune notification trouvée.",
      },
      columnDefs: [{ orderable: false, targets: "_all" }],
      // Colorer les lignes selon statut lu/non-lu
      createdRow: function(row, data, dataIndex) {
        const notif = sortedData[dataIndex]
        if (notif && !notif.lu) {
          $(row).css({ "background-color": "#fff3cd", "cursor": "pointer" })
          $(row).hover(
            function() { $(this).css("background-color", "#ffe69c") },
            function() { $(this).css("background-color", "#fff3cd") }
          )
        } else {
          $(row).css({ "background-color": "#ffffff", "cursor": "default" })
        }
      },
    })

    // ✅ Délégation du clic — appelle handleRowRef.current (toujours à jour)
    $(tableRef.current).on("click", ".dt-row-click", function () {
      try {
        const notif = JSON.parse(decodeURIComponent($(this).attr("data-notif")))
        if (handleRowRef.current) handleRowRef.current(notif)
      } catch (e) { console.error("Erreur parsing notif:", e) }
    })

    return () => {
      if (dtRef.current) {
        $(tableRef.current).off("click", ".dt-row-click")
        dtRef.current.destroy()
        dtRef.current = null
      }
    }
  }, [sortedData]) // eslint-disable-line

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

  return (
    <div className="container-fluid p-4">

      <ToastNotification toast={toast} onClose={clearToast} duration={2000} />

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

        {/* ── FILTRES — INCHANGÉS ── */}
        <div className="card mb-3">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">

              {/* Filtres dates + boutons — à gauche */}
              <div className="d-flex align-items-center gap-2 flex-wrap">

                <div className="d-flex align-items-center gap-1">
                  <label className="fw-bold text-black mb-0">Du :</label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    style={{ width: "150px" }}
                    value={dateDebut}
                    onChange={(e) => {
                      const v = e.target.value
                      setDateDebut(v)
                      if (dateFin && v && dateFin < v) setDateFin(v)
                    }}
                  />
                </div>

                <div className="d-flex align-items-center gap-1">
                  <label className="fw-bold text-black mb-0">Au :</label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    style={{ width: "150px" }}
                    value={dateFin}
                    min={dateDebut || undefined}
                    disabled={!dateDebut}
                    onChange={(e) => {
                      const v = e.target.value
                      if (dateDebut && v < dateDebut) { setDateFin(dateDebut); return }
                      setDateFin(v)
                    }}
                  />
                </div>

                <button className="btn btn-outline-success btn-sm" onClick={() => {
                  const today = getTodayStr(); setDateDebut(today); setDateFin(today)
                }}>📅 Aujourd'hui</button>

                <button className="btn btn-outline-success btn-sm" onClick={() => {
                  setDateDebut(""); setDateFin("")
                }}>📆 Toutes dates</button>

                <button
                  className={`btn btn-sm ${showAll ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => setShowAll((prev) => !prev)}
                >
                  {showAll
                    ? `📖 Toutes (${notifications.length})`
                    : `📕 Non lues${unreadCount > 0 ? ` (${unreadCount})` : ""}`
                  }
                </button>

                <span className="text-muted small">
                  {dateDebut && dateFin
                    ? `Période : ${formatDateFR(dateDebut)} → ${formatDateFR(dateFin)}`
                    : "Toutes les dates affichées"}
                </span>
              </div>

              {/* Bouton Effacer tous — à droite sur la même ligne */}
              <div className="d-flex align-items-center">
                <button
                  className={`btn btn-sm ${clicked ? "btn-danger" : "btn-outline-danger"}`}
                  onClick={() => { setClicked(true); setShowModal(true) }}
                >
                  Effacer tous
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* ── MODAL CONFIRMATION SUPPRESSION — INCHANGÉ ── */}
        {showModal && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "16px", overflow: "hidden" }}>
                <div className="modal-header border-0" style={{ background: "linear-gradient(135deg, #d63031, #e17055)", padding: "20px 24px" }}>
                  <div className="d-flex align-items-center gap-2">
                    <span style={{ fontSize: "24px" }}>🗑️</span>
                    <h5 className="modal-title text-white fw-bold mb-0">Effacer toutes les notifications</h5>
                  </div>
                  <button type="button" className="btn-close btn-close-white" onClick={() => { setShowModal(false); setClicked(false) }}></button>
                </div>
                <div className="modal-body" style={{ padding: "28px 24px 20px" }}>
                  <div className="text-center mb-3">
                    <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(214,48,49,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", fontSize: "32px" }}>⚠️</div>
                  </div>
                  <p className="text-center fw-bold mb-2" style={{ fontSize: "16px", color: "#d63031" }}>
                    Voulez-vous sauvegarder puis supprimer toutes les notifications ?
                  </p>
                  <p className="text-center mb-0" style={{ fontSize: "13px", color: "#c0392b", background: "rgba(214,48,49,0.08)", borderRadius: "8px", padding: "10px 16px", border: "1px solid rgba(214,48,49,0.2)" }}>
                    🚫 <strong>Cette action est irréversible.</strong><br />
                    Toutes les notifications seront définitivement supprimées.
                  </p>
                </div>
                <div className="modal-footer border-0" style={{ padding: "0 24px 24px", gap: "10px" }}>
                  <button className="btn btn-outline-secondary" onClick={() => { setShowModal(false); setClicked(false) }} style={{ borderRadius: "10px", padding: "8px 20px", flex: 1 }}>Annuler</button>
                  <button className="btn btn-danger" onClick={handleBackupDelete} disabled={loading} style={{ borderRadius: "10px", padding: "8px 20px", flex: 1, background: "linear-gradient(135deg, #d63031, #c0392b)", border: "none", fontWeight: "600" }}>
                    {loading ? "Traitement..." : "🗑️ Confirmer"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── LÉGENDE — INCHANGÉE ── */}
        <div className="d-flex gap-4 mb-2 ps-1 align-items-center">
          <span className="small text-muted d-flex align-items-center gap-2">
            <span style={{ display: "inline-block", width: 14, height: 14, backgroundColor: "#fff3cd", border: "1px solid #ffc107", borderRadius: 3 }}></span>
            <strong>Non lue</strong>
          </span>
          <span className="small text-muted d-flex align-items-center gap-2">
            <span style={{ display: "inline-block", width: 14, height: 14, backgroundColor: "#fff", border: "1px solid #dee2e6", borderRadius: 3 }}></span>
            <strong>Lue</strong>
          </span>
          {unreadCount > 0 && (
            <span className="badge bg-warning text-dark">
              {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* ── BARRE DE RECHERCHE au-dessus du tableau, à droite ── */}
        <div className="d-flex justify-content-end mb-2">
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Recherche : Catégorie, libellé, quantité, unité..."
            style={{ width: "320px" }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* ── TABLEAU — tbody VIDE, DataTables injecte les lignes ── */}
        <div className="table-responsive p-0 m-0 w-100">
          <table ref={tableRef} className="table table-hover table-bordered bg-white m-0 w-100">
            <thead className="table-light">
              <tr>
                <th>#</th>
                {[
                  { key: "categorie",   label: "Catégorie" },
                  { key: "libelle",     label: "Libellé" },
                  { key: "produit",     label: "Quantité" },
                  { key: "unite",       label: "Unité" },
                  { key: "prix",        label: "Prix" },
                  { key: "date_ajout",  label: "Date" },
                  { key: "heure_ajout", label: "Heure" },
                  { key: "lu",          label: "Statut" },
                ].map(({ key, label }) => (
                  <th key={key} onClick={() => requestSort(key)} style={{ cursor: "pointer", whiteSpace: "nowrap" }}>
                    {label}{" "}
                    {sortConfig.key === key && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                ))}
              </tr>
            </thead>
            {/* ✅ tbody vide — DataTables injecte les lignes, évite le conflit DOM React */}
            <tbody></tbody>
          </table>
        </div>
        {/* ── Pagination gérée automatiquement par DataTables ── */}

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
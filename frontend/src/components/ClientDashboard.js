"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import api from "../services/api"
import Footer from "../components/Footer"
import AjoutClient from "./Modal/AjoutClient"
import ModalPertes from "./Modal/ModalPertes"
import ManageUsersModal from "./Modal/ManageUsersModal"
import { getUserImageUrl } from "../services/userService"
import zomatel from "../images/zoma.jpeg"

const ClientDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [articles, setArticles]             = useState([])
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState("")
  const [success, setSuccess]               = useState("")
  const [showModal, setShowModal]           = useState(false)
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [produitValue, setProduitValue]     = useState("")
  const [searchTerm, setSearchTerm]         = useState("")
  const [sortConfig, setSortConfig]         = useState({ key: null, direction: "asc" })
  const [showPerteModal, setShowPerteModal] = useState(false)
  const [showProfilModal, setShowProfilModal] = useState(false)

  /*
   * IMPORTANT — tableWrapRef pointe sur un <div> CONTENEUR vide.
   * React ne touche jamais le <table> à l'intérieur.
   * DataTables crée et détruit le <table> entièrement en JS.
   */
  const tableWrapRef = useRef(null)
  const dtRef        = useRef(null)

  useEffect(() => {
    if (!user) { navigate("/login"); return }
    fetchArticles()
  }, [user]) // eslint-disable-line

  const fetchArticles = async () => {
    try {
      let response
      if (user.categorie === "admin") {
        response = await api.get("/articles")
      } else {
        response = await api.get(`/articles?categorie=${user.categorie}`)
      }
      const data = response?.data?.data || response?.data || []
      setArticles(Array.isArray(data) ? data : [])
      setError("")
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Session expirée. Veuillez vous reconnecter.")
        setTimeout(() => navigate("/login"), 2000)
      } else if (err.response?.status === 403) {
        setError("Accès refusé pour cette catégorie.")
      } else if (err.response?.status === 404) {
        setArticles([])
      } else {
        setError("Erreur lors du chargement des articles. Veuillez réessayer.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleImportSuccess = () => { fetchArticles() }

  const handleAddProduct = (article) => {
    setSelectedArticle(article)
    setProduitValue("")
    setShowModal(true)
  }

  const canAddToCategory = (articleCategorie, userCategorie) => {
    if (!articleCategorie || !userCategorie) return false
    if (userCategorie === "admin") return true
    const categorieNormalisee = articleCategorie.toLowerCase().trim()
    const userCatNormalisee   = userCategorie.toLowerCase().trim()
    const parts = categorieNormalisee.split("/")
    return parts.some(p => p === userCatNormalisee) || categorieNormalisee === userCatNormalisee
  }

  const handleSubmitProduct = async (e, dateAjout, heureAjout) => {
    e.preventDefault()
    if (!produitValue || produitValue <= 0) { setError("Veuillez saisir une quantité valide"); return }
    if (!dateAjout || !heureAjout)          { setError("Veuillez saisir la date et l'heure"); return }
    try {
      const quantiteAjoutee = parseFloat(produitValue)
      if (isNaN(quantiteAjoutee) || quantiteAjoutee <= 0) {
        setError("Veuillez saisir une quantité valide (nombre positif)"); return
      }
      const quantiteActuelle = parseFloat(selectedArticle.produit) || 0
      const nouvelleQuantite = quantiteActuelle + quantiteAjoutee
      await api.patch(`/articles/${selectedArticle.pk}/produit`, {
        produit: nouvelleQuantite, date_ajout: dateAjout, heure_ajout: heureAjout,
      })
      setSuccess(`Produit ajouté avec succès à ${selectedArticle.libelle}`)
      setError("")
      setShowModal(false)
      setSelectedArticle(null)
      setProduitValue("")
      fetchArticles()
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.errors?.produit?.[0] ||
        "Erreur lors de l'ajout de la quantité"
      setError(errorMessage)
      setTimeout(() => setError(""), 5000)
    }
  }

  const getCategoryBadgeClass = (categorie) => {
    if (categorie === "boisson/resto"  || categorie === "salle/resto")   return "bg-primary"
    if (categorie === "boisson/snack"  || categorie === "salle/snack")   return "bg-warning text-dark"
    if (categorie === "boisson/detente"|| categorie === "salle/detente") return "bg-info"
    return "bg-secondary"
  }

  const handleSort = (key) => {
    let direction = "asc"
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc"
    setSortConfig({ key, direction })
  }

  const sortedArticles = [...articles].sort((a, b) => {
    if (!sortConfig.key) return 0
    let aValue = a[sortConfig.key]
    let bValue = b[sortConfig.key]
    if (sortConfig.key === "date") { aValue = new Date(aValue); bValue = new Date(bValue) }
    if (typeof aValue === "string") aValue = aValue.toLowerCase()
    if (typeof bValue === "string") bValue = bValue.toLowerCase()
    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
    return 0
  })

  const filteredArticles = sortedArticles.filter((article) => {
    const term = searchTerm.toLowerCase().trim()
    if (!term) return true
    const dateStr = article.date ? new Date(article.date).toLocaleDateString("fr-FR") : ""
    return (
      String(article.pk).includes(term) ||
      article.libelle?.toLowerCase().includes(term) ||
      article.categorie?.toLowerCase().includes(term) ||
      String(article.produit).includes(term) ||
      article.unite?.toLowerCase().includes(term) ||
      dateStr.includes(term)
    )
  })

  const authorizedArticles = user?.categorie === "admin"
    ? filteredArticles.filter((a) => canAddToCategory(a.categorie, user.categorie))
    : filteredArticles

  // ─── DataTables — pattern <div> conteneur (même que WeekView) ────────────
  useEffect(() => {
    if (!tableWrapRef.current || !window.$) return

    // 1. Détruire l'instance précédente
    if (dtRef.current) {
      try { dtRef.current.destroy(true) } catch (_) {}
      dtRef.current = null
    }

    // 2. Vider le conteneur
    while (tableWrapRef.current.firstChild) {
      tableWrapRef.current.removeChild(tableWrapRef.current.firstChild)
    }

    // 3. Créer un <table> propre en JS pur — React n'y touche pas
    const table = document.createElement("table")
    table.className = "table table-hover"
    table.innerHTML = `
      <thead style="background-color:rgba(255,255,255,0.69)">
        <tr>
          <th>ID</th>
          <th>Catégorie</th>
          <th>Libellé</th>
          <th>Produit</th>
          <th>Unité</th>
          <th>Date</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody></tbody>
    `
    tableWrapRef.current.appendChild(table)

    // 4. Préparer les données
    const rows = authorizedArticles.map((a) => [
      a.id ?? "",
      `<span class="badge ${getCategoryBadgeClass(a.categorie)}">${a.categorie ?? ""}</span>`,
      a.libelle ?? "",
      `<strong>${a.produit ?? ""}</strong>`,
      a.unite ?? "",
      a.date ? new Date(a.date).toLocaleDateString("fr-FR") : "-",
      canAddToCategory(a.categorie, user?.categorie)
        ? `<button class="btn btn-sm btn-primary dt-add-btn" data-pk="${a.pk}">
             <i class="bi bi-plus-circle"></i> Ajouter
           </button>`
        : `<span class="text-muted">Non autorisé</span>`,
    ])

    // 5. setTimeout : garantit que le <table> est dans le DOM avant DataTables
    const timer = setTimeout(() => {
      if (!tableWrapRef.current || !table.parentNode) return
      try {
        dtRef.current = window.$(table).DataTable({
          data: rows,
          order: [],
          pageLength: 10,
          lengthMenu: [5, 10, 25, 50, 100],
          language: {
            search:     "🔍 Rechercher :",
            lengthMenu: "Afficher _MENU_ lignes",
            info:       "Affichage de _START_ à _END_ sur _TOTAL_ entrées",
            paginate:   { first:"Premier", last:"Dernier", next:"Suivant ➡", previous:"⬅ Précédent" },
            zeroRecords:"Aucun résultat trouvé",
          },
          columnDefs: [{ orderable: false, targets: -1 }],
        })

        // Délégation d'événement pour le bouton Ajouter
        window.$(table).on("click", ".dt-add-btn", function () {
          const pk = window.$(this).data("pk")
          const article = authorizedArticles.find((a) => String(a.pk) === String(pk))
          if (article) handleAddProduct(article)
        })
      } catch (_) {}
    }, 0)

    return () => {
      clearTimeout(timer)
      try {
        if (dtRef.current) {
          window.$(table).off("click", ".dt-add-btn")
          dtRef.current.destroy(true)
          dtRef.current = null
        }
      } catch (_) {}
    }
  }, [authorizedArticles]) // eslint-disable-line

  const SortArrow = ({ column }) => {
    if (sortConfig.key !== column) return <span className="ms-1 text-muted">▲▼</span>
    return sortConfig.direction === "asc"
      ? <span className="ms-1 text-success">▲</span>
      : <span className="ms-1 text-danger">▼</span>
  }

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center" style={{ height:"100vh" }}>
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
        <p className="text-muted">Chargement des articles...</p>
      </div>
    )
  }

  return (
    <div className="container-fluid position-relative min-vh-100">

      {/* NAVBAR */}
      <nav className="navbar navbar-expand-lg navbar-dark fixed-top shadow" style={{ backgroundColor:"#800020" }}>
        <div className="container-fluid d-flex align-items-center justify-content-between">

          {/* Logo + titre */}
          <div className="d-flex align-items-center">
            <div style={{
              height:"50px", width:"100px", marginRight:"10px", borderRadius:"5px",
              backgroundColor:"white", display:"flex", alignItems:"center", justifyContent:"center",
              fontWeight:"bold", color:"#0d6efd", fontSize:"18px",
            }}>
              <img src={zomatel} alt="Logo Zomatel" style={{
                maxHeight:"137%", maxWidth:"130%", objectFit:"contain", borderRadius:"20px"
              }} />
            </div>
            <span className="navbar-brand mb-0 h5">
              Gestion de Salle - {user?.categorie?.charAt(0).toUpperCase() + user?.categorie?.slice(1)}
            </span>
          </div>

          {/* Bienvenue + Menu dropdown */}
          <div className="d-flex align-items-center gap-3">
            <div style={{
              width:36, height:36, borderRadius:"50%", overflow:"hidden",
              backgroundColor:"#fff", display:"flex", alignItems:"center", justifyContent:"center",
              backgroundImage: getUserImageUrl(user) ? `url(${getUserImageUrl(user)})` : "none",
              backgroundSize:"cover", backgroundPosition:"center",
              fontSize:14, fontWeight:600, color:"#800020",
            }}>
              {!getUserImageUrl(user) && `${(user?.prenoms||"").charAt(0)}${(user?.nom||"").charAt(0)}`.toUpperCase()}
            </div>
            <span className="navbar-text text-white">{user?.prenoms} {user?.nom}</span>

            <div className="dropdown">
              <button className="btn btn-light btn-sm dropdown-toggle" type="button"
                data-bs-toggle="dropdown" aria-expanded="false">
                ⚙️ Menu
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow-sm">
                <li>
                  <button className="dropdown-item" onClick={() => setShowProfilModal(true)}>
                    <i className="bi bi-person-circle me-2"></i> Mon Profil
                  </button>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button className="dropdown-item text-danger"
                    data-bs-toggle="modal" data-bs-target="#logoutModal">
                    <i className="bi bi-box-arrow-right me-2"></i> Déconnexion
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      {/* CONTENU PRINCIPAL */}
      <div className="container mt-5 pt-5">
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>{error}
            <button type="button" className="btn-close" onClick={() => setError("")}></button>
          </div>
        )}
        {success && (
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            <i className="bi bi-check-circle me-2"></i>{success}
            <button type="button" className="btn-close" onClick={() => setSuccess("")}></button>
          </div>
        )}

        <div className="row mb-1 mt-1">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center flex-wrap mb-3">
              <div>
                <center><h2 className="text-black">Articles Disponibles de Zomatel à cours</h2></center>
                <p className="text-black">
                  {user?.categorie === "admin"
                    ? "Vous pouvez ajouter des quantités à toutes les catégories"
                    : `Vous pouvez ajouter des quantités uniquement dans la catégorie "${user?.categorie}"`}
                </p>
                <small className="text-muted">
                  {authorizedArticles.length} article(s) chargé(s) pour la catégorie "{user?.categorie}"
                </small>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
              <button className="btn btn-danger" onClick={() => setShowPerteModal(true)}>
                ⚠️ Pertes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Tableau DataTables ─────────────────────────────────────────────── */}
      <div className="row">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-body">
              <div className="table-responsive">
                {/*
                  ⚠️ Ce <div> est le SEUL élément que React connaît.
                  Le <table> est créé ENTIÈREMENT par DataTables en JS.
                  React ne touche jamais au DOM à l'intérieur.
                */}
                <div ref={tableWrapRef} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      <ManageUsersModal
        show={showProfilModal}
        onClose={() => setShowProfilModal(false)}
        showProfil={true}
      />

      <div className="modal fade" id="logoutModal" tabIndex="-1" aria-labelledby="logoutModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title text-danger" id="logoutModalLabel">
                <i className="bi bi-box-arrow-right me-2"></i> Déconnexion
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <p className="mb-0">Êtes-vous sûr de vouloir vous déconnecter ?</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-danger"
                data-bs-dismiss="modal" onClick={() => logout()}>
                <i className="bi bi-box-arrow-right me-1"></i> Déconnecter
              </button>
            </div>
          </div>
        </div>
      </div>

      <AjoutClient
        showModal={showModal}
        setShowModal={setShowModal}
        selectedArticle={selectedArticle}
        produitValue={produitValue}
        setProduitValue={setProduitValue}
        handleSubmitProduct={handleSubmitProduct}
      />

      <ModalPertes
        show={showPerteModal}
        onClose={() => setShowPerteModal(false)}
      />

      <Footer />
    </div>
  )
}

export default ClientDashboard
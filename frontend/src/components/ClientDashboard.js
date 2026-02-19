"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import api from "../services/api"
import Footer from "../components/Footer"
import AjoutClient from "./Modal/AjoutClient"
import ModalPertes from "./Modal/ModalPertes"
import zomatel from "../images/zoma.jpeg"


const ClientDashboard = () => {

  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [produitValue, setProduitValue] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" })
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [showPerteModal, setShowPerteModal] = useState(false)

  useEffect(() => {
    fetchArticles()
  }, [])

  const fetchArticles = async () => {
    try {
      let response
      if (user.categorie === "admin") {
        response = await api.get("/articles")
      } else {
        response = await api.get(`/articles?categorie=${user.categorie}`)
      }
      setArticles(response.data?.data || response.data || [])
      setLoading(false)
    } catch (error) {
      setError("Erreur lors du chargement des articles")
      setLoading(false)
    }
  }

  const handleImportSuccess = () => {
    fetchArticles()
  }

  const handleAddProduct = (article) => {
    setSelectedArticle(article)
    setProduitValue("")
    setShowModal(true)
  }

  const canAddToCategory = (articleCategorie, userCategorie) => {
    if (!articleCategorie || !userCategorie) return false
    const parts = articleCategorie.split("/")
    return parts[1] === userCategorie || userCategorie === "admin"
  }

  const handleSubmitProduct = async (e, dateAjout, heureAjout) => {
    e.preventDefault()
    if (!produitValue || produitValue <= 0) {
      setError("Veuillez saisir une quantité valide")
      return
    }

    if (!dateAjout || !heureAjout) {
      setError("Veuillez saisir la date et l'heure")
      return
    }

    try {
      const quantiteAjoutee = parseFloat(produitValue)
      if (isNaN(quantiteAjoutee) || quantiteAjoutee <= 0) {
        setError("Veuillez saisir une quantité valide (nombre positif)")
        return
      }

      const quantiteActuelle = parseFloat(selectedArticle.produit) || 0
      const nouvelleQuantite = quantiteActuelle + quantiteAjoutee

      await api.patch(`/articles/${selectedArticle.id}/produit`, {
        produit: nouvelleQuantite,
        date_ajout: dateAjout,
        heure_ajout: heureAjout,
      })
      setSuccess(`Produit ajouté avec succès à ${selectedArticle.libelle}`)
      setError("")
      setShowModal(false)
      setSelectedArticle(null)
      setProduitValue("")
      fetchArticles()
      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error)
      const errorMessage = error.response?.data?.message || error.response?.data?.errors?.produit?.[0] || "Erreur lors de l'ajout de la quantité"
      setError(errorMessage)
      setTimeout(() => setError(""), 5000)
    }
  }

  const getCategoryBadgeClass = (categorie) => {
    if (categorie === "boisson/resto" || categorie === "salle/resto") return "bg-primary"
    if (categorie === "boisson/snack" || categorie === "salle/snack") return "bg-warning text-dark"
    if (categorie === "boisson/detente" || categorie === "salle/detente") return "bg-info"
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

    if (sortConfig.key === "date") {
      aValue = new Date(aValue)
      bValue = new Date(bValue)
    }

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
      String(article.id).includes(term) ||
      article.libelle?.toLowerCase().includes(term) ||
      article.categorie?.toLowerCase().includes(term) ||
      String(article.produit).includes(term) ||
      article.unite?.toLowerCase().includes(term) ||
      dateStr.includes(term)
    )
  })

  const authorizedArticles = filteredArticles.filter((article) => canAddToCategory(article.categorie, user.categorie))
  const totalPages = Math.ceil(authorizedArticles.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedArticles = authorizedArticles.slice(startIndex, startIndex + itemsPerPage)

  const goToPage = (page) => page >= 1 && page <= totalPages && setCurrentPage(page)

  const SortArrow = ({ column }) => {
    if (sortConfig.key !== column) return <span className="ms-1 text-muted">▲▼</span>
    return sortConfig.direction === "asc" ? (
      <span className="ms-1 text-success">▲</span>
    ) : (
      <span className="ms-1 text-danger">▼</span>
    )
  }

  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    )

  return (
    <div className="container-fluid position-relative min-vh-100">

      {/* ============================================================
          NAVBAR — sans aucun modal à l'intérieur
      ============================================================ */}
      <nav className="navbar navbar-expand-lg navbar-dark fixed-top shadow" style={{ backgroundColor: "#800020" }}>
        <div className="container-fluid d-flex align-items-center justify-content-between">

          {/* Logo + titre */}
          <div className="d-flex align-items-center">
            <div
              style={{
                height: "50px",
                width: "100px",
                marginRight: "10px",
                borderRadius: "5px",
                backgroundColor: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                color: "#0d6efd",
                fontSize: "18px",
              }}>
              <img
                src={zomatel}
                alt="Logo Zomatel"
                style={{
                  maxHeight: "137%",
                  maxWidth: "130%",
                  objectFit: "contain",
                  borderRadius: "20px"
                }} />
            </div>
            <span className="navbar-brand mb-0 h5">
              Gestion de Salle - {user.categorie.charAt(0).toUpperCase() + user.categorie.slice(1)}
            </span>
          </div>

          {/* Bienvenue + Menu dropdown */}
          <div className="d-flex align-items-center gap-3">
            <span className="navbar-text text-white">
              Bienvenue, {user.prenoms} {user.nom}
            </span>

            {/* Dropdown Menu */}
            <div className="dropdown">
              <button
                className="btn btn-light btn-sm dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                ⚙️ Menu
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow-sm">
                <li>
                  <button
                    className="dropdown-item"
                    data-bs-toggle="modal"
                    data-bs-target="#profilModal"
                  >
                    <i className="bi bi-person-circle me-2"></i> Mon Profil
                  </button>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button
                    className="dropdown-item text-danger"
                    data-bs-toggle="modal"
                    data-bs-target="#logoutModal"
                  >
                    <i className="bi bi-box-arrow-right me-2"></i> Déconnexion
                  </button>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </nav>

      {/* ============================================================
          CONTENU PRINCIPAL
      ============================================================ */}
      <div className="container mt-5 pt-5">

        {/* Alertes */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={() => setError("")}></button>
          </div>
        )}
        {success && (
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            {success}
            <button type="button" className="btn-close" onClick={() => setSuccess("")}></button>
          </div>
        )}

        <div className="row mb-1 mt-1">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center flex-wrap mb-3">
              <div>
                <h2 className="text-black">Articles Disponibles de Zomatel à cours</h2>
                <p className="text-black">
                  {user.categorie === "admin"
                    ? "Vous pouvez ajouter des quantités à toutes les catégories"
                    : `Vous pouvez ajouter des quantités uniquement dans la catégorie "${user.categorie}"`}
                </p>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
              <button
                className="btn btn-danger"
                onClick={() => setShowPerteModal(true)}
              >
                ⚠️ Pertes
              </button>

              <div style={{ width: "250px" }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Rechercher tous les articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="row">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead style={{ backgroundColor: "rgba(255,255,255,0.69)" }}>
                    <tr>
                      <th onClick={() => handleSort("id")} style={{ cursor: "pointer" }}>
                        ID <SortArrow column="id" />
                      </th>
                      <th onClick={() => handleSort("categorie")} style={{ cursor: "pointer" }}>
                        Catégorie <SortArrow column="categorie" />
                      </th>
                      <th onClick={() => handleSort("libelle")} style={{ cursor: "pointer" }}>
                        Libellé <SortArrow column="libelle" />
                      </th>
                      <th onClick={() => handleSort("produit")} style={{ cursor: "pointer" }}>
                        Produit <SortArrow column="produit" />
                      </th>
                      <th onClick={() => handleSort("unite")} style={{ cursor: "pointer" }}>
                        Unité <SortArrow column="unite" />
                      </th>
                      <th onClick={() => handleSort("date")} style={{ cursor: "pointer" }}>
                        Date <SortArrow column="date" />
                      </th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedArticles.length > 0 ? (
                      paginatedArticles.map((article) => (
                        <tr key={article.id}>
                          <td>{article.id}</td>
                          <td>
                            <span className={`badge ${getCategoryBadgeClass(article.categorie)}`}>
                              {article.categorie}
                            </span>
                          </td>
                          <td>{article.libelle}</td>
                          <td>
                            <strong>{article.produit}</strong>
                          </td>
                          <td>{article.unite}</td>
                          <td>{article.date ? new Date(article.date).toLocaleDateString("fr-FR") : "-"}</td>
                          <td>
                            {canAddToCategory(article.categorie, user.categorie) ? (
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => handleAddProduct(article)}
                              >
                                <i className="bi bi-plus-circle"></i> Ajouter
                              </button>
                            ) : (
                              <span className="text-muted">Non autorisé</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center text-muted">
                          Aucun article trouvé.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav>
                  <ul className="pagination justify-content-center mt-3">
                    <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                      <button className="page-link" onClick={() => goToPage(currentPage - 1)}>
                        Précédent
                      </button>
                    </li>
                    {Array.from({ length: totalPages }, (_, index) => (
                      <li key={index} className={`page-item ${currentPage === index + 1 ? "active" : ""}`}>
                        <button className="page-link" onClick={() => goToPage(index + 1)}>
                          {index + 1}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                      <button className="page-link" onClick={() => goToPage(currentPage + 1)}>
                        Suivant
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          MODALS — tous placés ici, en dehors de la navbar
      ============================================================ */}

      {/* Modal Mon Profil */}
      <div className="modal fade" id="profilModal" tabIndex="-1" aria-labelledby="profilModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header" style={{ backgroundColor: "#800020" }}>
              <h5 className="modal-title text-white" id="profilModalLabel">
                <i className="bi bi-person-circle me-2"></i> Mon Profil
              </h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="d-flex align-items-center mb-3">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{ width: 60, height: 60, backgroundColor: "#800020" }}
                >
                  <i className="bi bi-person-fill text-white fs-2"></i>
                </div>
                <div>
                  <h6 className="mb-0 fw-bold">{user?.prenoms} {user?.nom}</h6>
                  <small className="text-muted">{user?.email ?? "—"}</small>
                </div>
              </div>
              <hr />
              <div className="row g-2">
                <div className="col-5 text-muted fw-semibold">Nom d'utilisateur</div>
                <div className="col-7">{user?.nom ?? "—"}</div>

                <div className="col-5 text-muted fw-semibold">Rôle</div>
                <div className="col-7">
                  <span className="badge" style={{ backgroundColor: "#800020" }}>{user?.role ?? "Utilisateur Simples"}</span>
                </div>

                <div className="col-5 text-muted fw-semibold">Catégorie</div>
                <div className="col-7">{user?.categorie ?? "—"}</div>

              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* Modal Confirmation Déconnexion */}
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
              
              <button
                type="button"
                className="btn btn-danger"
                data-bs-dismiss="modal"
                onClick={() => logout()}
              >
                <i className="bi bi-box-arrow-right me-1"></i> Déconnecter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Ajout Client */}
      <AjoutClient
        showModal={showModal}
        setShowModal={setShowModal}
        selectedArticle={selectedArticle}
        produitValue={produitValue}
        setProduitValue={setProduitValue}
        handleSubmitProduct={handleSubmitProduct}
      />

      {/* Modal Pertes */}
      <ModalPertes
        show={showPerteModal}
        onClose={() => setShowPerteModal(false)}
      />

      <Footer />
    </div>
  )
}

export default ClientDashboard
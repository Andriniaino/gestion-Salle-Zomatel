"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "../contexts/AuthContext"
import Header from "../components/Modal/Header"
import Footer from "../components/Footer"
import AjoutModal from "../components/Modal/AjoutModal"
import CreerCompte from "./Modal/CreerCompte"
import Resume from "./Resume"
import WeekView from "./WeekView"
import ExportExel from "../components/ExportExel"
import api from "../services/api";
import ArticleImport from "./ArticleImport";



const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const [showImport, setShowImport] = useState(false);

  // import en excel
  const handleImportSuccess = () => {
    fetchArticles();
  };

  // --- vues/modal ---
  const [showWeekView, setShowWeekView] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)

  // --- utilisateur modal state ---
  const [formDataUser, setFormDataUser] = useState({
    nom: "",
    prenoms: "",
    mail: "",
    password: "",
    confirmPassword: "",
    categorie: "resto",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleChangeUser = (e) => setFormDataUser({ ...formDataUser, [e.target.name]: e.target.value })

  const handleSubmitUser = async (e) => {
    e.preventDefault()
    if (formDataUser.password !== formDataUser.confirmPassword) {
      alert("Les mots de passe ne correspondent pas !")
      return
    }
    try {
      await api.post("/auth/register", formDataUser)
      alert("✅ Compte créé avec succès !")
      setShowUserModal(false)
      setFormDataUser({
        nom: "",
        prenoms: "",
        mail: "",
        password: "",
        confirmPassword: "",
        categorie: "resto",
      })
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || "Erreur lors de la création du compte")
    }
  }

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showAll, setShowAll] = useState(true);

  const getTodayISO = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  useEffect(() => {
    const today = getTodayISO();
    setStartDate(today);
    setEndDate(today);
  }, []);

  const handleReset = () => {
    const today = getTodayISO();
    setStartDate(today);
    setEndDate(today);
    setSearchTerm("");
  };

  const getMinEndDate = () => startDate;
  const getMaxStartDate = () => endDate;

  // --- articles / édition / suppression ---
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editingArticle, setEditingArticle] = useState(null)
  const [saveLoading, setSaveLoading] = useState(false)

  // ✅ NOUVEAU : state pour la suppression via modal
  const [articleToDelete, setArticleToDelete] = useState(null)

  // formulaire article
  const [formDataArticle, setFormDataArticle] = useState({
    id: "",
    categorie: "resto",
    libelle: "",
    produit: "",
    unite: "piece",
    prix: "",
  })

  // recherche / tri
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" })

  // pagination
  const [currentPage, setCurrentPage] = useState(1)
  const articlesPerPage = 10

  // --- filtrage catégorie (provenant du Header) ---
  const [selectedCategory, setSelectedCategory] = useState("")

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category)
    setCurrentPage(1)
  }

  // --- fetch articles ---
  const fetchArticles = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get("/articles")
      setArticles(response.data?.data || response.data || [])
    } catch (err) {
      console.error("Erreur lors du chargement des articles:", err)
      setError("Erreur lors du chargement des articles")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  useEffect(() => {
    const handleNewNotification = (event) => {
      fetchArticles()
    }
    window.addEventListener('newNotificationReceived', handleNewNotification)
    return () => {
      window.removeEventListener('newNotificationReceived', handleNewNotification)
    }
  }, [fetchArticles])

  // --- helper pour formulaire article ---
  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (["id", "produit", "prix"].includes(name) && value !== "" && Number(value) < 0) return
    setFormDataArticle((prev) => ({ ...prev, [name]: value }))
  }

  const parseNumber = (v) => {
    if (v === "" || v == null) return null
    const normalized = String(v).replace(/,/g, ".")
    const n = Number(normalized)
    return Number.isNaN(n) ? null : n
  }

  const resetFormArticle = () => {
    setFormDataArticle({
      id: "",
      categorie: "resto",
      libelle: "",
      produit: "",
      unite: "piece",
      prix: "",
    })
  }

  const openAddModal = () => {
    setEditingArticle(null)
    resetFormArticle()
    setShowModal(true)
  }

  const handleEdit = (article) => {
    setEditingArticle(article)
    setFormDataArticle({
      id: article.id != null ? String(article.id) : "",
      categorie: article.categorie || "resto",
      libelle: article.libelle || "",
      produit: article.produit != null ? String(article.produit) : "",
      unite: article.unite || "piece",
      prix: article.prix != null ? String(article.prix) : "",
    })
    setShowModal(true)
  }

  const handleSubmitArticle = async (e) => {
    e.preventDefault()
    setError("")
    setSaveLoading(true)

    const produitNum =
      formDataArticle.produit === "" || formDataArticle.produit == null
        ? 0
        : parseNumber(formDataArticle.produit)

    const prixNum = parseNumber(formDataArticle.prix)
    const idNum = formDataArticle.id !== "" ? parseNumber(formDataArticle.id) : null

    if (produitNum == null || produitNum < 0) {
      alert("Le champ Quantité ne peut pas être négatif.")
      setSaveLoading(false)
      return
    }
    if (prixNum == null || prixNum <= 0) {
      alert("Le champ Prix doit être un nombre positif.")
      setSaveLoading(false)
      return
    }
    if (formDataArticle.id !== "" && (!Number.isInteger(idNum) || idNum <= 0)) {
      alert("Si vous fournissez un ID, il doit être un entier positif.")
      setSaveLoading(false)
      return
    }
    if (!editingArticle && formDataArticle.id !== "") {
      const exists = articles.some((a) => String(a.id) === String(formDataArticle.id))
      if (exists) {
        alert("Cet ID existe déjà.")
        setSaveLoading(false)
        return
      }
    }

    const payload = {
      ...(idNum != null ? { id: idNum } : {}),
      categorie: formDataArticle.categorie,
      libelle: formDataArticle.libelle,
      produit: produitNum,
      unite: formDataArticle.unite,
      prix: prixNum,
      date: new Date().toISOString().split("T")[0],
    }

    try {
      if (editingArticle) {
        await api.put(`/articles/${editingArticle.id}`, payload)
      } else {
        await api.post("/articles", payload)
      }
      setShowModal(false)
      setEditingArticle(null)
      resetFormArticle()
      await fetchArticles()
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || "Erreur lors de la sauvegarde")
    } finally {
      setSaveLoading(false)
    }
  }

  // ✅ NOUVEAU : mémoriser l'id à supprimer (le modal s'ouvre via data-bs-toggle sur le bouton)
  const confirmDelete = (id) => {
    setArticleToDelete(id)
  }

  // ✅ NOUVEAU : exécuter la suppression après confirmation
  const handleDelete = async () => {
    if (!articleToDelete) return
    try {
      const response = await api.delete(`/articles/${articleToDelete}`)
      setError("")
      setArticleToDelete(null)
      await fetchArticles()
      if (response.data?.message) {
        console.log(response.data.message)
      }
    } catch (err) {
      console.error("Erreur lors de la suppression:", err)
      const errorMessage = err.response?.data?.message || err.response?.data?.error || "Erreur lors de la suppression"
      setError(errorMessage)
      setTimeout(() => setError(""), 5000)
    }
  }

  // --- tri ---
  const requestSort = (key) => {
    let direction = "asc"
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc"
    setSortConfig({ key, direction })
  }

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <span className="text-muted">⇅</span>
    return sortConfig.direction === "asc" ? <span>▲</span> : <span>▼</span>
  }

  const comparator = (a, b) => {
    const key = sortConfig.key
    if (!key) return 0
    let aVal = a[key], bVal = b[key]
    if (key === "date") {
      aVal = aVal ? new Date(aVal).getTime() : 0
      bVal = bVal ? new Date(bVal).getTime() : 0
    } else if (["produit", "prix", "id"].includes(key)) {
      aVal = Number(aVal) || 0
      bVal = Number(bVal) || 0
    } else {
      aVal = (aVal ?? "").toString().toLowerCase()
      bVal = (bVal ?? "").toString().toLowerCase()
    }
    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1
    return 0
  }

  const sortedArticles = [...articles].sort(comparator)

  const filteredArticles = sortedArticles.filter((article) => {
    const term = searchTerm.toLowerCase().trim()
    const matchesSearch =
      !term ||
      article.libelle?.toLowerCase().includes(term) ||
      article.categorie?.toLowerCase().includes(term) ||
      String(article.produit).toLowerCase().includes(term) ||
      article.unite?.toLowerCase().includes(term) ||
      String(article.prix).toLowerCase().includes(term) ||
      (article.date && new Date(article.date).toLocaleDateString("fr-FR").includes(term))

    const matchesCategory =
      !selectedCategory ||
      (article.categorie && article.categorie.toLowerCase().includes(selectedCategory.toLowerCase()))

    let matchesDateRange = true
    if (startDate || endDate) {
      if (!article.date) {
        matchesDateRange = false
      } else {
        const articleDate = new Date(article.date)
        articleDate.setHours(0, 0, 0, 0)
        if (startDate) {
          const start = new Date(startDate)
          start.setHours(0, 0, 0, 0)
          if (articleDate < start) matchesDateRange = false
        }
        if (endDate) {
          const end = new Date(endDate)
          end.setHours(23, 59, 59, 999)
          if (articleDate > end) matchesDateRange = false
        }
      }
    }

    return matchesSearch && matchesCategory && matchesDateRange
  })

  // --- pagination ---
  const totalPages = Math.ceil(filteredArticles.length / articlesPerPage)
  const indexOfLast = currentPage * articlesPerPage
  const indexOfFirst = indexOfLast - articlesPerPage
  const currentArticles = filteredArticles.slice(indexOfFirst, indexOfLast)
  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  const getCategoryBadgeClass = (categorie) => {
    if (!categorie) return "bg-secondary"
    if (categorie.includes("resto")) return "bg-primary"
    if (categorie.includes("snack")) return "bg-warning text-dark"
    if (categorie.includes("detente")) return "bg-info text-dark"
    return "bg-secondary"
  }

  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    )

  return (
    <>
      {/* Wrapper principal SANS zIndex qui bloquerait les modals */}
      <div className="position-relative min-vh-100">
        <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.18)", zIndex: 1, pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 2, padding: 20 }}>

          {error && (
            <div className="alert alert-danger alert-dismissible fade show">
              {error}
              <button type="button" className="btn-close" onClick={() => setError("")}></button>
            </div>
          )}

          <div className="container-fluid">
            <Header
              setShowUserModal={setShowUserModal}
              showWeekView={showWeekView}
              setShowWeekView={setShowWeekView}
              handleCategoryFilter={handleCategoryFilter}
            />

            {!showWeekView ? (
              <>
                <div className="container mt-5 pt-3"></div>

                <ArticleImport
                  show={showImport}
                  onClose={() => setShowImport(false)}
                  onImportSuccess={() => { fetchArticles(); }}
                />

                <div className="container">
                  {/* 🔹 Filtres et recherche */}
                  <div className="row mb-4">
                    <div className="col-12">
                      <div className="d-flex justify-content-center gap-2 flex-wrap align-items-center">
                        <div className="d-flex align-items-center gap-1">
                          <label className="fw-bold mb-0">Du :</label>
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            style={{ width: "150px" }}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            max={getMaxStartDate()}
                          />
                        </div>
                        <div className="d-flex align-items-center gap-1">
                          <label className="fw-bold mb-0">Au :</label>
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            style={{ width: "150px" }}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            min={getMinEndDate()}
                            disabled={!startDate}
                          />
                        </div>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Rechercher..."
                          style={{ width: "200px" }}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {(startDate !== getTodayISO() || endDate !== getTodayISO() || searchTerm) && (
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={handleReset}
                            title="Remettre les dates à aujourd'hui et effacer la recherche"
                          >
                            🔄 Effacer
                          </button>
                        )}
                        <span className="text-muted small ms-2">
                          {startDate && endDate
                            ? `Période: ${new Date(startDate).toLocaleDateString('fr-FR')} - ${new Date(endDate).toLocaleDateString('fr-FR')}`
                            : "Sélectionnez une période"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 🔹 Boutons Ajouter / Exporter / Importer */}
                  <div className="card-body py-2 mb-3">
                    <div className="d-flex justify-content gap-2 flex-wrap">
                      <button
                        className="btn btn-primary"
                        onClick={openAddModal}
                        style={{ width: "150px", height: "35px", fontSize: "12px" }}
                        title="Ajouter"
                      >
                        ➕ Ajouter
                      </button>
                      <button
                        className="btn btn-info dropdown-toggle"
                        type="button"
                        id="dropdownExportButton"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                        style={{ width: "150px", height: "35px", fontSize: "12px" }}
                      >
                        <i className="bi bi-file-earmark-excel me-1"></i>
                        📤 Exporter
                      </button>
                      <button
                        className="btn btn-success"
                        onClick={() => setShowImport(true)}
                        style={{ width: "150px", height: "35px", fontSize: "12px" }}
                        title="Importer Excel"
                      >
                        📥Importer Excel
                      </button>
                      <div style={{ width: "150px", height: "35px" }}>
                        <ExportExel currentArticles={currentArticles} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tableau */}
                <div className="card shadow" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-hover table-bordered bg-white">
                        <thead className="table-light">
                          <tr>
                            <th onClick={() => requestSort("id")} style={{ cursor: "pointer" }}>
                              ID {getSortIcon("id")}
                            </th>
                            <th onClick={() => requestSort("categorie")} style={{ cursor: "pointer" }}>
                              Catégorie {getSortIcon("categorie")}
                            </th>
                            <th onClick={() => requestSort("libelle")} style={{ cursor: "pointer" }}>
                              Libellé {getSortIcon("libelle")}
                            </th>
                            <th onClick={() => requestSort("produit")} style={{ cursor: "pointer" }}>
                              Quantité {getSortIcon("produit")}
                            </th>
                            <th onClick={() => requestSort("unite")} style={{ cursor: "pointer" }}>
                              Unité {getSortIcon("unite")}
                            </th>
                            <th onClick={() => requestSort("prix")} style={{ cursor: "pointer" }}>
                              Prix {getSortIcon("prix")}
                            </th>
                            <th onClick={() => requestSort("date")} style={{ cursor: "pointer" }}>
                              Date {getSortIcon("date")}
                            </th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentArticles.map((article) => (
                            <tr key={article.id}>
                              <td>{article.id}</td>
                              <td>
                                <span className={`badge ${getCategoryBadgeClass(article.categorie)}`}>
                                  {article.categorie}
                                </span>
                              </td>
                              <td>{article.libelle}</td>
                              <td>{article.produit}</td>
                              <td>{article.unite}</td>
                              <td>{article.prix}</td>
                              <td>{article.date ? new Date(article.date).toLocaleDateString("fr-FR") : "-"}</td>
                              <td>
                                <button
                                  className="btn btn-sm btn-outline-primary me-1"
                                  onClick={() => handleEdit(article)}
                                >
                                  Modifier
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => confirmDelete(article.id)}
                                  data-bs-toggle="modal"
                                  data-bs-target="#deleteModal"
                                >
                                  Supprimer
                                </button>
                              </td>
                            </tr>
                          ))}

                          {filteredArticles.length === 0 && (
                            <tr>
                              <td colSpan={8} className="text-center text-muted">
                                {searchTerm || startDate || endDate || selectedCategory
                                  ? "Aucun article ne correspond aux critères de recherche."
                                  : "Aucun article disponible."}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {totalPages > 1 && (
                  <nav className="mt-3">
                    <ul className="pagination d-flex justify-content-between align-items-center">
                      <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                        <button className="page-link" onClick={() => paginate(Math.max(currentPage - 1, 1))}>
                          ⬅ Précédent
                        </button>
                      </li>
                      <div className="d-flex">
                        {[...Array(totalPages)].map((_, i) => (
                          <li key={i} className={`page-item mx-1 ${currentPage === i + 1 ? "active" : ""}`}>
                            <button className="page-link" onClick={() => paginate(i + 1)}>
                              {i + 1}
                            </button>
                          </li>
                        ))}
                      </div>
                      <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                        <button className="page-link" onClick={() => paginate(Math.min(currentPage + 1, totalPages))}>
                          Suivant ➡
                        </button>
                      </li>
                    </ul>
                  </nav>
                )}

                <Resume articles={articles} />
              </>
            ) : (
              <WeekView onBack={() => setShowWeekView(false)} selectedCategory={selectedCategory} />
            )}

            <Footer />
          </div>
        </div>
      </div>

      {/* ============================================================
          MODALS — EN DEHORS de tous les divs position/zIndex
          Directement dans le Fragment racine <>
      ============================================================ */}

      {/* Modal Confirmation Suppression */}
      <div className="modal fade" id="deleteModal" tabIndex="-1" aria-labelledby="deleteModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title text-danger" id="deleteModalLabel">
                <i className="bi bi-trash me-2"></i> Supprimer l'article
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={() => setArticleToDelete(null)}
              ></button>
            </div>
            <div className="modal-body">
              <p className="mb-0">
                Êtes-vous sûr de vouloir supprimer cet article ?
                <br />
                <span className="text-danger fw-semibold">Cette action est irréversible.</span>
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
                onClick={() => setArticleToDelete(null)}
              >
                <i className="bi bi-x-circle me-1"></i> Annuler
              </button>
              <button
                type="button"
                className="btn btn-danger"
                data-bs-dismiss="modal"
                onClick={handleDelete}
              >
                <i className="bi bi-trash me-1"></i> Supprimer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Créer Compte */}
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

      {/* Modal Ajout/Édition Article */}
      <AjoutModal
        showModal={showModal}
        setShowModal={setShowModal}
        editingArticle={editingArticle}
        formDataArticle={formDataArticle}
        handleInputChange={handleInputChange}
        handleSubmitArticle={handleSubmitArticle}
        saveLoading={saveLoading}
        setEditingArticle={setEditingArticle}
      />
    </>
  )
}

export default AdminDashboard
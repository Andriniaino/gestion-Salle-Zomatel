import { useEffect, useMemo, useState } from "react"
import api from "../../services/api" // 👈 import de votre instance centralisée
import Header from "./Header"

const PER_PAGE = 10

export default function PerteAdmin() {
  const [pertes, setPertes] = useState([])
  const [loading, setLoading] = useState(true)

  const [serviceFilter, setServiceFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [perteToDelete, setPerteToDelete] = useState(null)

  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedPerte, setSelectedPerte] = useState(null)
  const [editForm, setEditForm] = useState({
    quantite: "",
    commentaire: "",
  })

  const [successMessage, setSuccessMessage] = useState(null)

  /* =========================
     FETCH
  ========================= */
  useEffect(() => {
    api.get("/pertes")                          // ✅ était : axios.get("http://192.168.7.162:8000/api/pertes")
      .then(res => {
        setPertes(res.data.data || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  /* =========================
     EXPORT
  ========================= */
  const exportPertes = async (categorie) => {
    try {
      let url = "/pertes/export"              // ✅ était : `${API_BASE}/api/pertes/export`
      if (categorie && categorie !== "tous") {
        url += `?categorie=${encodeURIComponent(categorie)}`
      }

      const response = await api.get(url, { responseType: "blob" })  // ✅

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })

      const link = document.createElement("a")
      link.href = window.URL.createObjectURL(blob)

      const filename =
        categorie && categorie !== "tous"
          ? `pertes_${categorie.replaceAll(" / ", "_")}.xlsx`
          : "pertes_tous.xlsx"

      link.download = filename
      link.click()
    } catch (error) {
      console.error("Erreur export :", error)
      alert("❌ Erreur lors de l'export Excel !")
    }
  }

  /* =========================
     FILTRAGE + RECHERCHE
  ========================= */
  const filteredPertes = useMemo(() => {
    let filtered = pertes

    if (serviceFilter !== "all") {
      filtered = filtered.filter(p =>
        p.article?.categorie?.toLowerCase().includes(serviceFilter)
      )
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(p => {
        const articleLibelle = p.article?.libelle?.toLowerCase() || ""
        const articleCategorie = p.article?.categorie?.toLowerCase() || ""
        const commentaire = p.commentaire?.toLowerCase() || ""
        const produit = String(p.produit || "").toLowerCase()
        const date = p.created_at ? new Date(p.created_at).toLocaleString("fr-FR").toLowerCase() : ""

        return (
          articleLibelle.includes(term) ||
          articleCategorie.includes(term) ||
          commentaire.includes(term) ||
          produit.includes(term) ||
          date.includes(term)
        )
      })
    }

    return filtered
  }, [pertes, serviceFilter, searchTerm])

  /* =========================
     TRI PAR DATE (DESC)
  ========================= */
  const sortedPertes = useMemo(() => {
    return [...filteredPertes].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    )
  }, [filteredPertes])

  /* =========================
     PAGINATION
  ========================= */
  const totalPages = Math.ceil(sortedPertes.length / PER_PAGE)

  const paginatedPertes = useMemo(() => {
    const start = (currentPage - 1) * PER_PAGE
    return sortedPertes.slice(start, start + PER_PAGE)
  }, [sortedPertes, currentPage])

  const handleServiceFilter = (service) => {
    setServiceFilter(service || "all")
    setCurrentPage(1)
  }

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  const handleClearSearch = () => {
    setSearchTerm("")
    setCurrentPage(1)
  }

  /* =========================
     HELPER TOAST
  ========================= */
  const showToast = (type) => {
    setSuccessMessage(type)
    setTimeout(() => setSuccessMessage(null), 2000)
  }

  /* =========================
     SUPPRESSION
  ========================= */
  const handleDelete = (id) => {
    setPerteToDelete(id)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    try {
      await api.delete(`/pertes/${perteToDelete}`)   // ✅ était : axios.delete("http://localhost:8000/api/pertes/...")
      setPertes(prev => prev.filter(p => p.id !== perteToDelete))
      setShowDeleteModal(false)
      setPerteToDelete(null)
      showToast("delete")
    } catch (error) {
      console.error(error)
      alert("Erreur lors de la suppression ❌")
    }
  }

  /* =========================
     MODIFICATION
  ========================= */
  const handleEdit = (perte) => {
    setSelectedPerte(perte)
    setEditForm({
      quantite: perte.produit,
      commentaire: perte.commentaire || "",
    })
    setShowEditModal(true)
  }

  const handleUpdatePerte = async () => {
    try {
      await api.put(`/pertes/${selectedPerte.id}`, {   // ✅ était : axios.put("http://localhost:8000/api/pertes/...")
        produit: editForm.quantite,
        commentaire: editForm.commentaire,
      })

      setPertes(prev =>
        prev.map(p =>
          p.id === selectedPerte.id
            ? { ...p, produit: editForm.quantite, commentaire: editForm.commentaire }
            : p
        )
      )

      setShowEditModal(false)
      setSelectedPerte(null)
      showToast("edit")
    } catch (error) {
      alert("Erreur lors de la modification")
    }
  }

  if (loading) {
    return <p className="text-center mt-4">Chargement des pertes...</p>
  }

  return (
    <div className="container-fluid mt-4">

      <Header
        handleCategoryFilter={handleServiceFilter}
        serviceFilter={serviceFilter}
      />

      <div className="text-center" style={{ marginTop: "2cm" }}>
        <h4 className="mb-3 text-danger fw-bold">
          📉 Gestion des pertes
        </h4>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">

        <div>
          <button className="btn btn-success dropdown-toggle" data-bs-toggle="dropdown">
            📤 Exporter
          </button>
          <ul className="dropdown-menu">
            <li><button className="dropdown-item" onClick={() => exportPertes("tous")}>📄 Exporter tous</button></li>
            <li><hr className="dropdown-divider" /></li>
            <li><button className="dropdown-item" onClick={() => exportPertes("Boisson / Resto")}>Boisson / Resto</button></li>
            <li><button className="dropdown-item" onClick={() => exportPertes("Boisson / Détente")}>Boisson / Détente</button></li>
            <li><button className="dropdown-item" onClick={() => exportPertes("Boisson / Snack")}>Boisson / Snack</button></li>
            <li><hr className="dropdown-divider" /></li>
            <li><button className="dropdown-item" onClick={() => exportPertes("Salle / Resto")}>Salle / Resto</button></li>
            <li><button className="dropdown-item" onClick={() => exportPertes("Salle / Détente")}>Salle / Détente</button></li>
            <li><button className="dropdown-item" onClick={() => exportPertes("Salle / Snack")}>Salle / Snack</button></li>
          </ul>
        </div>

        <div style={{ width: "60%" }}>
          <div className="mb-4 mb-0">
            <div className="row align-items-center">
              <div className="col-md-8">
                <div className="input-group">
                  <span className="input-group-text bg-light">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Rechercher ..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                  {searchTerm && (
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={handleClearSearch}
                      title="Effacer la recherche"
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  )}
                </div>
              </div>
              <div className="col-md-4 text-end">
                {searchTerm && (
                  <div className="mt-4">
                    <span className="badge bg-info text-dark fs-6">
                      {filteredPertes.length} résultat(s) trouvé(s)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* PAGINATION TOP */}
      <div className="container mt-3 pt-4">
        <div className="row align-items-center mb-2">
          <div className="col-4 text-start">
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              ⬅ Précédent
            </button>
          </div>
          <div className="col-4 text-center">
            <span className="fw-bold">
              Page {currentPage} / {totalPages || 1}
            </span>
          </div>
          <div className="col-4 text-end">
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Suivant ➡
            </button>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="table-responsive shadow-sm">
        <table className="table table-hover align-middle">
          <thead className="bg-dark text-white">
            <tr>
              <th>#</th>
              <th>Catégorie</th>
              <th>Libellé</th>
              <th>Produit perdue</th>
              <th>Commentaire</th>
              <th>Date</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPertes.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center text-muted">
                  Aucune perte trouvée
                </td>
              </tr>
            )}
            {paginatedPertes.map((perte, index) => (
              <tr key={perte.id}>
                <td className="fw-bold">
                  {(currentPage - 1) * PER_PAGE + index + 1}
                </td>
                <td>
                  <span className="badge bg-warning text-dark">
                    {perte.article?.categorie}
                  </span>
                </td>
                <td>{perte.article?.libelle}</td>
                <td className="fw-bold">{perte.produit}</td>
                <td className="text-muted">{perte.commentaire || "—"}</td>
                <td>{new Date(perte.created_at).toLocaleString()}</td>
                <td className="text-center">
                  <div className="btn-group btn-group-sm">
                    <button
                      className="btn btn-outline-primary"
                      title="Modifier"
                      onClick={() => handleEdit(perte)}
                    >
                      ✏️
                    </button>
                    <button
                      className="btn btn-outline-danger"
                      title="Supprimer"
                      onClick={() => handleDelete(perte.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL MODIFICATION */}
      {showEditModal && selectedPerte && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: "rgba(0,0,0,0.35)", zIndex: 2000 }}
        >
          <div className="bg-white rounded shadow" style={{ width: "500px", maxWidth: "95%" }}>
            <div className="d-flex justify-content-between align-items-center px-3 py-2 bg-danger text-white rounded-top">
              <h5 className="mb-0">✏️ Modifier la perte</h5>
              <button className="btn btn-sm btn-light" onClick={() => setShowEditModal(false)}>✖</button>
            </div>
            <div className="p-3">
              <div className="mb-3">
                <label className="form-label">Article</label>
                <input className="form-control" value={selectedPerte.article?.libelle || ""} disabled />
              </div>
              <div className="mb-3">
                <label className="form-label">Service</label>
                <input className="form-control" value={selectedPerte.article?.categorie || ""} disabled />
              </div>
              <div className="mb-3">
                <label className="form-label">Quantité perdue</label>
                <input
                  type="number"
                  className="form-control"
                  value={editForm.quantite}
                  onChange={(e) => setEditForm({ ...editForm, quantite: e.target.value })}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Commentaire</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={editForm.commentaire}
                  onChange={(e) => setEditForm({ ...editForm, commentaire: e.target.value })}
                />
              </div>
            </div>
            <div className="d-flex justify-content-end gap-2 p-3 border-top">
              <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleUpdatePerte}>💾 Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SUPPRESSION */}
      {showDeleteModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">Confirmation de suppression</h5>
                <button className="btn-close" onClick={() => setShowDeleteModal(false)} />
              </div>
              <div className="modal-body">
                Voulez-vous vraiment supprimer cette perte ?
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Annuler</button>
                <button className="btn btn-danger" onClick={confirmDelete}>Oui, supprimer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {successMessage && (
        <div
          className="position-fixed top-0 start-50 translate-middle-x mt-4"
          style={{ zIndex: 3000, minWidth: "340px" }}
        >
          <div
            className={`alert shadow-lg d-flex align-items-center gap-3 px-4 py-3 rounded-3 border-0 ${
              successMessage === "edit" ? "alert-success" : "alert-danger"
            }`}
            style={{ animation: "fadeSlideIn 0.35s ease", fontSize: "1rem" }}
          >
            <span style={{ fontSize: "1.6rem" }}>
              {successMessage === "edit" ? "✅" : "🗑️"}
            </span>
            <div>
              <strong>
                {successMessage === "edit" ? "Modification réussie !" : "Suppression réussie !"}
              </strong>
              <div style={{ fontSize: "0.85rem", opacity: 0.85 }}>
                {successMessage === "edit"
                  ? "La perte a été modifiée avec succès."
                  : "La perte a été supprimée avec succès."}
              </div>
            </div>
          </div>
          <style>{`
            @keyframes fadeSlideIn {
              from { opacity: 0; transform: translateY(-20px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}

    </div>
  )
}
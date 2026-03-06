import { useState, useEffect } from "react"
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap/dist/js/bootstrap.bundle.min.js"

const AjoutClient = ({
  showModal,
  setShowModal,
  selectedArticle,
  produitValue,
  setProduitValue,
  handleSubmitProduct,
}) => {
  const [showConfirm, setShowConfirm] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [quantiteError, setQuantiteError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [dateAjout, setDateAjout] = useState("")
  const [heureAjout, setHeureAjout] = useState("")

  // Initialiser date & heure automatiquement
  useEffect(() => {
    if (showModal && selectedArticle) {
      const now = new Date()

      setDateAjout(now.toISOString().split("T")[0])

      const hours = String(now.getHours()).padStart(2, "0")
      const minutes = String(now.getMinutes()).padStart(2, "0")
      setHeureAjout(`${hours}:${minutes}`)
    }
  }, [showModal, selectedArticle])

  if (!showModal || !selectedArticle) return null

  // Gestion quantité
  const handleQuantiteChange = (e) => {
    const value = e.target.value

    if (value === "") {
      setProduitValue("")
      setQuantiteError("")
      return
    }

    /*if (!/^\d*\.?\d*$/.test(value)) {
      setQuantiteError("⚠️ Seuls les chiffres sont autorisés")
      return
    }*/

    if (parseFloat(value) <= 0) {
      setQuantiteError("⚠️ La quantité doit être supérieure à zéro")
      return
    }

    setProduitValue(value)
    setQuantiteError("")
  }

  // Ouvrir confirmation
  const handleSubmitWithConfirm = (e) => {
    e.preventDefault()

    if (!produitValue || quantiteError) {
      setQuantiteError("⚠️ Veuillez entrer une quantité valide")
      return
    }

    setShowConfirm(true)
  }

  // Validation finale
  const handleConfirmAdd = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await handleSubmitProduct(e, dateAjout, heureAjout)

      setShowConfirm(false)
      setShowToast(true)

      setTimeout(() => {
        setShowToast(false)
        setShowModal(false)
      }, 1500)
    } catch (error) {
      console.error("Erreur ajout produit :", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* 🔵 MODALE PRINCIPALE */}
      <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.08)" }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Ajouter une quantité</h5>
              <button className="btn-close" onClick={() => setShowModal(false)} />
            </div>

            <form onSubmit={handleSubmitWithConfirm}>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label>ID</label>
                    <input className="form-control" value={selectedArticle.id} disabled />
                  </div>
                  <div className="col-md-6">
                    <label>Libellé</label>
                    <input className="form-control" value={selectedArticle.libelle} disabled />
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-8">
                    <label>Quantité à ajouter *</label>
                    <input
                      className={`form-control ${quantiteError ? "is-invalid" : ""}`}
                      value={produitValue}
                      onChange={handleQuantiteChange}
                      placeholder="Ex: 5"
                      autoFocus
                    />
                    {quantiteError && (
                      <div className="invalid-feedback d-block">{quantiteError}</div>
                    )}
                    <small className="text-muted">
                      Produit actuelle : <strong>{selectedArticle.produit}</strong> {selectedArticle.unite}
                    </small>
                  </div>
                  <div className="col-md-4">
                    <label>Unité</label>
                    <input className="form-control" value={selectedArticle.unite} disabled />
                  </div>
                </div>


              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Annuler
                </button>
                <button className="btn btn-success" type="submit">
                  Ajouter le produit
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* 🟡 MODALE CONFIRMATION */}
      {showConfirm && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.35)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-success">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">Confirmation</h5>
                <button className="btn-close" onClick={() => setShowConfirm(false)} />
              </div>
              <div className="modal-body">
                <p>Voulez-vous vraiment ajouter ce produit au stock ?</p>
                <ul className="list-unstyled">
                  <li><strong>Produit :</strong> {selectedArticle.libelle}</li>
                  <li><strong>Quantité :</strong> {produitValue} {selectedArticle.unite}</li>
                </ul>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>
                  Annuler
                </button>
                <button
                  className="btn btn-success"
                  onClick={handleConfirmAdd}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Ajout..." : "Oui, ajouter"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 TOAST SUCCÈS */}
      <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 9999 }}>
        <div className={`toast text-white bg-success ${showToast ? "show" : ""}`}>
          <div className="d-flex">
            <div className="toast-body fw-semibold">
              ✅ Produit ajouté avec succès au stock !
            </div>
            <button
              className="btn-close btn-close-white me-2 m-auto"
              onClick={() => setShowToast(false)}
            />
          </div>
        </div>
      </div>
    </>
  )
}

export default AjoutClient

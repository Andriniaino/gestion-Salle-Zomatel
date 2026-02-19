import { useState, useEffect } from "react"


const AjoutModal = ({
  showModal,
  setShowModal,
  editingArticle,
  formDataArticle,
  handleInputChange,
  handleSubmitArticle,
  saveLoading,
  setEditingArticle,
}) => {
  const [validationErrors, setValidationErrors] = useState({
    id: "",
    produit: "",
    prix: "",
  })

  const [showCustomCategorie, setShowCustomCategorie] = useState(false)
  const [showCustomUnite, setShowCustomUnite] = useState(false)

  const [selectedCategorie, setSelectedCategorie] = useState("");

  // ✅ Synchroniser selectedCategorie avec formDataArticle lors de l'ouverture
  useEffect(() => {
    if (showModal) {
      setValidationErrors({ id: "", produit: "", prix: "" })

      // Liste des catégories prédéfinies
      const predefinedCategories = [
        "boisson/resto",
        "salle/resto",
        "boisson/snack",
        "salle/snack",
        "boisson/detente",
        "salle/detente",
      ]

      // Si la catégorie existe dans formDataArticle
      if (formDataArticle.categorie) {
        if (predefinedCategories.includes(formDataArticle.categorie)) {
          // Catégorie standard → sélectionner dans le dropdown
          setSelectedCategorie(formDataArticle.categorie)
          setShowCustomCategorie(false)
        } else {
          // Catégorie personnalisée → afficher le champ texte
          setSelectedCategorie("autre")
          setShowCustomCategorie(true)
        }
      } else {
        // Pas de catégorie → réinitialiser
        setSelectedCategorie("")
        setShowCustomCategorie(false)
      }

      // Gérer l'unité de la même manière
      const predefinedUnits = ["piece", "cl"]
      if (formDataArticle.unite) {
        if (predefinedUnits.includes(formDataArticle.unite)) {
          setShowCustomUnite(false)
        } else {
          setShowCustomUnite(true)
        }
      } else {
        setShowCustomUnite(false)
      }
    }
  }, [showModal, formDataArticle.categorie, formDataArticle.unite])

  if (!showModal) return null

  const handleNumericInputChange = (e) => {
    const { name, value } = e.target

    if (value === "") {
      handleInputChange(e)
      setValidationErrors((prev) => ({ ...prev, [name]: "" }))
      return
    }

    const numericRegex = /^\d*\.?\d*$/
    if (!numericRegex.test(value)) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: "⚠️ Seuls les chiffres sont autorisés",
      }))
      return
    }

    const numValue = parseFloat(value)
    if (numValue < 0) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: "⚠️ La valeur doit être positive",
      }))
      return
    }

    setValidationErrors((prev) => ({ ...prev, [name]: "" }))
    handleInputChange(e)
  }

  const handleFormSubmit = (e) => {
    e.preventDefault()

    const hasErrors = Object.values(validationErrors).some((error) => error !== "")
    if (hasErrors) return

    // Quantité = 0 à l'ajout
    if (!editingArticle) {
      formDataArticle.produit = 0
    }

    handleSubmitArticle(e)
  }

  return (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          {/* HEADER */}
          <div className="modal-header">
            <h5 className="modal-title">
              {editingArticle ? "Modifier l'article" : "Ajouter un article"}
            </h5>
            <button className="btn-close" onClick={() => setShowModal(false)} />
          </div>

          {/* FORM */}
          <form onSubmit={handleFormSubmit}>
            <div className="modal-body">
              {/* ID + Catégorie */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">ID</label>
                  <input
                    type="text"
                    className={`form-control ${validationErrors.id ? "is-invalid" : ""}`}
                    name="id"
                    value={formDataArticle.id || ""}
                    onChange={handleNumericInputChange}
                    disabled={!!editingArticle}
                  />
                  {validationErrors.id && (
                    <div className="invalid-feedback d-block">{validationErrors.id}</div>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label">Catégorie</label>

                  <select
                    className="form-select"
                    value={selectedCategorie}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedCategorie(value);

                      if (value === "autre") {
                        setShowCustomCategorie(true);
                        handleInputChange({
                          target: { name: "categorie", value: "" },
                        });
                      } else {
                        setShowCustomCategorie(false);
                        handleInputChange({
                          target: { name: "categorie", value },
                        });
                      }
                    }}
                    required
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="boisson/resto">Boisson / Resto</option>
                    <option value="salle/resto">Salle / Resto</option>
                    <option value="boisson/snack">Boisson / Snack</option>
                    <option value="salle/snack">Salle / Snack</option>
                    <option value="boisson/detente">Boisson / Détente</option>
                    <option value="salle/detente">Salle / Détente</option>
                    <option value="autre">➕ Autre catégorie</option>
                  </select>

                  {showCustomCategorie && (
                    <input
                      type="text"
                      className="form-control mt-2"
                      placeholder="Entrer la nouvelle catégorie"
                      value={formDataArticle.categorie}
                      onChange={(e) =>
                        handleInputChange({
                          target: { name: "categorie", value: e.target.value },
                        })
                      }
                      required
                    />
                  )}
                </div>


              </div>

              {/* Libellé + Quantité + Unité */}
              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label">Libellé</label>
                  <input
                    type="text"
                    className="form-control"
                    name="libelle"
                    value={formDataArticle.libelle || ""}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* Quantité visible UNIQUEMENT en modification */}
                {editingArticle && (
                  <div className="col-md-4">
                    <label className="form-label">Quantité</label>
                    <input
                      type="text"
                      className={`form-control ${validationErrors.produit ? "is-invalid" : ""
                        }`}
                      name="produit"
                      value={formDataArticle.produit ?? 0}
                      onChange={handleNumericInputChange}
                    />
                    {validationErrors.produit && (
                      <div className="invalid-feedback d-block">
                        {validationErrors.produit}
                      </div>
                    )}
                  </div>
                )}

                <div className="col-md-4">
                  <label className="form-label">Unité</label>

                  <select
                    className="form-select"
                    value={
                      showCustomUnite
                        ? "autre"
                        : formDataArticle.unite || ""
                    }
                    onChange={(e) => {
                      const value = e.target.value

                      if (value === "autre") {
                        setShowCustomUnite(true)
                        handleInputChange({
                          target: { name: "unite", value: "" },
                        })
                      } else {
                        setShowCustomUnite(false)
                        handleInputChange({
                          target: { name: "unite", value },
                        })
                      }
                    }}
                    required
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="piece">Pièce</option>
                    <option value="cl">Centilitre</option>
                    <option value="autre">➕ Autre unité</option>
                  </select>

                  {showCustomUnite && (
                    <input
                      type="text"
                      className="form-control mt-2"
                      placeholder="Nouvelle unité"
                      value={formDataArticle.unite || ""}
                      onChange={(e) =>
                        handleInputChange({
                          target: { name: "unite", value: e.target.value },
                        })
                      }
                      required
                    />
                  )}
                </div>

              </div>

              {/* Prix */}
              <div className="mb-3">
                <label className="form-label">Prix (Ariary)</label>
                <input
                  type="text"
                  className={`form-control ${validationErrors.prix ? "is-invalid" : ""}`}
                  name="prix"
                  value={formDataArticle.prix || ""}
                  onChange={handleNumericInputChange}
                  required
                />
                {validationErrors.prix && (
                  <div className="invalid-feedback d-block">{validationErrors.prix}</div>
                )}
              </div>
            </div>

            {/* FOOTER */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowModal(false)
                  setEditingArticle(null)
                }}
              >
                Annuler
              </button>

              <button type="submit" className="btn btn-primary" disabled={saveLoading}>
                {saveLoading
                  ? "Enregistrement..."
                  : editingArticle
                    ? "Modifier"
                    : "Ajouter"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AjoutModal
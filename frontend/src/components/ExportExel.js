"use client"
import { saveAs } from "file-saver"
import api from "../services/api"
import { useAuth } from "../contexts/AuthContext"

const ExportExel = () => {
  const { user } = useAuth()

  const categories = [
    "boisson/snack",
    "salle/snack",
    "boisson/resto",
    "salle/resto",
    "boisson/detente",
    "salle/detente",
  ]

  const handleExport = async (searchTerm = "") => {
    try {
      const response = await api.get("/articles/export/excel", {
        responseType: "blob",
        params: searchTerm ? { search: searchTerm } : {},
      })

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })

      const safeCategory = searchTerm ? searchTerm.replace(/\//g, "-") : "Tous"
      const safeDate = new Date().toLocaleDateString("fr-FR").replace(/\//g, "-")

      saveAs(blob, `Articles_${safeCategory}_${safeDate}.xlsx`)
    } catch (error) {
      console.error("Erreur lors de l'export Excel:", error)
      alert(error.message || "Erreur lors de l'export. Vérifiez que le serveur est démarré.")
    }
  }

  const availableCategories =
    user?.categorie === "admin" ? categories : categories.filter((cat) => cat.includes(user?.categorie))

  return (
    <div className="dropdown">
      <ul className="dropdown-menu" aria-labelledby="dropdownExportButton">
        {/* Tous les articles (de la catégorie autorisée) */}
        <li>
          <button className="dropdown-item" onClick={() => handleExport()}>
            {user?.categorie === "admin" ? "Tous les articles" : `Tous (${user?.categorie})`}
          </button>
        </li>

        {availableCategories.length > 0 && (
          <>
            <li>
              <hr className="dropdown-divider" />
            </li>
            {/* Export par sous-catégorie */}
            {availableCategories.map((cat, index) => (
              <li key={index}>
                <button className="dropdown-item" onClick={() => handleExport(cat)}>
                  {cat}
                </button>
              </li>
            ))}
          </>
        )}
      </ul>
    </div>
  )
}

export default ExportExel

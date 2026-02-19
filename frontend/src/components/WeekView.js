"use client"

import { useState, useEffect, useMemo } from "react"
import * as XLSX from "xlsx"
import api from "../services/api"
import axios from "axios"
import { useAuth } from "../contexts/AuthContext"

const WeekView = ({ onBack, selectedCategory }) => {
  const { user } = useAuth()
  const [weeks, setWeeks] = useState([])
  const [filteredWeeks, setFilteredWeeks] = useState([])
  const [selectedWeek, setSelectedWeek] = useState(null)
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchWeek, setSearchWeek] = useState("")
  const [error, setError] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // --- PAGINATION ARTICLES ---
  const [articlePage, setArticlePage] = useState(1)
  const articlesPerPage = 10

  // --- PAGINATION SEMAINES ---
  const [weekPage, setWeekPage] = useState(1)
  const weeksPerPage = 6

  //date
  // Fonction de formatage des dates au format JJ/MM/AAAA
  const formatDateDisplay = (dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)

    // Format JJ/MM/AAAA
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()

    return `${day}/${month}/${year}`
  }

  // --- TRI DYNAMIQUE ---
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" })

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" }
      }
      return { key, direction: "asc" }
    })
    setArticlePage(1)
  }

  // --- Chargement des semaines ---
  useEffect(() => {
    fetchWeeks()
  }, [])

  const fetchWeeks = async () => {
    setLoading(true)
    try {
      const res = await api.get("/articleweeks")
      // S'assurer que data est toujours un tableau
      const responseData = res.data?.data || res.data || []
      const data = Array.isArray(responseData) ? responseData : []
      setWeeks(data)
      setFilteredWeeks(data)
    } catch (err) {
      console.error(err)
      setError("Erreur lors du chargement des semaines")
      setWeeks([])
      setFilteredWeeks([])
    } finally {
      setLoading(false)
    }
  }

  const fetchWeekArticles = async (semaine, annee) => {
    setLoading(true)
    try {
      const res = await api.get(`/articleweeks/week/${semaine}/${annee}`)
      // S'assurer que la réponse est toujours un tableau
      const responseData = res.data?.data || res.data || []
      const data = Array.isArray(responseData) ? responseData : []
      setArticles(data)
      setSelectedWeek({ semaine, annee })
      setArticlePage(1)
      setSearchTerm("")
      setSortConfig({ key: null, direction: "asc" })
    } catch (err) {
      console.error(err)
      setError("Erreur lors du chargement des articles")
      setArticles([]) // S'assurer que articles est un tableau vide en cas d'erreur
    } finally {
      setLoading(false)
    }
  }

  const filteredArticles = useMemo(() => {
    // S'assurer que articles est toujours un tableau
    if (!Array.isArray(articles)) {
      return []
    }

    let result = [...articles]

    // Filtrer par recherche
    if (searchTerm?.trim()) {
      const lower = searchTerm.toLowerCase()
      result = result.filter((a) => {
        return (
          a.article_id?.toString().toLowerCase().includes(lower) ||
          a.libelle?.toString().toLowerCase().includes(lower) ||
          a.categorie?.toString().toLowerCase().includes(lower) ||
          a.produit?.toString().toLowerCase().includes(lower)
        )
      })
    }

    // Filtrer par catégorie sélectionnée dans le header
    if (selectedCategory) {
      result = result.filter((a) => {
        return a.categorie?.toLowerCase().includes(selectedCategory.toLowerCase())
      })
    }

    if (startDate || endDate) {
      result = result.filter((a) => {
        if (!a.date) return false

        const articleDate = new Date(a.date)
        articleDate.setHours(0, 0, 0, 0)

        if (startDate) {
          const start = new Date(startDate)
          start.setHours(0, 0, 0, 0)
          if (articleDate < start) return false
        }

        if (endDate) {
          const end = new Date(endDate)
          end.setHours(23, 59, 59, 999)
          if (articleDate > end) return false
        }

        return true
      })
    }

    return result
  }, [articles, searchTerm, selectedCategory, startDate, endDate])

  // --- Tri appliqué SUR L'ENSEMBLE filtré (important) ---
  const sortedAllArticles = useMemo(() => {
    // S'assurer que filteredArticles est toujours un tableau
    if (!Array.isArray(filteredArticles)) {
      return []
    }

    const arr = [...filteredArticles]
    if (!sortConfig.key) return arr

    const key = sortConfig.key
    const dir = sortConfig.direction === "asc" ? 1 : -1

    arr.sort((a, b) => {
      const rawA = a[key]
      const rawB = b[key]

      const numA = rawA === undefined || rawA === null ? Number.NaN : Number.parseFloat(rawA)
      const numB = rawB === undefined || rawB === null ? Number.NaN : Number.parseFloat(rawB)

      const bothNumbers = !Number.isNaN(numA) && !Number.isNaN(numB)

      if (bothNumbers) {
        if (numA < numB) return -1 * dir
        if (numA > numB) return 1 * dir
        return 0
      }

      const strA = (rawA ?? "").toString().toLowerCase()
      const strB = (rawB ?? "").toString().toLowerCase()
      return strA.localeCompare(strB, "fr", { numeric: true }) * dir
    })

    return arr
  }, [filteredArticles, sortConfig])

  useEffect(() => {
    if (!Array.isArray(weeks)) {
      setFilteredWeeks([])
      return
    }
    if (searchWeek === "") {
      setFilteredWeeks(weeks)
    } else {
      setFilteredWeeks(weeks.filter((w) => w && w.semaine && w.semaine.toString() === searchWeek.trim()))
    }
    setWeekPage(1)
  }, [searchWeek, weeks])

  const totalWeekPages = Math.ceil((Array.isArray(filteredWeeks) ? filteredWeeks.length : 0) / weeksPerPage)
  const currentWeeks = Array.isArray(filteredWeeks) ? filteredWeeks.slice((weekPage - 1) * weeksPerPage, weekPage * weeksPerPage) : []

  const totalArticlePages = Math.ceil(sortedAllArticles.length / articlesPerPage)
  const currentArticles = sortedAllArticles.slice((articlePage - 1) * articlesPerPage, articlePage * articlesPerPage)

  // --- Export Excel (côté client, données déjà chargées) ---
  const handleExportExcel = (categorie) => {
    if (!selectedWeek) return

    const catNorm = (c) => (c || "").toLowerCase().replace(/\s*\/\s*/g, "/")
    let toExport = sortedAllArticles
    if (categorie) {
      const normCat = catNorm(categorie)
      toExport = toExport.filter((a) => catNorm(a.categorie) === normCat)
    }

    const wsData = toExport.map((a) => ({
      ID: a.article_id,
      Catégorie: a.categorie,
      Libellé: a.libelle,
      Produit: a.produit,
      Date: a.date ? formatDate(a.date) : "N/A",
      Semaine: a.semaine,
      Année: a.annee,
    }))

    const ws = XLSX.utils.json_to_sheet(wsData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Articles")

    const filename = categorie
      ? `articles_${selectedWeek.semaine}_${selectedWeek.annee}_${categorie.replace(/\//g, "_")}.xlsx`
      : `articles_${selectedWeek.semaine}_${selectedWeek.annee}.xlsx`

    XLSX.writeFile(wb, filename)
    setError("")
  }

  

  const getCategoryBadgeClass = (categorie = "") => {
    const c = (categorie ?? "").toLowerCase()
    if (c.includes("resto")) return "bg-primary"
    if (c.includes("snack")) return "bg-warning text-dark"
    if (c.includes("detente")) return "bg-info text-dark"
    return "bg-secondary"
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  if (loading && weeks.length === 0)
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    )

  return (
    <div>
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError("")}></button>
        </div>
      )}

      <div className="container mt-3 pt-5">
        <div className="row mb-3">
          <div className="col-12 d-flex justify-content-between align-items-center flex-wrap">
            
          </div>
        </div>
      </div>

      {!selectedWeek ? (
        <div className="card shadow bg-transparent">
          <div className="card-body">
            <h4 className="mb-3 text-center text-black">Sélectionner une semaine</h4>

            <div className="mb-3 d-flex justify-content-end">
              {/* CHAMP DE RECHERCHE SEMAINE (PREMIER) */}
              <input
                type="text"
                className="form-control w-25 text-center"
                placeholder="N° semaine..."
                value={searchWeek}
                inputMode="numeric"
                pattern="[0-9]*"
                // INTERCEPTION TOTALE DES LETTRES
                onInput={(e) => {
                  const input = e.target
                  const cleaned = input.value.replace(/[^0-9]/g, "")

                  if (cleaned !== input.value) {
                    input.value = cleaned
                  }

                  if (cleaned.length <= 2) {
                    setSearchWeek(cleaned)
                  }
                }}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, "")
                  setSearchWeek(value.length <= 2 ? value : value.slice(0, 2))
                }}
                onKeyDown={(e) => {
                  // TOUCHES AUTORISÉES SEULEMENT
                  const allowedKeys = [
                    "0",
                    "1",
                    "2",
                    "3",
                    "4",
                    "5",
                    "6",
                    "7",
                    "8",
                    "9",
                    "Backspace",
                    "Delete",
                    "ArrowLeft",
                    "ArrowRight",
                    "Tab",
                    "Home",
                    "End",
                  ]

                  // BLOQUE Ctrl+V (coller)
                  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
                    e.preventDefault()
                    return
                  }

                  // BLOQUE toute touche non autorisée
                  if (!allowedKeys.includes(e.key)) {
                    e.preventDefault()
                  }
                }}
                onPaste={(e) => {
                  e.preventDefault()
                  const pasteData = e.clipboardData.getData("text")
                  const numbersOnly = pasteData.replace(/[^0-9]/g, "")
                  if (numbersOnly.length <= 2) {
                    setSearchWeek(numbersOnly)
                  }
                }}
                onDrop={(e) => e.preventDefault()}
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
              />
            </div>

            {filteredWeeks.length === 0 ? (
              <p className="text-muted text-center">Aucune semaine trouvée.</p>
            ) : (
              <>
                <div className="row">
                  {currentWeeks.map((week) => (
                    <div key={`${week.semaine}-${week.annee}`} className="col-md-4 mb-3">
                      <div
                        className="card h-100 shadow-sm"
                        style={{ cursor: "pointer" }}
                        onClick={() => fetchWeekArticles(week.semaine, week.annee)}
                      >
                        <div className="card-body text-center">
                          <h4 className="card-title">Semaine {week.semaine}</h4>
                          <p className="card-text text-muted">Année {week.annee}</p>
                          <span className="badge bg-primary">{week.count} articles</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {totalWeekPages > 1 && (
                  <div className="d-flex justify-content-center align-items-center mt-3">
                    <button
                      className="btn btn-outline-primary me-2"
                      onClick={() => setWeekPage((p) => Math.max(p - 1, 1))}
                      disabled={weekPage === 1}
                    >
                      ← Précédent
                    </button>
                    <span>
                      Page <strong>{weekPage}</strong> / {totalWeekPages}
                    </span>
                    <button
                      className="btn btn-outline-primary ms-2"
                      onClick={() => setWeekPage((p) => Math.min(p + 1, totalWeekPages))}
                      disabled={weekPage === totalWeekPages}
                    >
                      Suivant →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="card shadow mb-3 bg-light">
            <div className="card-body py-3">
              <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
                {/* GROUPE GAUCHE : Changement de semaine + Export Excel */}
                <div className="d-flex align-items-center gap-2">
                  {/* Bouton retour semaine */}
                  <button className="btn btn-light border" onClick={() => setSelectedWeek(null)}>
                    <i className="bi bi-arrow-left"></i> Changer de semaine
                  </button>

                  {/* Dropdown Export par catégorie */}
                  <div className="dropdown">
                    <button
                      className="btn btn-info dropdown-toggle"
                      type="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <i className="bi bi-file-earmark-excel"></i> Exporter Excel
                    </button>
                    <ul className="dropdown-menu">
                      <li>
                        <h6 className="dropdown-header">Boisson</h6>
                      </li>
                      <li>
                        <button className="dropdown-item" onClick={() => handleExportExcel("boisson/snack")}>
                          Boisson / Snack
                        </button>
                      </li>
                      <li>
                        <button className="dropdown-item" onClick={() => handleExportExcel("boisson/detente")}>
                          Boisson / Détente
                        </button>
                      </li>
                      <li>
                        <button className="dropdown-item" onClick={() => handleExportExcel("boisson/resto")}>
                          Boisson / Resto
                        </button>
                      </li>
                      <li>
                        <hr className="dropdown-divider" />
                      </li>
                      <li>
                        <h6 className="dropdown-header">Salle</h6>
                      </li>
                      <li>
                        <button className="dropdown-item" onClick={() => handleExportExcel("salle/snack")}>
                          Salle / Snack
                        </button>
                      </li>
                      <li>
                        <button className="dropdown-item" onClick={() => handleExportExcel("salle/detente")}>
                          Salle / Détente
                        </button>
                      </li>
                      <li>
                        <button className="dropdown-item" onClick={() => handleExportExcel("salle/resto")}>
                          Salle / Resto
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* GROUPE CENTRE-DROITE : Recherche par dates */}
                <div className="d-flex align-items-center gap-2">
                  {/* DATE DÉBUT */}
                  <div className="d-flex align-items-center gap-2">
                    <label className="fw-bold mb-0 text-nowrap">Du</label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      style={{ width: 150 }}
                      value={startDate}
                      max={endDate || undefined}
                      onChange={(e) => {
                        const newStartDate = e.target.value
                        setStartDate(newStartDate)

                        if (endDate && endDate < newStartDate) {
                          setEndDate("")
                        }

                        setArticlePage(1)
                      }}
                    />
                  </div>

                  {/* DATE FIN */}
                  <div className="d-flex align-items-center gap-2">
                    <label className="fw-bold mb-0 text-nowrap">Au</label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      style={{ width: 150 }}
                      value={endDate}
                      min={startDate || undefined}
                      disabled={!startDate}
                      title={!startDate ? "Sélectionnez d'abord une date de début" : ""}
                      onChange={(e) => {
                        const newEndDate = e.target.value
                        if (startDate && newEndDate < startDate) return
                        setEndDate(newEndDate)
                        setArticlePage(1)
                      }}
                    />
                  </div>

                  {/* BOUTON RESET DATES */}
                  {(startDate || endDate) && (
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      title="Effacer la période"
                      onClick={() => {
                        setStartDate("")
                        setEndDate("")
                        setArticlePage(1)
                      }}
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  )}
                </div>

                {/* GROUPE DROITE : Recherche globale */}
                <div className="d-flex align-items-center gap-2" style={{ minWidth: 250 }}>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Rechercher par n° ou nom..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setArticlePage(1)
                    }}
                  />
                  {searchTerm && (
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      title="Effacer la recherche"
                      onClick={() => {
                        setSearchTerm("")
                        setArticlePage(1)
                      }}
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow" style={{ backgroundColor: "rgba(255,255,255,0.45)" }}>
            <div className="card-body">
              <h4 className="mb-3">
                Semaine {selectedWeek.semaine} - {selectedWeek.annee}
                {searchTerm && <span className="text-muted ms-2">(Filtré : {searchTerm})</span>}
                {selectedCategory && <span className="badge bg-secondary ms-2">{selectedCategory}</span>}
              </h4>
              {totalArticlePages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => setArticlePage((p) => Math.max(p - 1, 1))}
                    disabled={articlePage === 1}
                  >
                    ◀ Précédent
                  </button>
                  <span>
                    Page {articlePage} / {totalArticlePages}
                  </span>
                  <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => setArticlePage((p) => Math.min(p + 1, totalArticlePages))}
                    disabled={articlePage === totalArticlePages}
                  >
                    Suivant ▶
                  </button>
                </div>
              )}
              <div className="table-responsive">
                <table className="table table-hover table-bordered">
                  <thead className="table-light">
                    <tr>
                      <th style={{ cursor: "pointer" }} onClick={() => handleSort("article_id")}>
                        ID {sortConfig.key === "article_id" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                      </th>
                      <th style={{ cursor: "pointer" }} onClick={() => handleSort("categorie")}>
                        Catégorie {sortConfig.key === "categorie" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                      </th>
                      <th style={{ cursor: "pointer" }} onClick={() => handleSort("libelle")}>
                        Libellé {sortConfig.key === "libelle" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                      </th>
                      <th style={{ cursor: "pointer" }} onClick={() => handleSort("produit")}>
                        Produit {sortConfig.key === "produit" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                      </th>
                      <th style={{ cursor: "pointer" }} onClick={() => handleSort("date")}>
                        Date {sortConfig.key === "date" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                      </th>
                      <th>Semaine</th>
                      <th>Année</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentArticles.length > 0 ? (
                      currentArticles.map((article, i) => (
                        <tr key={article.id_week || i}>
                          <td>{article.article_id}</td>
                          <td>
                            <span className={`badge ${getCategoryBadgeClass(article.categorie)}`}>
                              {article.categorie}
                            </span>
                          </td>
                          <td>{article.libelle}</td>
                          <td>{article.produit}</td>
                          <td>{formatDate(article.date)}</td>
                          <td>{article.semaine}</td>
                          <td>{article.annee}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center text-muted">
                          Aucun article trouvé.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default WeekView

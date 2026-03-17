"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import * as XLSX from "xlsx"
import api from "../services/api"
import { useAuth } from "../contexts/AuthContext"

// ─── Helpers (hors composant, pas de re-création) ───────────────────────────
const getCatClass = (c = "") => {
  const v = (c ?? "").toLowerCase()
  if (v.includes("resto"))   return "cat-resto"
  if (v.includes("snack"))   return "cat-snack"
  if (v.includes("detente")) return "cat-detente"
  return "cat-default"
}

const getRowClass = (categorie = "") => {
  const v = (categorie ?? "").toLowerCase()
  if (v.includes("resto"))   return "table-primary"
  if (v.includes("snack"))   return "table-warning"
  if (v.includes("detente")) return "table-info"
  return "table-light"
}

const formatDate = (d) =>
  !d ? "N/A" : new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"2-digit", year:"numeric" })


const WeekView = ({ onBack, selectedCategory }) => {
  const { user } = useAuth()

  const [weeks, setWeeks]               = useState([])
  const [selectedWeek, setSelectedWeek] = useState(null)
  const [articles, setArticles]         = useState([])
  const [loading, setLoading]           = useState(false)
  const [searchTerm, setSearchTerm]     = useState("")
  const [error, setError]               = useState("")
  const [startDate, setStartDate]       = useState("")
  const [endDate, setEndDate]           = useState("")
  const [sortConfig, setSortConfig]     = useState({ key: null, direction: "asc" })
  const [dropdownOpen, setDropdownOpen] = useState(false)

  
  const articleWrapRef = useRef(null)  // <div> conteneur table articles
  const articleDtRef   = useRef(null)  // instance DataTables articles

  // ── Utilitaire : détruire + supprimer le <table> du conteneur ─────────────
  const destroyDt = (dtRef, wrapRef) => {
    if (dtRef.current) {
      try { dtRef.current.destroy(true) } catch (_) {}  // true = remove la table du DOM
      dtRef.current = null
    }
    // Sécurité : vider le conteneur au cas où
    if (wrapRef?.current) {
      while (wrapRef.current.firstChild) {
        wrapRef.current.removeChild(wrapRef.current.firstChild)
      }
    }
  }

  // ── Créer un <table> vierge dans le conteneur et retourner l'élément ──────
  const createTable = (wrapRef, theadHTML) => {
    if (!wrapRef.current) return null
    // Vider le conteneur d'abord
    while (wrapRef.current.firstChild) {
      wrapRef.current.removeChild(wrapRef.current.firstChild)
    }
    const table = document.createElement("table")
    table.className = "wv-t"
    table.innerHTML = `<thead>${theadHTML}</thead><tbody></tbody>`
    wrapRef.current.appendChild(table)
    return table
  }


  useEffect(() => { fetchWeeks() }, [])  // eslint-disable-line

  const fetchWeeks = async () => {
    setLoading(true)
    try {
      const res  = await api.get("/articleweeks")
      const raw  = res.data?.data || res.data || []
      setWeeks(Array.isArray(raw) ? raw : [])
    } catch {
      setError("Erreur lors du chargement des semaines")
      setWeeks([])
    } finally { setLoading(false) }
  }

  const fetchWeekArticles = useCallback(async (semaine, annee) => {
    setLoading(true)
    try {
      const res = await api.get(`/articleweeks/week/${semaine}/${annee}`)
      const raw = res.data?.data || res.data || []
      setArticles(Array.isArray(raw) ? raw : [])
      setSelectedWeek({ semaine, annee })
      setSearchTerm(""); setSortConfig({ key: null, direction: "asc" })
      setStartDate(""); setEndDate("")
    } catch {
      setError("Erreur lors du chargement des articles")
      setArticles([])
    } finally { setLoading(false) }
  }, [])


  useEffect(() => {
    if (!dropdownOpen) return
    const close = (e) => {
      if (!e.target.closest(".wv-dd")) setDropdownOpen(false)
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [dropdownOpen])

 
  const [searchWeek, setSearchWeek]     = useState("")
  const [weekPage, setWeekPage]         = useState(1)
  const [weeksPerPage, setWeeksPerPage] = useState(6)
  const weekPageOptions = [3, 6, 9, 12]

  const filteredWeeks = useMemo(() => {
    if (!searchWeek.trim()) return weeks
    return weeks.filter((w) => w?.semaine?.toString() === searchWeek.trim())
  }, [weeks, searchWeek])

  useEffect(() => { setWeekPage(1) }, [searchWeek, weeksPerPage])

  const totalWeekPages = useMemo(
  () => Math.max(1, Math.ceil(filteredWeeks.length / weeksPerPage)),
  [filteredWeeks.length, weeksPerPage]
)

const currentWeeks = useMemo(
  () => filteredWeeks.slice((weekPage - 1) * weeksPerPage, weekPage * weeksPerPage),
  [filteredWeeks, weekPage, weeksPerPage]
)

  useEffect(() => {
    if (!selectedWeek) destroyDt(articleDtRef, articleWrapRef)
  }, [selectedWeek])

 
  const filteredArticles = useMemo(() => {
    if (!Array.isArray(articles)) return []
    let r = [...articles]
    if (searchTerm?.trim()) {
      const l = searchTerm.toLowerCase()
      r = r.filter((a) =>
        a.article_id?.toString().toLowerCase().includes(l) ||
        a.libelle?.toString().toLowerCase().includes(l) ||
        a.categorie?.toString().toLowerCase().includes(l) ||
        a.produit?.toString().toLowerCase().includes(l)
      )
    }
    if (selectedCategory)
      r = r.filter((a) => a.categorie?.toLowerCase().includes(selectedCategory.toLowerCase()))
    if (startDate || endDate) {
      r = r.filter((a) => {
        if (!a.date) return false
        const d = new Date(a.date); d.setHours(0,0,0,0)
        if (startDate) { const s = new Date(startDate); s.setHours(0,0,0,0); if (d < s) return false }
        if (endDate)   { const e = new Date(endDate);   e.setHours(23,59,59,999); if (d > e) return false }
        return true
      })
    }
    return r
  }, [articles, searchTerm, selectedCategory, startDate, endDate])

  const sortedArticles = useMemo(() => {
    const arr = [...filteredArticles]
    if (!sortConfig.key) return arr
    const dir = sortConfig.direction === "asc" ? 1 : -1
    arr.sort((a, b) => {
      const rA = a[sortConfig.key], rB = b[sortConfig.key]
      const nA = parseFloat(rA), nB = parseFloat(rB)
      if (!isNaN(nA) && !isNaN(nB)) return (nA - nB) * dir
      return (rA ?? "").toString().localeCompare((rB ?? "").toString(), "fr", { numeric: true }) * dir
    })
    return arr
  }, [filteredArticles, sortConfig])

  useEffect(() => {
    if (!selectedWeek || !articleWrapRef.current) return
    const $ = window.$
    if (!$) return

    const rows = sortedArticles.map((a) => [
      a.article_id ?? "",
      `<span class="wv-badge ${getCatClass(a.categorie)}">${a.categorie ?? ""}</span>`,
      a.libelle  ?? "",
      a.produit  ?? "",
      a.date ? formatDate(a.date) : "N/A",
      a.semaine  ?? "",
      a.annee    ?? "",
    ])

    destroyDt(articleDtRef, articleWrapRef)

    const table = createTable(articleWrapRef, `
      <tr>
        <th class="sortable" data-key="article_id">ID</th>
        <th class="sortable" data-key="categorie">Catégorie</th>
        <th class="sortable" data-key="libelle">Libellé</th>
        <th class="sortable" data-key="produit">Produit</th>
        <th class="sortable" data-key="date">Date</th>
        <th>Semaine</th>
        <th>Année</th>
      </tr>
    `)
    if (!table) return

    // Indicateurs de tri dans les <th>
    const updateThIndicators = (key, dir) => {
      table.querySelectorAll("thead th[data-key]").forEach((th) => {
        const k = th.getAttribute("data-key")
        if (k === "article_id") th.textContent = "ID"
        else if (k === "categorie")  th.textContent = "Catégorie"
        else if (k === "libelle")    th.textContent = "Libellé"
        else if (k === "produit")    th.textContent = "Produit"
        else if (k === "date")       th.textContent = "Date"
        if (k === key) th.textContent += ` ${dir === "asc" ? "▲" : "▼"}`
      })
    }

    // Clic sur th pour trier
    table.querySelectorAll("thead th[data-key]").forEach((th) => {
      th.addEventListener("click", () => {
        const key = th.getAttribute("data-key")
        setSortConfig((prev) => ({
          key,
          direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
        }))
      })
    })

    if (sortConfig.key) updateThIndicators(sortConfig.key, sortConfig.direction)

    // setTimeout : garantit que le <table> est dans le DOM avant DataTables
    const timer = setTimeout(() => {
      if (!articleWrapRef.current || !table.parentNode) return
      articleDtRef.current = $(table).DataTable({
        data: rows,
        order: [],
        pageLength: 10,
        lengthMenu: [5, 10, 25, 50, 100],
        searching: false,
        ordering: false,
        language: {
          lengthMenu:  "Afficher _MENU_ lignes",
          info:        "Affichage de _START_ à _END_ sur _TOTAL_ entrées",
          zeroRecords: "Aucun article trouvé.",
          paginate: { first:"Premier", last:"Dernier", next:"Suivant ➡", previous:"⬅ Précédent" },
        },
        columnDefs: [{ orderable: false, targets: "_all" }],
        createdRow: (row, data, dataIndex) => {
          const article = sortedArticles[dataIndex]
          if (article) {
            row.classList.add(getRowClass(article.categorie))
          }
        },
      })
    }, 0)

    return () => { clearTimeout(timer); destroyDt(articleDtRef, articleWrapRef) }
  }, [sortedArticles, selectedWeek])  // eslint-disable-line

  
  const handleExportExcel = (categorie) => {
    if (!selectedWeek) return

    const catNorm = (c) => (c || "").toLowerCase().replace(/\s*\/\s*/g, "/")

    // Partir du tableau brut complet, pas du tableau filtré/trié affiché
    let toExport = Array.isArray(articles) ? [...articles] : []
    if (categorie) {
      const normCat = catNorm(categorie)
      toExport = toExport.filter((a) => catNorm(a.categorie) === normCat)
    }

    const wsData = toExport.map((a) => ({
      ID:        a.article_id,
      Catégorie: a.categorie,
      Libellé:   a.libelle,
      Produit:   a.produit,
      Date:      a.date ? formatDate(a.date) : "N/A",
      Semaine:   a.semaine,
      Année:     a.annee,
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

  
  if (loading && weeks.length === 0)
    return (
      <div style={{ display:"flex", justifyContent:"center", alignItems:"center", minHeight:300 }}>
        <div className="wv-spin" />
      </div>
    )


  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        :root{
          --c-border:#e2e8f0;
          --c-primary:#2563eb; --c-primary-h:#1d4ed8;
          --c-accent:#0ea5e9;  --c-accent-h:#0284c7;
          --radius:10px;
        }
        *{box-sizing:border-box;margin:0;padding:0;}
        .wv-root{font-family:'Plus Jakarta Sans',sans-serif;padding:20px 16px 24px;}

        .wv-spin{width:36px;height:36px;border:3px solid var(--c-border);border-top-color:var(--c-primary);border-radius:50%;animation:spin .7s linear infinite;}
        .wv-spin-sm{display:inline-block;width:16px;height:16px;border:2px solid var(--c-border);border-top-color:var(--c-primary);border-radius:50%;animation:spin .7s linear infinite;vertical-align:middle;margin-right:6px;}
        @keyframes spin{to{transform:rotate(360deg);}}

        .wv-alert{display:flex;justify-content:space-between;align-items:center;border:1px solid #fecaca;padding:12px 16px;margin-bottom:20px;color:#b91c1c;font-size:13.5px;}
        .wv-alert button{background:none;border:none;cursor:pointer;color:#b91c1c;font-size:18px;}

        /* ── semaines panel ── */
        .wv-week-panel{border:1px solid var(--c-border);border-radius:var(--radius);padding:20px 16px;}
        .wv-week-panel h4{font-size:20px;text-align:center;margin-bottom:16px;}

        /* ── cards semaines ── */
        .wv-week-search{display:flex;justify-content:flex-end;margin-bottom:10px;}
        .wv-week-search-input{width:160px;padding:8px 14px;border:1px solid var(--c-border);border-radius:var(--radius);font-size:13.5px;font-family:inherit;text-align:center;outline:none;transition:border-color .2s;}
        .wv-week-search-input:focus{border-color:var(--c-primary);}
        .wv-empty{text-align:center;padding:32px 0;font-size:14px;}
        .wv-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}
        @media(max-width:768px){.wv-grid{grid-template-columns:repeat(2,1fr);}}
        @media(max-width:480px){.wv-grid{grid-template-columns:1fr;}}
        .wv-tile{border:1.5px solid var(--c-border);border-radius:var(--radius);padding:14px 12px;text-align:center;cursor:pointer;transition:all .2s;}
        .wv-tile:hover{border-color:var(--c-primary);}
        .wv-tile h5{font-size:17px;font-weight:700;margin:0 0 4px;}
        .wv-tile p{font-size:13px;margin:0 0 10px;}
        .wv-cnt{display:inline-block;background:var(--c-primary);color:#fff;border:none;border-radius:20px;padding:3px 12px;font-size:12px;font-weight:600;}
        /* ── barre longueur + info cards ── */
        .wv-cards-bar{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:6px;}
        .wv-cards-length{display:flex;align-items:center;gap:8px;font-size:13px;}
        .wv-cards-info{font-size:13px;}
        .wv-len-select{
          padding:5px 28px 5px 10px;
          border:1px solid var(--c-border);border-radius:7px;
          font-size:13px;font-family:inherit;outline:none;
          -webkit-appearance:none;appearance:none;
          background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='none' stroke='%2364748b' stroke-width='1.5' d='M1 1l4 4 4-4'/%3E%3C/svg%3E") no-repeat right 8px center;
          cursor:pointer;min-width:56px;
        }
        .wv-len-select:focus{border-color:var(--c-primary);}
        /* pagination */
        .wv-pages{display:flex;justify-content:center;align-items:center;gap:6px;margin-top:12px;}
        .wv-pages button{border:1px solid var(--c-border);border-radius:8px;padding:6px 14px;font-size:13px;font-family:inherit;cursor:pointer;transition:all .15s;}
        .wv-pages button:hover:not(:disabled){border-color:var(--c-primary);color:var(--c-primary);}
        .wv-pages button:disabled{opacity:.4;cursor:not-allowed;}
        .wv-pages span{font-size:13px;padding:0 6px;}

        /* ── articles ── */
        .wv-art-title{text-align:center;margin-bottom:22px;}
        .wv-art-title h3{font-size:22px;font-weight:700;margin-bottom:4px;}
        .wv-art-title .sub{font-size:15px;font-weight:400;}
        .wv-chip{display:inline-flex;align-items:center;background:var(--c-primary);color:#fff;border:none;border-radius:20px;padding:2px 10px;font-size:12px;font-weight:500;margin-left:8px;}

        /* toolbar */
        .wv-toolbar{border:1px solid var(--c-border);border-radius:var(--radius);padding:12px 20px;margin-bottom:16px;display:flex;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:10px;}
        .wv-sep{width:1px;height:28px;background:var(--c-border);flex-shrink:0;}
        .wv-btn-back{display:flex;align-items:center;gap:6px;border:1.5px solid var(--c-border);border-radius:8px;padding:7px 14px;font-size:13px;font-family:inherit;cursor:pointer;transition:all .15s;white-space:nowrap;}
        .wv-btn-back:hover{border-color:var(--c-primary);color:var(--c-primary);}
        .wv-dg{display:flex;align-items:center;gap:7px;}
        .wv-dg label{font-size:13px;font-weight:600;white-space:nowrap;}
        .wv-di{padding:7px 10px;border:1px solid var(--c-border);border-radius:8px;font-size:13px;font-family:inherit;outline:none;transition:border-color .2s;width:140px;}
        .wv-di:focus{border-color:var(--c-primary);}
        .wv-di:disabled{opacity:.5;cursor:not-allowed;}
        .wv-bi{border:1px solid var(--c-border);border-radius:7px;padding:6px 9px;cursor:pointer;transition:all .15s;font-size:13px;line-height:1;}
        .wv-bi:hover{border-color:#dc2626;color:#dc2626;}

        /* dropdown */
        .wv-dd{position:relative;}
        .wv-btn-exp{display:flex;align-items:center;gap:6px;background:var(--c-accent);border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-family:inherit;color:#fff;cursor:pointer;font-weight:600;white-space:nowrap;transition:background .15s;}
        .wv-btn-exp:hover{background:var(--c-accent-h);}
        .wv-ddm{position:absolute;right:0;top:calc(100% + 6px);background:#fff;border:1px solid var(--c-border);border-radius:var(--radius);box-shadow:0 8px 24px rgba(0,0,0,.11);min-width:190px;z-index:999;display:none;}
        .wv-dd.open .wv-ddm{display:block;}
        .wv-ddh{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;padding:10px 14px 4px;}
        .wv-ddd{height:1px;background:var(--c-border);margin:4px 0;}
        .wv-ddi{display:block;width:100%;background:none;border:none;text-align:left;padding:8px 14px;font-size:13px;font-family:inherit;cursor:pointer;transition:background .12s;}
        .wv-ddi:hover{background:var(--c-border);color:var(--c-primary);}

        /* carte tableau - GARDÉ EN BLANC */
        .wv-tcard{background:#fff;border:1px solid var(--c-border);border-radius:var(--radius);box-shadow:0 1px 10px rgba(15,23,42,.07);overflow:hidden;}
        .wv-topbar{display:flex;align-items:center;justify-content:flex-end;padding:14px 20px 0;gap:8px;}
        .wv-si{padding:7px 12px;border:1px solid var(--c-border);border-radius:8px;font-size:13px;font-family:inherit;outline:none;transition:border-color .2s;width:240px;}
        .wv-si:focus{border-color:var(--c-primary);}

        /*
         * wv-dt-wrap : CONTENEUR que React ne modifie jamais.
         * DataTables crée/détruit le <table> à l'intérieur en JS pur.
         */
        .wv-dt-wrap{padding:12px 20px 4px;overflow-x:auto;}

        /* styles table injectée par DataTables */
        .wv-t{width:100%;border-collapse:collapse;font-size:13.5px;background:#fff;}
        .wv-t thead th{background:#fff;border-bottom:2px solid var(--c-border);padding:11px 14px;text-align:left;font-weight:600;font-size:11.5px;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap;}
        .wv-t thead th.sortable{cursor:pointer;user-select:none;}
        .wv-t thead th.sortable:hover{color:var(--c-primary);}
        .wv-t tbody tr{border-bottom:1px solid #f1f5f9;transition:background .12s;background:#fff;}
        .wv-t tbody tr:last-child{border-bottom:none;}
        .wv-t tbody tr:hover{background:#f8fafc;}
        .wv-t td{padding:10px 14px;vertical-align:middle;}

        /* badges */
        .wv-badge{display:inline-block;border-radius:20px;padding:3px 10px;font-size:11.5px;font-weight:600;}
        .cat-resto{border:1.5px solid;border-color:currentColor;}
        .cat-snack{border:1.5px solid;border-color:currentColor;}
        .cat-detente{border:1.5px solid;border-color:currentColor;}
        .cat-default{border:1.5px solid;border-color:currentColor;}

        /* DataTables UI */
        .dataTables_wrapper{font-family:'Plus Jakarta Sans',sans-serif;}
        .dataTables_wrapper .dataTables_filter label,
        .dataTables_wrapper .dataTables_length label{font-size:13px;display:flex;align-items:center;gap:6px;}
        .dataTables_wrapper .dataTables_filter input{padding:5px 10px;border:1px solid var(--c-border);border-radius:7px;font-size:13px;font-family:inherit;outline:none;}
        .dataTables_wrapper .dataTables_filter input:focus{border-color:var(--c-primary);}
        .dataTables_wrapper .dataTables_length select{
          padding:5px 28px 5px 10px;
          border:1px solid var(--c-border);border-radius:7px;
          font-size:13px;font-family:inherit;outline:none;
          -webkit-appearance:none;appearance:none;
          background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='none' stroke='%2364748b' stroke-width='1.5' d='M1 1l4 4 4-4'/%3E%3C/svg%3E") no-repeat right 9px center;
          cursor:pointer;min-width:64px;
        }
        .dataTables_wrapper .dataTables_length select:focus{border-color:var(--c-primary);outline:none;}
        .dataTables_wrapper .dataTables_info{font-size:13px;padding:10px 0;}
        .dataTables_wrapper .dataTables_paginate{padding:10px 0;}
        .dataTables_wrapper .dataTables_paginate .paginate_button{display:inline-block;padding:5px 12px;margin:0 2px;border:1px solid var(--c-border) !important;border-radius:7px;font-size:13px;cursor:pointer;background:#fff !important;transition:all .15s;}
        .dataTables_wrapper .dataTables_paginate .paginate_button:hover{border-color:var(--c-primary) !important;color:var(--c-primary) !important;background:#f8fafc !important;}
        .dataTables_wrapper .dataTables_paginate .paginate_button.current{background:var(--c-primary) !important;color:#fff !important;border-color:var(--c-primary) !important;font-weight:600;}
        .dataTables_wrapper .dataTables_paginate .paginate_button.disabled{opacity:.4 !important;cursor:not-allowed !important;}
      `}</style>

      <div className="wv-root">
        {error && (
          <div className="wv-alert">
            <span>{error}</span>
            <button onClick={() => setError("")}>×</button>
          </div>
        )}

        {!selectedWeek ? (
          /* ══════════════════════════════════════
             VUE SEMAINES — CARDS
          ══════════════════════════════════════ */
          <div className="wv-week-panel">
            <h4>Sélectionner une semaine</h4>

            {/* Barre de recherche par numéro */}
            <div className="wv-week-search">
              <input
                type="text"
                className="wv-week-search-input"
                placeholder="N° semaine…"
                value={searchWeek}
                inputMode="numeric"
                pattern="[0-9]*"
                onInput={(e) => {
                  const c = e.target.value.replace(/[^0-9]/g, "")
                  e.target.value = c
                  if (c.length <= 2) setSearchWeek(c)
                }}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9]/g, "")
                  setSearchWeek(v.slice(0, 2))
                }}
                onKeyDown={(e) => {
                  const ok = ["0","1","2","3","4","5","6","7","8","9","Backspace","Delete","ArrowLeft","ArrowRight","Tab","Home","End"]
                  if ((e.ctrlKey || e.metaKey) && e.key === "v") { e.preventDefault(); return }
                  if (!ok.includes(e.key)) e.preventDefault()
                }}
                onPaste={(e) => {
                  e.preventDefault()
                  const n = e.clipboardData.getData("text").replace(/[^0-9]/g, "")
                  if (n.length <= 2) setSearchWeek(n)
                }}
                onDrop={(e) => e.preventDefault()}
                autoComplete="off" spellCheck="false"
              />
            </div>

            {loading ? (
              <div style={{ display:"flex", justifyContent:"center", padding:"32px 0" }}>
                <div className="wv-spin" />
              </div>
            ) : filteredWeeks.length === 0 ? (
              <p className="wv-empty">Aucune semaine trouvée.</p>
            ) : (
              <>
                {/* ── Barre : Afficher X cards + info ── */}
                <div className="wv-cards-bar">
                  <div className="wv-cards-length">
                    <span>Afficher</span>
                    <select
                      value={weeksPerPage}
                      onChange={(e) => { setWeeksPerPage(Number(e.target.value)); setWeekPage(1) }}
                      className="wv-len-select"
                    >
                      {weekPageOptions.map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                    <span>semaines</span>
                  </div>
                  <div className="wv-cards-info">
                    {filteredWeeks.length === 0 ? "0 résultat" : (
                      <>
                        Semaines{" "}
                        <strong>{(weekPage - 1) * weeksPerPage + 1}</strong>
                        {" à "}
                        <strong>{Math.min(weekPage * weeksPerPage, filteredWeeks.length)}</strong>
                        {" sur "}
                        <strong>{filteredWeeks.length}</strong>
                      </>
                    )}
                  </div>
                </div>

                {/* Grille de cards */}
                <div className="wv-grid">
                  {currentWeeks.map((w) => (
                    <div
                      key={`${w.semaine}-${w.annee}`}
                      className="wv-tile"
                      onClick={() => fetchWeekArticles(w.semaine, w.annee)}
                    >
                      <h5>Semaine {w.semaine}</h5>
                      <p>Année {w.annee}</p>
                      <span className="wv-cnt"> articles</span>
                    </div>
                  ))}
                </div>

                {/* ── Pagination ── */}
                {totalWeekPages > 1 && (
                  <div className="wv-pages">
                   <button
  onClick={() => setWeekPage((p) => Math.max(p - 1, 1))}
  disabled={weekPage <= 1}
>← Précédent</button>
<span>Page <strong>{weekPage}</strong> / <strong>{totalWeekPages}</strong></span>
<button
  onClick={() => setWeekPage((p) => (p < totalWeekPages ? p + 1 : p))}
  disabled={weekPage >= totalWeekPages}
>Suivant →</button>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          
          <>
            {/* 1. Titre centré */}
            <div className="wv-art-title">
              
              <div className="sub">
                Semaine&nbsp;<strong>{selectedWeek.semaine}</strong>&nbsp;—&nbsp;{selectedWeek.annee}
                {selectedCategory && <span className="wv-chip">{selectedCategory}</span>}
              </div>
            </div>

            {/* 2. Barre d'outils (alignée à droite) */}
            <div className="wv-toolbar">
              <button className="wv-btn-back" onClick={() => setSelectedWeek(null)}>
                ← Changer de semaine
              </button>
              <div className="wv-sep" />

              <div className="wv-dg">
                <label>Du</label>
                <input type="date" className="wv-di" value={startDate}
                  max={endDate || undefined}
                  onChange={(e) => { setStartDate(e.target.value); if (endDate && endDate < e.target.value) setEndDate("") }} />
              </div>
              <div className="wv-dg">
                <label>Au</label>
                <input type="date" className="wv-di" value={endDate}
                  min={startDate || undefined}
                  disabled={!startDate}
                  title={!startDate ? "Sélectionnez d'abord une date de début" : ""}
                  onChange={(e) => { if (startDate && e.target.value < startDate) return; setEndDate(e.target.value) }} />
              </div>
              {(startDate || endDate) && (
                <button className="wv-bi" title="Effacer la période"
                  onClick={() => { setStartDate(""); setEndDate("") }}>✕</button>
              )}
              <div className="wv-sep" />

              <div className={"wv-dd" + (dropdownOpen ? " open" : "")}>
                <button
                  className="wv-btn-exp"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                >
                  📊 Exporter Excel ▾
                </button>
                {dropdownOpen && (
                  <div className="wv-ddm">
                    <div className="wv-ddh">Boisson</div>
                    <button className="wv-ddi" onClick={() => { handleExportExcel("boisson/snack");  setDropdownOpen(false) }}>Boisson / Snack</button>
                    <button className="wv-ddi" onClick={() => { handleExportExcel("boisson/detente"); setDropdownOpen(false) }}>Boisson / Détente</button>
                    <button className="wv-ddi" onClick={() => { handleExportExcel("boisson/resto");  setDropdownOpen(false) }}>Boisson / Resto</button>
                    <div className="wv-ddd" />
                    <div className="wv-ddh">Salle</div>
                    <button className="wv-ddi" onClick={() => { handleExportExcel("salle/snack");    setDropdownOpen(false) }}>Salle / Snack</button>
                    <button className="wv-ddi" onClick={() => { handleExportExcel("salle/detente");  setDropdownOpen(false) }}>Salle / Détente</button>
                    <button className="wv-ddi" onClick={() => { handleExportExcel("salle/resto");    setDropdownOpen(false) }}>Salle / Resto</button>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Carte tableau - GARDÉE EN BLANC */}
            <div className="wv-tcard">
              <div className="wv-topbar">
                {loading && <span><span className="wv-spin-sm" />Chargement…</span>}
                <input type="text" className="wv-si"
                  placeholder="Rechercher par n° ou nom…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)} />
                {searchTerm && (
                  <button className="wv-bi" title="Effacer" onClick={() => setSearchTerm("")}>✕</button>
                )}
              </div>

              <div className="wv-dt-wrap">
                {/*
                  ⚠️ Même principe : div conteneur only.
                  Le <table> est injecté/retiré uniquement par DataTables.
                */}
                <div ref={articleWrapRef} />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

export default WeekView

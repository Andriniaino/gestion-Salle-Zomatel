"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import Header from "./Modal/Header"
import Footer from "./Footer"
import WeekView from "./WeekView"

const AdminHistoriquePage = () => {
  const navigate = useNavigate()
  const [serviceFilter, setServiceFilter] = useState("all")

  const handleCategoryFilter = (service) => {
    setServiceFilter(service || "all")
  }

  return (
    <>
      <div className="position-relative min-vh-100">

        {/* Overlay sombre */}
        <div
          style={{
            position: "absolute", inset: 0,
            backgroundColor: "rgba(0,0,0,0.18)",
            zIndex: 1, pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 2, padding: 20 }}>
          <div className="container-fluid">

            {/* Header avec filtre catégorie */}
            <Header
              handleCategoryFilter={handleCategoryFilter}
              serviceFilter={serviceFilter}
            />

            <div className="container mt-5 pt-3">

              {/* ── Titre de la page ── */}
              <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
                <div className="d-flex justify-content-center">
                  <div className="text-center">
                    <h2 className="fw-bold mb-0" style={{ color: "#800020" }}>
                      <i className="bi bi-clock-history me-2"></i>
                      Historique des articles
                    </h2>
                    <p className="text-muted mb-0" style={{ fontSize: 14 }}>
                      Consultez et exportez les articles par semaine
                    </p>
                  </div>
                </div>

                {/* Badge filtre actif */}
                {serviceFilter !== "all" && (
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-secondary fs-6 px-3 py-2">
                      <i className="bi bi-funnel me-1"></i>
                      Filtre : {serviceFilter}
                    </span>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => handleCategoryFilter("all")}
                      title="Supprimer le filtre"
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>
                )}
              </div>

              {/* ── WeekView — contient toutes les fonctionnalités ── */}
              <WeekView
                onBack={() => navigate("/admin")}
                selectedCategory={serviceFilter === "all" ? "" : serviceFilter}
              />

            </div>

            <Footer />
          </div>
        </div>
      </div>
    </>
  )
}

export default AdminHistoriquePage
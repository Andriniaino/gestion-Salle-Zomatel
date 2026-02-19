// frontend/src/components/Resume.js

import React from "react";

/**
 * Composant qui affiche un résumé par catégorie
 * @param {Array} articles - Liste des articles
 */
const Resume = ({ articles }) => {
  // Fonction utilitaire pour définir la couleur du badge selon la catégorie
  const getCategoryBadgeClass = (categorie) => {
    switch (categorie) {
      case "resto":
        return "bg-danger";
      case "snack":
        return "bg-warning text-dark";
      case "detente":
        return "bg-success";
      default:
        return "bg-secondary";
    }
  };

  return (
    <div className="text-center my-4">
      <h2 className="text-white mt-4">Résumé par catégorie</h2>

      <div className="row mt-4 justify-content-center">
        {["boisson/resto", "salle/resto", 
        "boisson/snack", "salle/snack", 
        "boisson/detente", "salle/detente"].map((categorie) => {
          // Filtrer les articles selon la catégorie
          const categoryArticles = articles.filter(
            (a) => a.categorie === categorie
          );

          // Calculer la quantité totale
          const totalProduits = categoryArticles.reduce(
            (sum, a) => sum + (parseFloat(a.produit) || 0),
            0
          );

          return (
            <div key={categorie} className="col-md-4 mb-3">
              <div
                className="card shadow-sm"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.34)",
                  border: "1px solid rgba(0,0,0,0.1)",
                }}
              >
                <div className="card-body text-center">
                  <h5 className="card-title">
                    <span
                      className={`badge ${getCategoryBadgeClass(categorie)} fs-6`}
                    >
                      {categorie.charAt(0).toUpperCase() + categorie.slice(1)}
                    </span>
                  </h5>
                  <p className="card-text">
                    <strong>{categoryArticles.length}</strong> articles
                    <br />
                    <strong>{totalProduits.toFixed(2)}</strong> Quantité totale
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Resume;

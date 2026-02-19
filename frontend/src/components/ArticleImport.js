// src/components/ArticleImport.js
import { useState } from "react";
import api from "../services/api";
import excelModel from "../images/excel.jpg"; // ✅ Import de l'image

export default function ArticleImport({ show, onClose, onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState([]);

  if (!show) return null;

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage("Veuillez sélectionner un fichier CSV ou Excel.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setMessage("");
      setErrors([]);

      const res = await api.post("/articles/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        setMessage("✅ Import terminé avec succès !");
        if (onImportSuccess) {
          setTimeout(() => {
            onImportSuccess();
            onClose();
          }, 1500);
        } else {
          setTimeout(() => onClose(), 1500);
        }
      } else {
        setMessage("Erreur lors de l'import.");
        if (res.data.errors) setErrors(res.data.errors);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || "Erreur serveur lors de l'import.";
      setMessage(`❌ ${errorMessage}`); // ✅ Correction syntaxe
      if (err.response?.data?.errors) {
        const errorArray = Array.isArray(err.response.data.errors) 
          ? err.response.data.errors 
          : Object.values(err.response.data.errors).flat();
        setErrors(errorArray.map(err => ({ errors: [err] })));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop show" onClick={onClose}></div>
      <div className="modal d-block" tabIndex="-1" style={{ display: 'block' }}>
        <div className="modal-dialog modal-lg modal-dialog-centered"> {/* ✅ modal-lg pour afficher l'image */}
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">📥 Importer des articles</h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
            </div>

            <div className="modal-body">
              {/* ✅ En haut : colonnes requises */}
              <div className="alert alert-secondary mb-3">
                <strong>Colonnes requises :</strong> id, categorie, libelle, produit, unite, prix
              </div>

              {/* ✅ Messages d'erreur/succès */}
              {message && (
                <div className={`alert ${message.includes('succès') ? 'alert-success' : 'alert-danger'}`}>
                  {message}
                </div>
              )}

              {errors.length > 0 && (
                <div className="alert alert-danger">
                  <strong>Erreurs détectées :</strong>
                  <ul className="mb-0 mt-2">
                    {errors.map((err, i) => (
                      <li key={i}>
                        {err.row ? `Ligne ${err.row}: ` : ""}
                        {err.errors?.join(", ")}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ✅ Formulaire à gauche + Image à droite */}
              <div className="row">
                {/* Colonne gauche : Formulaire */}
                <div className="col-md-6">
                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label className="form-label fw-bold">
                        <i className="bi bi-file-earmark-excel me-2"></i>
                        Sélectionner un fichier Excel ou CSV
                      </label>
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        className="form-control"
                        onChange={handleFileChange}
                        disabled={loading}
                      />
                      <div className="form-text">
                        Formats acceptés : .xlsx, .xls, .csv
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary w-100"
                      disabled={loading || !file}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Import en cours...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-upload me-2"></i>
                          Importer
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Colonne droite : Phrase + Image */}
                <div className="col-md-6">
                  <div className="alert alert-info d-flex align-items-center mb-2">
                    <i className="bi bi-info-circle-fill me-2"></i>
                    <span>Utilisez le modèle ci-dessous pour structurer votre fichier Excel</span>
                  </div>

                  <div className="text-center">
                    <img 
                      src={excelModel} 
                      alt="Modèle Excel" 
                      className="img-fluid rounded border"
                      style={{ maxHeight: "250px", objectFit: "contain" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
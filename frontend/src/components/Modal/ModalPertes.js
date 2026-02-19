import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from "../../services/api";

export default function ModalPertes({ show, onClose }) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [produitPerte, setProduitPerte] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Recherche d'articles
  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) {
      setMessage({ type: 'error', text: 'Tapez au moins 2 caractères' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const params = new URLSearchParams();
      params.set('q', searchQuery);
      // Fallback: si backend ne récupère pas l'utilisateur connecté
      if (user?.categorie) params.set('categorie', user.categorie);

      const response = await api.get(`/pertes/search?${params.toString()}`);
      const articles = Array.isArray(response.data) ? response.data : response.data?.data || [];
      setSearchResults(articles);

      if (articles.length === 0) {
        setMessage({ type: 'warning', text: `Aucun article trouvé pour "${searchQuery}"` });
      } else {
        setMessage({ type: 'success', text: `${articles.length} article(s) trouvé(s)` });
      }
    } catch (error) {
      console.error('Erreur recherche:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la recherche' });
      setSearchResults([]);
    }

    setLoading(false);
  };

  // Sélection d'un article
  const handleSelectArticle = (article) => {
    setSelectedArticle(article);
    setSearchResults([]);
    setSearchQuery('');
    setProduitPerte('');
    setCommentaire('');
    setMessage({ type: '', text: '' });
  };

  // Enregistrer la perte
  const handleSubmitPerte = async () => {
    if (!produitPerte || parseFloat(produitPerte) <= 0) {
      setMessage({ type: 'error', text: 'Quantité de perte invalide' });
      return;
    }

    if (!selectedArticle) {
      setMessage({ type: 'error', text: 'Aucun article sélectionné' });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/pertes', {
        article_id: selectedArticle.id,
        categorie: selectedArticle.categorie, // TRES IMPORTANT
        produit: parseFloat(produitPerte),
        commentaire: commentaire
      });

      if (response.data?.success) {
        setMessage({ type: 'success', text: 'Perte enregistrée avec succès !' });

        // Reset après 1.5s et fermer modal
        setTimeout(() => {
          setSelectedArticle(null);
          setProduitPerte('');
          setCommentaire('');
          setSearchQuery('');
          setMessage({ type: '', text: '' });
          onClose();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: response.data?.message || 'Erreur lors de l\'enregistrement' });
      }
    } catch (error) {
      console.error('Erreur enregistrement:', error);

      const msg = error.response?.data?.message
        || error.response?.data?.error
        || (error.response?.data?.errors && typeof error.response.data.errors === 'object'
          ? Object.values(error.response.data.errors).flat().join(', ')
          : null)
        || 'Erreur serveur. Vérifiez que l\'article existe et les champs obligatoires.';

      setMessage({ type: 'error', text: msg });
    }

    setLoading(false);
  };

  // Annuler / fermer modal
  const handleCancel = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedArticle(null);
    setProduitPerte('');
    setCommentaire('');
    setMessage({ type: '', text: '' });
    onClose();
  };

  if (!show) return null;

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          {/* Header */}
          <div className="modal-header bg-danger text-white">
            <h5 className="modal-title">
              <i className="bi bi-exclamation-triangle me-2"></i>
              Déclarer une Perte
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={handleCancel}></button>
          </div>

          <div className="modal-body">
            {/* Messages */}
            {message.text && (
              <div className={`alert ${
                message.type === 'success' ? 'alert-success' :
                message.type === 'warning' ? 'alert-warning' : 'alert-danger'
              } alert-dismissible fade show`} role="alert">
                {message.text}
                <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
              </div>
            )}

            {/* Barre de recherche */}
            {!selectedArticle && (
              <>
                <div className="mb-3">
                  <label className="form-label fw-bold">Rechercher un article</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light"><i className="bi bi-search"></i></span>
                    <input
                      type="text"
                      className="form-control"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && handleSearch()}
                      placeholder="Nom de l'article..."
                      disabled={loading}
                    />
                    <button
                      className="btn btn-danger"
                      type="button"
                      disabled={loading || searchQuery.length < 2}
                      onClick={handleSearch}
                    >
                      {loading ? <>Recherche...</> : <>Rechercher</>}
                    </button>
                  </div>
                </div>

                {/* Résultats */}
                {searchResults.length > 0 && (
                  <div className="list-group" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {searchResults.map(article => (
                      <button
                        key={article.id}
                        type="button"
                        className="list-group-item list-group-item-action"
                        onClick={() => handleSelectArticle(article)}
                      >
                        <div className="d-flex justify-content-between">
                          <div>
                            <h6>{article.libelle}</h6>
                            <small>ID: {article.id} | Catégorie: {article.categorie}</small>
                          </div>
                          <div className="text-end">
                            <small>{article.produit} {article.unite}</small>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Formulaire perte */}
            {selectedArticle && (
              <>
                <div className="card mb-3">
                  <div className="card-header bg-light">Détails de l'article</div>
                  <div className="card-body row">
                    <div className="col-md-6"><strong>ID:</strong> {selectedArticle.id}</div>
                    <div className="col-md-6"><strong>Libellé:</strong> {selectedArticle.libelle}</div>
                    <div className="col-md-6"><strong>Catégorie:</strong> {selectedArticle.categorie}</div>
                    <div className="col-md-6"><strong>Stock actuel:</strong> {selectedArticle.produit} {selectedArticle.unite}</div>
                    <div className="col-md-6"><strong>Prix unitaire:</strong> {selectedArticle.prix} Ar</div>
                    <div className="col-md-6"><strong>Unité:</strong> {selectedArticle.unite}</div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">Produit perdue *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-control"
                    value={produitPerte}
                    onChange={e => setProduitPerte(e.target.value)}
                    placeholder="Ex: 2.5"
                    disabled={loading}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">Commentaire (optionnel)</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={commentaire}
                    onChange={e => setCommentaire(e.target.value)}
                    placeholder="Raison de la perte..."
                    disabled={loading}
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={handleCancel} disabled={loading}>
              Annuler
            </button>
            {selectedArticle && (
              <button type="button" className="btn btn-danger" onClick={handleSubmitPerte} disabled={loading}>
                {loading ? 'Enregistrement...' : 'Enregistrer la Perte'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

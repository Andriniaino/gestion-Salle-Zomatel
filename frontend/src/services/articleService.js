import api from "./api";

/**
 * Service pour gérer les Articles
 * Toutes les méthodes gèrent les erreurs et retournent des promesses
 */

// GET - Récupérer tous les articles
export const getArticles = async () => {
  try {
    const response = await api.get("/articles");
    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Erreur lors de la récupération des articles",
      errors: error.errors || {},
    };
  }
};

// GET - Récupérer un article par ID
export const getArticle = async (id) => {
  try {
    const response = await api.get(`/articles/${id}`);
    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || `Erreur lors de la récupération de l'article ${id}`,
      errors: error.errors || {},
    };
  }
};

// POST - Créer un nouvel article
export const createArticle = async (articleData) => {
  try {
    const response = await api.post("/articles", articleData);
    return {
      success: true,
      data: response.data?.data || response.data,
      message: response.data?.message || "Article créé avec succès",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Erreur lors de la création de l'article",
      errors: error.errors || {},
    };
  }
};

// PUT - Mettre à jour un article
export const updateArticle = async (id, articleData) => {
  try {
    const response = await api.put(`/articles/${id}`, articleData);
    return {
      success: true,
      data: response.data?.data || response.data,
      message: response.data?.message || "Article mis à jour avec succès",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || `Erreur lors de la mise à jour de l'article ${id}`,
      errors: error.errors || {},
    };
  }
};

// DELETE - Supprimer un article
export const deleteArticle = async (id) => {
  try {
    const response = await api.delete(`/articles/${id}`);
    return {
      success: true,
      message: response.data?.message || "Article supprimé avec succès",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || `Erreur lors de la suppression de l'article ${id}`,
      errors: error.errors || {},
    };
  }
};


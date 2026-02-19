import api from "./api";

/**
 * Service pour gérer les ArticleWeek
 */

// GET - Récupérer tous les articleweeks
export const getArticleWeeks = async () => {
  try {
    const response = await api.get("/articleweeks");
    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Erreur lors de la récupération des articleweeks",
      errors: error.errors || {},
    };
  }
};

// GET - Récupérer un articleweek par ID
export const getArticleWeek = async (id) => {
  try {
    const response = await api.get(`/articleweeks/${id}`);
    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || `Erreur lors de la récupération de l'articleweek ${id}`,
      errors: error.errors || {},
    };
  }
};

// GET - Récupérer par semaine et année
export const getArticleWeeksByWeek = async (semaine, annee) => {
  try {
    const response = await api.get(`/articleweeks/week/${semaine}/${annee}`);
    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Erreur lors de la récupération par semaine",
      errors: error.errors || {},
    };
  }
};

// GET - Récupérer par article_id
export const getArticleWeeksByArticleId = async (articleId) => {
  try {
    const response = await api.get(`/articleweeks/article/${articleId}`);
    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || `Erreur lors de la récupération pour l'article ${articleId}`,
      errors: error.errors || {},
    };
  }
};

// POST - Créer un nouvel articleweek
export const createArticleWeek = async (articleWeekData) => {
  try {
    const response = await api.post("/articleweeks", articleWeekData);
    return {
      success: true,
      data: response.data?.data || response.data,
      message: response.data?.message || "ArticleWeek créé avec succès",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Erreur lors de la création de l'articleweek",
      errors: error.errors || {},
    };
  }
};

// PUT - Mettre à jour un articleweek
export const updateArticleWeek = async (id, articleWeekData) => {
  try {
    const response = await api.put(`/articleweeks/${id}`, articleWeekData);
    return {
      success: true,
      data: response.data?.data || response.data,
      message: response.data?.message || "ArticleWeek mis à jour avec succès",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || `Erreur lors de la mise à jour de l'articleweek ${id}`,
      errors: error.errors || {},
    };
  }
};

// DELETE - Supprimer un articleweek
export const deleteArticleWeek = async (id) => {
  try {
    const response = await api.delete(`/articleweeks/${id}`);
    return {
      success: true,
      message: response.data?.message || "ArticleWeek supprimé avec succès",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || `Erreur lors de la suppression de l'articleweek ${id}`,
      errors: error.errors || {},
    };
  }
};


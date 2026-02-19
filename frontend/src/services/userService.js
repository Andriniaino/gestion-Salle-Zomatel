import api from "./api";

/**
 * Service pour gérer les Users
 */

// GET - Récupérer tous les utilisateurs
export const getUsers = async () => {
  try {
    const response = await api.get("/users");
    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Erreur lors de la récupération des utilisateurs",
      errors: error.errors || {},
    };
  }
};

// GET - Récupérer un utilisateur par ID
export const getUser = async (id) => {
  try {
    const response = await api.get(`/users/${id}`);
    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || `Erreur lors de la récupération de l'utilisateur ${id}`,
      errors: error.errors || {},
    };
  }
};

// POST - Créer un nouvel utilisateur
export const createUser = async (userData) => {
  try {
    const response = await api.post("/users", userData);
    return {
      success: true,
      data: response.data?.data || response.data,
      message: response.data?.message || "Utilisateur créé avec succès",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Erreur lors de la création de l'utilisateur",
      errors: error.errors || {},
    };
  }
};

// PUT - Mettre à jour un utilisateur
export const updateUser = async (id, userData) => {
  try {
    const response = await api.put(`/users/${id}`, userData);
    return {
      success: true,
      data: response.data?.data || response.data,
      message: response.data?.message || "Utilisateur mis à jour avec succès",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || `Erreur lors de la mise à jour de l'utilisateur ${id}`,
      errors: error.errors || {},
    };
  }
};

// DELETE - Supprimer un utilisateur
export const deleteUser = async (id) => {
  try {
    const response = await api.delete(`/users/${id}`);
    return {
      success: true,
      message: response.data?.message || "Utilisateur supprimé avec succès",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || `Erreur lors de la suppression de l'utilisateur ${id}`,
      errors: error.errors || {},
    };
  }
};


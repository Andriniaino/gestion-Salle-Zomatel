import api from "./api";

const getStorageBase = () => {
  const base = api.defaults.baseURL || "http://localhost:8000/api";
  return base.replace(/\/api\/?$/, "");
};

export const getUserImageUrl = (user) => {
  if (!user?.image) return null;
  return `${getStorageBase()}/storage/${user.image}`;
};

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
// ✅ fetch natif utilisé pour éviter axios qui transforme FormData en JSON
export const createUser = async (data) => {
  try {
    const token   = localStorage.getItem("token");
    const baseURL = (api.defaults.baseURL || "http://localhost:8000/api").replace(/\/$/, "");

    const response = await fetch(`${baseURL}/users`, {
      method: "POST",
      headers: {
        // ✅ PAS de Content-Type ici — le navigateur ajoute automatiquement
        // "multipart/form-data; boundary=..." quand body est un FormData
        "Authorization": `Bearer ${token}`,
        "Accept":        "application/json",
      },
      body: data, // ← FormData avec image + champs texte
    });

    const json = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: json.message || "Erreur lors de la création",
        errors:  json.errors  || null,
      };
    }

    return {
      success: true,
      data:    json.data    || json,
      message: json.message || "Utilisateur créé avec succès",
    };

  } catch (error) {
    return {
      success: false,
      message: error.message || "Erreur réseau",
      errors:  null,
    };
  }
};

// PUT - Mettre à jour un utilisateur
export const updateUser = async (id, userData) => {
  try {
    const response = await api.put(`/users/${id}`, userData);
    return {
      success: true,
      data:    response.data?.data || response.data,
      message: response.data?.message || "Utilisateur mis à jour avec succès",
    };
  } catch (error) {
    return {
      success: false,
      error:  error.message || `Erreur lors de la mise à jour de l'utilisateur ${id}`,
      errors: error.response?.data?.errors || {},
    };
  }
};

// POST - Mettre à jour la photo de profil
// ✅ fetch natif pour la même raison — évite axios de transformer FormData
export const uploadUserAvatar = async (id, file) => {
  try {
    const token   = localStorage.getItem("token");
    const baseURL = (api.defaults.baseURL || "http://localhost:8000/api").replace(/\/$/, "");

    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(`${baseURL}/users/${id}/avatar`, {
      method: "POST",
      headers: {
        // ✅ Pas de Content-Type — navigateur gère multipart automatiquement
        "Authorization": `Bearer ${token}`,
        "Accept":        "application/json",
      },
      body: formData,
    });

    const json = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error:  json.message || "Erreur lors de l'upload",
        errors: json.errors  || {},
      };
    }

    return {
      success: true,
      data:    json.data,
      message: json.message || "Photo mise à jour",
    };

  } catch (error) {
    return {
      success: false,
      error:  error.message || "Erreur réseau lors de l'upload",
      errors: {},
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
      error:  error.message || `Erreur lors de la suppression de l'utilisateur ${id}`,
      errors: error.errors  || {},
    };
  }
};
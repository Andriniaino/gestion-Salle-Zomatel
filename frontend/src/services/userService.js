import api from './api'

// ─── Base URL (sans /api) ─────────────────────────────────────────────────────
const getBaseURL = () => {
  return (api.defaults.baseURL || "http://100.116.170.3:8000/api")
    .replace(/\/api\/?$/, "");
};

// ─── Construit l'URL publique de l'image d'un utilisateur ────────────────────
export const getUserImageUrl = (user) => {
  if (!user?.image) return null;

  const image = user.image;
  const base  = getBaseURL();

  let url;
  if (image.startsWith("http://") || image.startsWith("https://")) {
    url = image;
  } else if (image.startsWith("storage/")) {
    url = `${base}/${image}`;
  } else {
    url = `${base}/storage/${image}`;
  }

  // Le cache-busting est géré côté composant avec ?t=imageTimestamp
  return url;
};

// ─── GET tous les utilisateurs ────────────────────────────────────────────────
export const getUsers = async () => {
  try {
    const response = await api.get("/users");
    return { success: true, data: response.data?.data || response.data };
  } catch (error) {
    return { success: false, error: error.message || "Erreur récupération utilisateurs" };
  }
};

// ─── GET un utilisateur ───────────────────────────────────────────────────────
export const getUser = async (id) => {
  try {
    const response = await api.get(`/users/${id}`);
    return { success: true, data: response.data?.data || response.data };
  } catch (error) {
    return { success: false, error: error.message || `Erreur récupération utilisateur ${id}` };
  }
};

// ─── POST créer un utilisateur (FormData avec image optionnelle) ──────────────
// ✅ FIX : utilise api Axios — token injecté automatiquement via intercepteur
export const createUser = async (formData) => {
  try {
    const response = await api.post("/users", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return {
      success: true,
      data:    response.data?.data    || response.data,
      message: response.data?.message || "Utilisateur créé avec succès",
    };
  } catch (error) {
    const json = error.response?.data;
    return {
      success: false,
      message: json?.message || "Erreur lors de la création",
      errors:  json?.errors  || null,
    };
  }
};

// ─── PUT mettre à jour un utilisateur ────────────────────────────────────────
export const updateUser = async (id, userData) => {
  try {
    const response = await api.put(`/users/${id}`, userData);
    return {
      success: true,
      data:    response.data?.data    || response.data,
      message: response.data?.message || "Utilisateur mis à jour avec succès",
    };
  } catch (error) {
    return {
      success: false,
      error:  error.message                || `Erreur mise à jour utilisateur ${id}`,
      errors: error.response?.data?.errors || {},
    };
  }
};

// ─── POST upload avatar ───────────────────────────────────────────────────────
// ✅ FIX : utilise api Axios — résout "Authorization: Bearer null"
export const uploadUserAvatar = async (id, file) => {
  try {
    const formData = new FormData();
    formData.append("image", file);

    const response = await api.post(`/users/${id}/avatar`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return {
      success: true,
      data:    response.data?.data,
      message: response.data?.message || "Photo mise à jour",
    };
  } catch (error) {
    const json = error.response?.data;
    return {
      success: false,
      error:  json?.message || "Erreur lors de l'upload",
      errors: json?.errors  || {},
    };
  }
};

// ─── DELETE supprimer un utilisateur ─────────────────────────────────────────
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
      error:  error.message || `Erreur suppression utilisateur ${id}`,
      errors: error.errors  || {},
    };
  }
};

export default {
  getUserImageUrl,
  getUsers,
  getUser,
  createUser,
  updateUser,
  uploadUserAvatar,
  deleteUser,
};
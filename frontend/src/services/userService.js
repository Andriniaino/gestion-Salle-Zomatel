import api from './api'

// ─── Base URL (sans /api) ─────────────────────────────────────────────────────
const getBaseURL = () => {
  const baseURL = api.defaults.baseURL || "http://100.116.170.3:8000/api";
  return baseURL.replace(/\/api\/?$/, "").replace(/\/+$/, "");
};

// ─── Construit l'URL publique de l'image d'un utilisateur ────────────────────
// ✅ CORRIGÉ : pas de Date.now() ici — l'URL doit rester STABLE entre les rendus.
//    Un timestamp dynamique génère une nouvelle URL à chaque re-render React,
//    ce qui empêche le navigateur de charger (et de cacher) l'image.
//    Le cache-busting est géré via le champ `updated_at` du backend si besoin.
export const getUserImageUrl = (user) => {
  if (!user?.image) return null;

  const image = user.image;

  // Déjà une URL complète (http:// ou https://)
  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  const base = getBaseURL();
  // Nettoie les slashes multiples au début
  const cleanImage = image.replace(/^\/+/, "");

  // Laravel stocke les avatars dans storage/app/public/avatars
  // Le lien symbolique `public/storage` → `storage/app/public` donne :
  //   http://host/storage/avatars/fichier.jpg
  // Le chemin enregistré en base est donc `avatars/fichier.jpg`
  // ou parfois `storage/avatars/fichier.jpg` selon la config.
  const url = cleanImage.startsWith("storage/")
    ? `${base}/${cleanImage}`
    : `${base}/storage/${cleanImage}`;

  // ✅ Cache-busting STABLE : on utilise updated_at (mis à jour par le backend
  //    uniquement quand la photo change), pas Date.now() qui change à chaque rendu.
  if (user.updated_at) {
    return `${url}?v=${encodeURIComponent(user.updated_at)}`;
  }

  return url;
};

// ─── GET tous les utilisateurs ────────────────────────────────────────────────
export const getUsers = async () => {
  try {
    const response = await api.get("/users");
    const users = response.data?.data || response.data;
    return { success: true, data: Array.isArray(users) ? users : [] };
  } catch (error) {
    console.error("Erreur getUsers:", error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Erreur récupération utilisateurs",
    };
  }
};

// ─── GET un utilisateur ───────────────────────────────────────────────────────
export const getUser = async (id) => {
  try {
    const response = await api.get(`/users/${id}`);
    const user = response.data?.data || response.data;
    return { success: true, data: user };
  } catch (error) {
    console.error(`Erreur getUser ${id}:`, error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || `Erreur récupération utilisateur ${id}`,
    };
  }
};

// ─── POST créer un utilisateur (FormData avec image optionnelle) ──────────────
export const createUser = async (formData) => {
  try {
    const response = await api.post("/users", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const userData = response.data?.data || response.data;
    return {
      success: true,
      data: userData,
      message: response.data?.message || "Utilisateur créé avec succès",
    };
  } catch (error) {
    console.error("Erreur createUser:", error);
    const json = error.response?.data;
    return {
      success: false,
      message: json?.message || "Erreur lors de la création",
      errors: json?.errors || null,
    };
  }
};

// ─── PUT mettre à jour un utilisateur ────────────────────────────────────────
export const updateUser = async (id, userData) => {
  try {
    const response = await api.put(`/users/${id}`, userData);
    const updatedUser = response.data?.data || response.data;
    return {
      success: true,
      data: updatedUser,
      message: response.data?.message || "Utilisateur mis à jour avec succès",
    };
  } catch (error) {
    console.error(`Erreur updateUser ${id}:`, error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || `Erreur mise à jour utilisateur ${id}`,
      errors: error.response?.data?.errors || {},
    };
  }
};

// ─── POST upload avatar ───────────────────────────────────────────────────────
export const uploadUserAvatar = async (id, file) => {
  try {
    const formData = new FormData();
    formData.append("image", file);
    const response = await api.post(`/users/${id}/avatar`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return {
      success: true,
      data: response.data?.data || response.data,
      message: response.data?.message || "Photo mise à jour",
    };
  } catch (error) {
    console.error(`Erreur uploadUserAvatar ${id}:`, error);
    const json = error.response?.data;
    return {
      success: false,
      error: json?.message || "Erreur lors de l'upload",
      errors: json?.errors || {},
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
    console.error(`Erreur deleteUser ${id}:`, error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || `Erreur suppression utilisateur ${id}`,
      errors: error.response?.data?.errors || {},
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
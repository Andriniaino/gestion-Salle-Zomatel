import api from "./api";

// ✅ Toutes les URLs se basent sur api — modifier l'IP dans api.js suffit
const getBaseURL = () => {
  return (api.defaults.baseURL || "http://localhost:8000/api")
    .replace(/\/api\/?$/, "");
};

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

  // Anti-cache léger : si updated_at est disponible, on l'utilise comme version
  if (user.updated_at) {
    const ts = Date.parse(user.updated_at);
    if (!Number.isNaN(ts)) {
      const sep = url.includes("?") ? "&" : "?";
      url = `${url}${sep}v=${ts}`;
    }
  }

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

// ─── POST créer un utilisateur (FormData avec image) ─────────────────────────
// fetch natif obligatoire pour multipart/form-data — axios transforme en JSON
export const createUser = async (formData) => {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch(`${getBaseURL()}/api/users`, {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept":        "application/json",
        // ⚠️ PAS de Content-Type → navigateur gère le boundary multipart
      },
      body: formData,
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
    return { success: false, message: error.message || "Erreur réseau", errors: null };
  }
};

// ─── PUT mettre à jour un utilisateur ────────────────────────────────────────
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
      error:  error.message || `Erreur mise à jour utilisateur ${id}`,
      errors: error.response?.data?.errors || {},
    };
  }
};


export const uploadUserAvatar = async (id, file) => {
  try {
    const token    = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(`${getBaseURL()}/api/users/${id}/avatar`, {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept":        "application/json",
        // ⚠️ PAS de Content-Type → navigateur gère le boundary multipart
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
    return { success: false, error: error.message || "Erreur réseau upload", errors: {} };
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
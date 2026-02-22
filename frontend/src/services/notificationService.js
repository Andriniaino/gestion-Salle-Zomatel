import api from "./api";

/**
 * Service pour gérer les Notifications
 * Toutes les méthodes gèrent les erreurs avec try/catch et retournent des promesses
 */

// GET - Récupérer toutes les notifications
export const getNotifications = async (params = {}) => {
  try {
    console.log("📡 Requête API:", params);
    const response = await api.get("/notifications", { params });
    console.log("✅ Réponse API:", response.data);
    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    console.error("❌ Erreur API getNotifications:", error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Erreur lors de la récupération des notifications",
      errors: error.response?.data?.errors || {},
    };
  }
};

// GET - Récupérer une notification par ID
export const getNotification = async (id) => {
  try {
    // ✅ CORRECTION: Utiliser des parenthèses, pas des backticks
    const response = await api.get(`/notifications/${id}`);
    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || `Erreur lors de la récupération de la notification ${id}`,
      errors: error.response?.data?.errors || {},
    };
  }
};

// POST - Créer une nouvelle notification
export const createNotification = async (data) => {
  try {
    const response = await api.post("/notifications", data);
    return {
      success: true,
      data: response.data?.data || response.data,
      message: response.data?.message || "Notification créée avec succès",
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Erreur lors de la création de la notification",
      errors: error.response?.data?.errors || {},
    };
  }
};

// PUT - Mettre à jour une notification
export const updateNotification = async (id, data) => {
  try {
    // ✅ CORRECTION: Utiliser des parenthèses, pas des backticks
    const response = await api.put(`/notifications/${id}`, data);
    return {
      success: true,
      data: response.data?.data || response.data,
      message: response.data?.message || "Notification mise à jour avec succès",
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || `Erreur lors de la mise à jour de la notification ${id}`,
      errors: error.response?.data?.errors || {},
    };
  }
};

// GET - Récupérer les notifications non lues
export const getUnreadNotifications = async () => {
  try {
    const response = await api.get("/notifications/unread");
    return {
      success: true,
      count: response.data?.count || 0,
      data: response.data?.data || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Erreur lors de la récupération des notifications non lues",
      errors: error.response?.data?.errors || {},
      count: 0,
      data: [],
    };
  }
};

export const backupAndDeleteNotifications = async () => {
  try {
    const response = await api.delete("/notifications/backup-delete");

    return {
      success: true,
      message: response.data?.message || "Succès",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "Erreur lors du backup des notifications",
    };
  }
};



export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await api.patch(`/notifications/${notificationId}/read`)
    return {
      success: true,
      data: response.data?.data ?? response.data,
    }
  } catch (error) {
    console.error("❌ Erreur markNotificationAsRead:", error)
    return {
      success: false,
      error: error.response?.data?.message ?? error.message,
    }
  }
}

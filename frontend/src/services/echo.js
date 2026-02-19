import Echo from "laravel-echo";
import Pusher from "pusher-js";

/**
 * Configuration de Laravel Echo pour les WebSockets avec Reverb
 * 
 * Reverb est compatible avec le protocole Pusher, donc on utilise pusher-js
 * Cette configuration permet de recevoir les notifications en temps réel
 * depuis le backend Laravel via Reverb
 */

// Configuration Pusher pour Reverb
window.Pusher = Pusher;

// Récupérer l'URL de l'API depuis les variables d'environnement ou utiliser localhost par défaut
const apiUrl = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";
const reverbHost = process.env.REACT_APP_REVERB_HOST || "127.0.0.1";
const reverbPort = process.env.REACT_APP_REVERB_PORT || 8080;
const reverbScheme = process.env.REACT_APP_REVERB_SCHEME || "http";
const reverbKey = process.env.REACT_APP_REVERB_APP_KEY || "local-key";

// Créer une instance d'Echo configurée pour Reverb
const echo = new Echo({
  broadcaster: "pusher",
  key: reverbKey,
  wsHost: reverbHost,
  wsPort: reverbPort,
  wssPort: reverbPort,
  forceTLS: reverbScheme === "https",
  enabledTransports: ["ws", "wss"],
  // Désactiver les statistiques pour le développement
  disableStats: true,
  // Configuration pour l'authentification des canaux privés
  authEndpoint: `${apiUrl}/broadcasting/auth`,
  auth: {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      Accept: "application/json",
    },
  },
  // Cluster requis par Pusher.js (même si Reverb ne l'utilise pas)
  cluster: process.env.REACT_APP_PUSHER_CLUSTER || "mt1",
});

export default echo;


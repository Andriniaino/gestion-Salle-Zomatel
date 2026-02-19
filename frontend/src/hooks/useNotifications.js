"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../contexts/AuthContext"
import { getUnreadNotifications, updateNotification } from "../services/notificationService"
import echo from "../services/echo"

/**
 * Hook personnalisé pour gérer les notifications en temps réel
 * 
 * Fonctionnalités :
 * - Charge les notifications non lues au démarrage
 * - Écoute les nouvelles notifications via WebSocket
 * - Met à jour le compteur automatiquement
 * - Récupère les notifications manquées lors de la reconnexion
 */
export const useNotifications = () => {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)

  // Charger les notifications non lues depuis l'API
  const fetchUnreadNotifications = useCallback(async () => {
    if (!user || user.categorie !== "admin") {
      setUnreadCount(0)
      setNotifications([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const result = await getUnreadNotifications()
      
      if (result.success) {
        setUnreadCount(result.count)
        setNotifications(result.data || [])
      } else {
        console.error("Erreur lors du chargement des notifications:", result.error)
        setUnreadCount(0)
        setNotifications([])
      }
    } catch (error) {
      console.error("Erreur lors du chargement des notifications:", error)
      setUnreadCount(0)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [user])

  // Synchroniser le compteur quand une notification est marquée lue ailleurs (ex: page historique)
  useEffect(() => {
    const handler = (event) => {
      const notificationId = event?.detail?.id
      if (!notificationId) return

      // Mise à jour locale (si présente), sinon on resynchronise depuis l'API
      let didUpdateLocal = false
      setNotifications((prev) => {
        const next = prev.map((n) => {
          if (n.id === notificationId && !n.lu) {
            didUpdateLocal = true
            return { ...n, lu: true }
          }
          return n
        })
        return next
      })

      if (didUpdateLocal) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      } else {
        fetchUnreadNotifications()
      }
    }

    window.addEventListener("notificationMarkedAsRead", handler)
    return () => window.removeEventListener("notificationMarkedAsRead", handler)
  }, [fetchUnreadNotifications])

  // Marquer une notification comme lue
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const result = await updateNotification(notificationId, { lu: true })
      
      if (result.success) {
        // Mettre à jour l'état local
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId ? { ...notif, lu: true } : notif
          )
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la notification:", error)
    }
  }, [])

  // Marquer toutes les notifications comme lues
  const markAllAsRead = useCallback(async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.lu).map((n) => n.id)
      
      await Promise.all(
        unreadIds.map((id) => updateNotification(id, { lu: true }))
      )
      
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, lu: true }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error("Erreur lors de la mise à jour des notifications:", error)
    }
  }, [notifications])

  // Configuration WebSocket avec Laravel Echo
  useEffect(() => {
    if (!user || user.categorie !== "admin") {
      return
    }

    // Charger les notifications au démarrage
    fetchUnreadNotifications()

    // Se connecter au canal WebSocket
    let channel = null
    
    try {
      channel = echo.channel("notifications")
      
      // Vérifier l'état de la connexion
      const checkConnection = () => {
        try {
          if (echo.connector && echo.connector.pusher && echo.connector.pusher.connection) {
            const state = echo.connector.pusher.connection.state
            if (state === "connected" || state === "connecting") {
              setIsConnected(true)
              console.log("🟢 État WebSocket:", state)
            } else {
              setIsConnected(false)
              console.log("🟡 État WebSocket:", state)
            }
          }
        } catch (error) {
          console.warn("⚠️ Erreur lors de la vérification de la connexion:", error)
        }
      }

      // Vérifier immédiatement
      checkConnection()

      // Écouter les événements de connexion (avec vérification de sécurité)
      if (echo.connector && echo.connector.pusher && echo.connector.pusher.connection) {
        const connection = echo.connector.pusher.connection
        
        const onConnected = () => {
          console.log("🟢 Connecté au serveur WebSocket (Reverb)")
          setIsConnected(true)
          
          // Récupérer les notifications manquées lors de la reconnexion
          fetchUnreadNotifications()
        }

        const onDisconnected = () => {
          console.log("🔴 Déconnecté du serveur WebSocket")
          setIsConnected(false)
        }

        const onError = (error) => {
          console.error("❌ Erreur WebSocket:", error)
          setIsConnected(false)
        }

        const onStateChange = (state) => {
          console.log("🔄 Changement d'état WebSocket:", state.current)
          if (state.current === "connected") {
            setIsConnected(true)
          } else if (state.current === "disconnected" || state.current === "failed") {
            setIsConnected(false)
          }
        }

        connection.bind("connected", onConnected)
        connection.bind("disconnected", onDisconnected)
        connection.bind("error", onError)
        connection.bind("state_change", onStateChange)

        // Écouter les nouvelles notifications en temps réel
        channel.listen(".notification.created", (notificationData) => {
          console.log("📩 Nouvelle notification reçue en temps réel:", notificationData)

          if (notificationData) {
            // Ajouter la nouvelle notification
            setNotifications((prev) => {
              // Vérifier si la notification existe déjà
              const exists = prev.some((n) => n.id === notificationData.id)
              if (exists) {
                console.log("⚠️ Notification déjà présente, ignorée")
                return prev
              }
              
              console.log("✅ Nouvelle notification ajoutée à la liste")
              return [notificationData, ...prev]
            })

            // Incrémenter le compteur si la notification n'est pas lue
            if (!notificationData.lu) {
              setUnreadCount((prev) => {
                const newCount = prev + 1
                console.log(`🔔 Compteur de notifications: ${prev} → ${newCount}`)
                return newCount
              })
            }

            // Déclencher un événement personnalisé pour notifier les composants (comme AdminDashboard)
            window.dispatchEvent(new CustomEvent('newNotificationReceived', { 
              detail: notificationData 
            }))
          }
        })

        // Nettoyer lors du démontage
        return () => {
          console.log("🧹 Nettoyage de la connexion WebSocket")
          if (channel) {
            channel.stopListening(".notification.created")
            echo.leave("notifications")
          }
          if (connection) {
            connection.unbind("connected", onConnected)
            connection.unbind("disconnected", onDisconnected)
            connection.unbind("error", onError)
            connection.unbind("state_change", onStateChange)
          }
        }
      } else {
        console.warn("⚠️ Connexion WebSocket non disponible")
      }
    } catch (error) {
      console.error("❌ Erreur lors de la configuration WebSocket:", error)
    }
  }, [user, fetchUnreadNotifications])

  return {
    unreadCount,
    notifications,
    loading,
    isConnected,
    fetchUnreadNotifications,
    markAsRead,
    markAllAsRead,
    // Callback pour notifier qu'une nouvelle notification a été reçue
    onNewNotification: (callback) => {
      // Cette fonction sera appelée depuis le hook pour déclencher le callback
      return callback
    },
  }
}

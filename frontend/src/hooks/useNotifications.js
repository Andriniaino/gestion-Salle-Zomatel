"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../contexts/AuthContext"
import { getUnreadNotifications, updateNotification } from "../services/notificationService"
import echo from "../services/echo"


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
    let connection = null

    try {
      channel = echo.channel("notifications")

      
      channel.listen(".notification.created", (notificationData) => {
        const payload = notificationData?.notification ?? notificationData
        console.log("📩 Nouvelle notification reçue en temps réel:", payload)

        if (!payload || payload.id == null) return

        // Ajouter la nouvelle notification
        setNotifications((prev) => {
          const exists = prev.some((n) => n.id === payload.id)
          if (exists) return prev
          return [payload, ...prev]
        })

        // Incrémenter le compteur si la notification n'est pas lue
        if (!payload.lu) {
          setUnreadCount((prev) => prev + 1)
        }

        // Déclencher un événement personnalisé pour notifier les composants (comme AdminDashboard)
        window.dispatchEvent(new CustomEvent("newNotificationReceived", { detail: payload }))
      })

      // Gestion de l'état de connexion (optionnelle)
      if (echo.connector && echo.connector.pusher && echo.connector.pusher.connection) {
        connection = echo.connector.pusher.connection
        setIsConnected(connection.state === "connected" || connection.state === "connecting")

        const onConnected = () => {
          setIsConnected(true)
          fetchUnreadNotifications()
        }
        const onDisconnected = () => setIsConnected(false)
        const onError = () => setIsConnected(false)
        const onStateChange = (state) => {
          const s = state?.current
          if (s === "connected" || s === "connecting") setIsConnected(true)
          if (s === "disconnected" || s === "failed") setIsConnected(false)
        }

        connection.bind("connected", onConnected)
        connection.bind("disconnected", onDisconnected)
        connection.bind("error", onError)
        connection.bind("state_change", onStateChange)

        // cleanup des binds
        return () => {
          if (channel) {
            channel.stopListening(".notification.created")
            echo.leave("notifications")
          }
          connection.unbind("connected", onConnected)
          connection.unbind("disconnected", onDisconnected)
          connection.unbind("error", onError)
          connection.unbind("state_change", onStateChange)
        }
      }

      // cleanup minimal si connection pas dispo au montage
      return () => {
        if (channel) {
          channel.stopListening(".notification.created")
          echo.leave("notifications")
        }
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

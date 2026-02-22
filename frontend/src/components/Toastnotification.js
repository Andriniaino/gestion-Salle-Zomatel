import { useEffect, useState } from "react"

export const ToastNotification = ({ toast, onClose, duration = 2000 }) => {
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    if (!toast) return

    setExiting(false)
    setVisible(true)

    const exitTimer = setTimeout(() => {
      setExiting(true)
    }, duration - 300)

    const closeTimer = setTimeout(() => {
      setVisible(false)
      onClose()
    }, duration)

    return () => {
      clearTimeout(exitTimer)
      clearTimeout(closeTimer)
    }
  }, [toast])

  if (!visible || !toast) return null

  const config = {
    success: {
      bg: "linear-gradient(135deg, #00b894, #00cec9)",
      icon: "✅",
      label: "Succès",
      shadow: "0 8px 32px rgba(0,184,148,0.45)",
    },
    error: {
      bg: "linear-gradient(135deg, #d63031, #e17055)",
      icon: "❌",
      label: "Erreur",
      shadow: "0 8px 32px rgba(214,48,49,0.45)",
    },
    warning: {
      bg: "linear-gradient(135deg, #fdcb6e, #e17055)",
      icon: "⚠️",
      label: "Attention",
      shadow: "0 8px 32px rgba(253,203,110,0.45)",
    },
    info: {
      bg: "linear-gradient(135deg, #0984e3, #6c5ce7)",
      icon: "ℹ️",
      label: "Info",
      shadow: "0 8px 32px rgba(9,132,227,0.45)",
    },
  }

  const { bg, icon, label, shadow } = config[toast.type] || config.info

  return (
    <>
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateY(-40px) scale(0.92); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes toastSlideOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(-30px) scale(0.92); }
        }
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
        .toast-wrapper {
          position: fixed;
          top: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 99999;
          min-width: 320px;
          max-width: 480px;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: ${shadow};
          background: ${bg};
          animation: ${exiting ? "toastSlideOut" : "toastSlideIn"} 0.3s cubic-bezier(.4,0,.2,1) forwards;
        }
        .toast-inner {
          padding: 18px 20px 14px;
          display: flex;
          align-items: flex-start;
          gap: 14px;
          color: #fff;
        }
        .toast-icon { font-size: 24px; line-height: 1; flex-shrink: 0; }
        .toast-content { flex: 1; }
        .toast-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          opacity: 0.85;
          margin-bottom: 3px;
        }
        .toast-message { font-size: 14px; font-weight: 500; line-height: 1.4; }
        .toast-close {
          background: none; border: none;
          color: rgba(255,255,255,0.75);
          font-size: 18px; cursor: pointer;
          line-height: 1; padding: 0;
          transition: color 0.15s; flex-shrink: 0;
        }
        .toast-close:hover { color: #fff; }
        .toast-bar {
          height: 3px;
          background: rgba(255,255,255,0.45);
          animation: toastProgress ${duration}ms linear forwards;
        }
      `}</style>

      <div className="toast-wrapper" role="alert">
        <div className="toast-inner">
          <span className="toast-icon">{icon}</span>
          <div className="toast-content">
            <div className="toast-label">{label}</div>
            <div className="toast-message">{toast.message}</div>
          </div>
          <button
            className="toast-close"
            onClick={() => { setExiting(true); setTimeout(() => { setVisible(false); onClose() }, 300) }}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
        <div className="toast-bar" />
      </div>
    </>
  )
}

export const useToast = () => {
  const [toast, setToast] = useState(null)

  const showToast = (message, type = "info") => {
    setToast(null)
    setTimeout(() => setToast({ message, type, key: Date.now() }), 10)
  }

  const clearToast = () => setToast(null)

  return { toast, showToast, clearToast }
}

export default ToastNotification
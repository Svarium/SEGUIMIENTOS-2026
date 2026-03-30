import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import bonfireSound from "../assets/Dark Souls - Hoguera - Efecto de Sonido.mp3";

export default function ReminderSystem({ isOpen, onClose, onCountChange }) {
  const [reminders, setReminders] = useState(() => {
    const saved = localStorage.getItem("dh_reminders");
    return saved ? JSON.parse(saved) : [];
  });

  const [activeReminder, setActiveReminder] = useState(null);

  const [newReminder, setNewReminder] = useState({
    message: "",
    date: "",
    time: "",
  });

  const audioRef = useRef(new Audio(bonfireSound));

  // Sincronizar con localStorage y avisar al header del conteo
  useEffect(() => {
    localStorage.setItem("dh_reminders", JSON.stringify(reminders));
    const pendingCount = reminders.filter(r => !r.notified).length;
    onCountChange(pendingCount);
  }, [reminders, onCountChange]);

  // Pedir permiso para notificaciones nativas
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Ticker para verificar recordatorios cada 10 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      let modified = false;

      const updatedReminders = reminders.map(r => {
        // Combinamos fecha y hora. Formato esperado: YYYY-MM-DD e HH:mm
        const reminderDate = new Date(`${r.date}T${r.time}`);
        
        if (!r.notified && reminderDate <= now) {
          triggerNotification(r);
          modified = true;
          return { ...r, notified: true };
        }
        return r;
      });

      if (modified) {
        setReminders(updatedReminders);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [reminders]);

  const triggerNotification = (reminder) => {
    // 1. Sonido
    audioRef.current.play().catch(e => console.error("Error al reproducir sonido:", e));

    // 2. Notificación Nativa
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("🔔 Recordatorio DH Schools", {
        body: reminder.message,
        icon: "/favicon.ico"
      });
    }

    // 3. Alerta Visual (Hoguera en pantalla)
    setActiveReminder(reminder);
    
    // Cerrar automáticamente tras 10 segundos
    setTimeout(() => {
      setActiveReminder(null);
    }, 10000);
  };

  const addReminder = (e) => {
    e.preventDefault();
    if (!newReminder.message || !newReminder.date || !newReminder.time) {
      toast.error("Completá todos los campos");
      return;
    }

    const id = Date.now();
    setReminders([...reminders, { ...newReminder, id, notified: false }]);
    setNewReminder({ message: "", date: "", time: "" });
    toast.success("Recordatorio programado");
  };

  const deleteReminder = (id) => {
    setReminders(reminders.filter(r => r.id !== id));
  };

  return (
    <>
      {/* PANEL DE GESTION (Solo si el usuario hizo clic en la campana) */}
      {isOpen && (
        <div className="reminders-panel">
          <div className="reminders-header">
            <h3>Recordatorios 🔔</h3>
            <button onClick={onClose} className="icon-btn">✕</button>
          </div>

          <form onSubmit={addReminder} className="reminder-form">
            <input 
              type="text" 
              placeholder="¿Qué recordar?" 
              value={newReminder.message}
              onChange={e => setNewReminder({...newReminder, message: e.target.value})}
              className="form-input"
            />
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input 
                type="date" 
                value={newReminder.date}
                onChange={e => setNewReminder({...newReminder, date: e.target.value})}
                className="form-input"
              />
              <input 
                type="time" 
                value={newReminder.time}
                onChange={e => setNewReminder({...newReminder, time: e.target.value})}
                className="form-input"
              />
            </div>
            <button type="submit" className="primary-button" style={{ width: "100%" }}>
              Programar Alarma
            </button>
          </form>

          <div className="reminders-list">
            {reminders.length === 0 ? (
              <p className="app-text-muted" style={{ textAlign: "center", padding: "1rem" }}>
                No tenés recordatorios.
              </p>
            ) : (
              reminders.sort((a,b) => b.id - a.id).map(r => (
                <div key={r.id} className={`reminder-item ${r.notified ? 'notified' : ''}`}>
                  <div className="reminder-content">
                    <p className="reminder-msg">{r.message}</p>
                    <span className="reminder-time">
                      {r.date} - {r.time} {r.notified && "✅"}
                    </span>
                  </div>
                  <button onClick={() => deleteReminder(r.id)} className="icon-btn danger">
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* BONFIRE FULLSCREEN OVERLAY (Usamos Portal para asegurar pantalla completa) */}
      {activeReminder && createPortal(
        <div 
          className="bonfire-overlay" 
          onClick={() => setActiveReminder(null)}
          style={{ zIndex: 9999999 }}
        >
          <div className="bonfire-flare"></div>
          <div className="bonfire-sparks"></div>
          <div className="bonfire-content">
            <p className="bonfire-text">{activeReminder.message}</p>
            <span className="bonfire-subtext">Notificación de Recordatorio 🔔</span>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

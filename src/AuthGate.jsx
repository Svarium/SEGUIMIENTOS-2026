import React, { useEffect, useState } from "react";
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "./firebase";

function AuthGate({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setInitializing(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error al iniciar sesión con Google:", error);
      alert("No se pudo iniciar sesión con Google.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      alert("No se pudo cerrar sesión.");
    }
  };

  if (initializing) {
    return (
      <div style={styles.fullscreen}>
        <div style={styles.card}>
          <p style={styles.textMuted}>Cargando sesión...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={styles.fullscreen}>
        <div style={styles.card}>
          <h1 style={styles.title}>App Seguimientos 2026</h1>
          <p style={styles.subtitle}>
            Iniciá sesión con tu cuenta de Google para continuar.
          </p>
          <button style={styles.button} onClick={handleLogin}>
            Ingresar con Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.appShell}>
      <header style={styles.header}>
        <div>
          <span style={styles.appName}>App Seguimientos 2026</span>
        </div>
        <div style={styles.userSection}>
          {user.photoURL && (
            <img 
              src={user.photoURL} 
              alt="Perfil" 
              style={styles.userAvatar} 
              title={user.email}
            />
          )}
          <span style={styles.userEmail}>{user.email}</span>
          <button style={styles.smallButton} onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </header>
      <main style={styles.main}>{children}</main>
    </div>
  );
}

const styles = {
  fullscreen: {
    minHeight: "100vh",
    margin: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#050816",
    fontFamily:
      "'Roboto', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    color: "#F9FAFB",
  },
  card: {
    background: "#0B1120",
    padding: "2.5rem 3rem",
    borderRadius: "1rem",
    boxShadow: "0 20px 40px rgba(0,0,0,0.7)",
    maxWidth: "420px",
    width: "100%",
    textAlign: "center",
    border: "1px solid rgba(148, 163, 184, 0.2)",
  },
  title: {
    fontSize: "1.8rem",
    marginBottom: "0.75rem",
    fontWeight: 600,
    color: "#E5E7EB",
  },
  subtitle: {
    fontSize: "0.95rem",
    marginBottom: "1.5rem",
    color: "#9CA3AF",
  },
  textMuted: {
    fontSize: "0.9rem",
    color: "#9CA3AF",
  },
  button: {
    background:
      "linear-gradient(135deg, #22D3EE 0%, #6366F1 50%, #EC4899 100%)",
    border: "none",
    borderRadius: "999px",
    padding: "0.75rem 1.75rem",
    color: "#0B1120",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "0.95rem",
    boxShadow: "0 10px 25px rgba(59, 130, 246, 0.4)",
  },
  appShell: {
    minHeight: "100vh",
    background: "#050816",
    color: "#F9FAFB",
    fontFamily:
      "'Roboto', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },
  header: {
    height: "60px",
    padding: "0 1.5rem",
    borderBottom: "1px solid rgba(148, 163, 184, 0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "rgba(15, 23, 42, 0.9)",
    backdropFilter: "blur(12px)",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  appName: {
    fontWeight: 600,
    letterSpacing: "0.04em",
    fontSize: "0.95rem",
    textTransform: "uppercase",
    color: "#E5E7EB",
  },
  userSection: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  userAvatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid rgba(148, 163, 184, 0.4)",
  },
  userEmail: {
    fontSize: "0.85rem",
    color: "#9CA3AF",
  },
  smallButton: {
    background: "transparent",
    borderRadius: "999px",
    border: "1px solid rgba(148, 163, 184, 0.6)",
    color: "#E5E7EB",
    padding: "0.35rem 0.9rem",
    fontSize: "0.8rem",
    cursor: "pointer",
  },
  main: {
    padding: "0",
    maxWidth: "100%",
    margin: 0,
  },
};

export default AuthGate;


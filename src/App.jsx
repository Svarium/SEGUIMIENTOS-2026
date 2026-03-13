import React from "react";
import AuthGate from "./AuthGate";
import "./App.css";

function App() {
  return (
    <AuthGate>
      <div className="app-background">
        <div className="app-panel">
          <h2 className="app-title">Panel inicial</h2>
          <p className="app-text">
            Acá más adelante vas a ver tus colegios, snapshots y seguimientos.
          </p>
          <p className="app-text-muted">
            Próximo paso: CRUD de colegios y carga de contactos.
          </p>
        </div>
      </div>
    </AuthGate>
  );
}

export default App;
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AuthGate from "./AuthGate";
import SchoolsPage from "./SchoolsPage";
import EvolutionPage from "./EvolutionPage";
import "./App.css";

function App() {
  return (
    <Router>
      <AuthGate>
        <div className="app-background">
          <div className="app-panel">
            <Routes>
              <Route path="/" element={<Navigate to="/schools" replace />} />
              <Route path="/schools" element={<SchoolsPage />} />
              <Route path="/evolution" element={<EvolutionPage />} />
            </Routes>
          </div>
        </div>
      </AuthGate>
    </Router>
  );
}

export default App;
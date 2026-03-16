import React from "react";
import AuthGate from "./AuthGate";
import SchoolsPage from "./SchoolsPage";
import "./App.css";

function App() {
  return (
    <AuthGate>
      <div className="app-background">
        <div className="app-panel">
          <SchoolsPage />
        </div>
      </div>
    </AuthGate>
  );
}

export default App;
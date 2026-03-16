import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";

const SYSTEM_OPTIONS = [
  "Argentina Nativa",
  "Santillana",
  "Otro",
];

function SchoolsPage() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    alias: "",
    country: "",
    system: "Argentina Nativa",
  });

  useEffect(() => {
    const colRef = collection(db, "schools");
    const q = query(colRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSchools(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error al escuchar schools:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      alert("El nombre del colegio es obligatorio.");
      return;
    }

    try {
      setSaving(true);
      const colRef = collection(db, "schools");
      await addDoc(colRef, {
        name: form.name.trim(),
        alias: form.alias.trim() || null,
        country: form.country.trim() || null,
        system: form.system,
        createdAt: serverTimestamp(),
      });
      setForm({
        name: "",
        alias: "",
        country: "",
        system: "Argentina Nativa",
      });
    } catch (error) {
      console.error("Error al crear colegio:", error);
      alert("No se pudo crear el colegio.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="schools-layout">
      <section className="schools-form-section">
        <h2 className="app-title">Colegios</h2>
        <p className="app-text">
          Cargá los colegios con los que trabajás. Más adelante vas a poder
          agregar contactos y snapshots para cada uno.
        </p>

        <form className="school-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label className="form-label">
              Nombre del colegio
              <input
                className="form-input"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Ej: Gimnasio Cristophoro Colombo"
                required
              />
            </label>
          </div>

          <div className="form-row form-row-inline">
            <label className="form-label">
              Alias
              <input
                className="form-input"
                type="text"
                name="alias"
                value={form.alias}
                onChange={handleChange}
                placeholder="Ej: GCC"
              />
            </label>

            <label className="form-label">
              País
              <input
                className="form-input"
                type="text"
                name="country"
                value={form.country}
                onChange={handleChange}
                placeholder="Ej: Colombia"
              />
            </label>
          </div>

          <div className="form-row">
            <label className="form-label">
              Sistema
              <select
                className="form-input"
                name="system"
                value={form.system}
                onChange={handleChange}
              >
                {SYSTEM_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-actions">
            <button
              className="primary-button"
              type="submit"
              disabled={saving}
            >
              {saving ? "Guardando..." : "Crear colegio"}
            </button>
          </div>
        </form>
      </section>

      <section className="schools-list-section">
        <h3 className="section-title">Listado de colegios</h3>
        {loading ? (
          <p className="app-text-muted">Cargando colegios...</p>
        ) : schools.length === 0 ? (
          <p className="app-text-muted">
            Todavía no hay colegios cargados. Creá el primero con el formulario
            de la izquierda.
          </p>
        ) : (
          <div className="schools-table">
            <div className="schools-table-header">
              <span>Nombre</span>
              <span>Alias</span>
              <span>País</span>
              <span>Sistema</span>
            </div>
            {schools.map((school) => (
              <div key={school.id} className="schools-table-row">
                <span>{school.name}</span>
                <span>{school.alias || "—"}</span>
                <span>{school.country || "—"}</span>
                <span>{school.system || "—"}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default SchoolsPage;


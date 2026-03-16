import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  doc,
  deleteDoc,
} from "firebase/firestore";
import toast from "react-hot-toast";
import Modal from "./Modal";

const SYSTEM_OPTIONS = [
  "Argentina Nativa",
  "Santillana",
  "Otro",
];

const COUNTRY_OPTIONS = [
  "Argentina",
  "Brasil",
  "Colombia",
  "México",
  "Uruguay",
  "Chile",
  "Honduras",
  "Guatemala",
  "El Salvador",
];

function SchoolsPage() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [form, setForm] = useState({
    name: "",
    alias: "",
    country: "Argentina",
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
        toast.error("No se pudieron cargar los colegios.");
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
      toast.error("El nombre del colegio es obligatorio.");
      return;
    }

    try {
      setSaving(true);
      const colRef = collection(db, "schools");
      await addDoc(colRef, {
        name: form.name.trim(),
        alias: form.alias.trim() || null,
        country: form.country || null,
        system: form.system,
        createdAt: serverTimestamp(),
      });
      setForm({
        name: "",
        alias: "",
        country: "Argentina",
        system: "Argentina Nativa",
      });
      toast.success("Colegio creado correctamente.");
    } catch (error) {
      console.error("Error al crear colegio:", error);
      toast.error("No se pudo crear el colegio.");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenCreateModal = () => {
    setForm({
      name: "",
      alias: "",
      country: "Argentina",
      system: "Argentina Nativa",
    });
    setShowCreateModal(true);
  };

  const handleOpenDetailModal = (school) => {
    setSelectedSchool(school);
    setShowDetailModal(true);
  };

  const handleCloseModals = () => {
    setShowCreateModal(false);
    setShowDetailModal(false);
    setSelectedSchool(null);
    setConfirmingDelete(false);
  };

  const handleDeleteSelectedSchool = async () => {
    if (!selectedSchool) return;

    try {
      const ref = doc(db, "schools", selectedSchool.id);
      await deleteDoc(ref);
      toast.success("Colegio eliminado.");
      handleCloseModals();
    } catch (error) {
      console.error("Error al eliminar colegio:", error);
      toast.error("No se pudo eliminar el colegio.");
    }
  };

  return (
    <>
      <div className="schools-header">
        <div>
          <h2 className="app-title">Colegios</h2>
          <p className="app-text">
            Cargá los colegios con los que trabajás. Más adelante vas a poder
            agregar contactos, docentes y snapshots para cada uno.
          </p>
        </div>
        <button
          className="primary-button"
          type="button"
          onClick={handleOpenCreateModal}
        >
          Agregar colegio
        </button>
      </div>

      <section className="schools-grid">
        {loading ? (
          <p className="app-text-muted">Cargando colegios...</p>
        ) : schools.length === 0 ? (
          <p className="app-text-muted">
            Todavía no hay colegios cargados. Usá el botón "Agregar colegio"
            para crear el primero.
          </p>
        ) : (
          schools.map((school) => (
            <button
              key={school.id}
              type="button"
              className="school-card"
              onClick={() => handleOpenDetailModal(school)}
            >
              <div className="school-card-title-row">
                <h3 className="school-card-name">{school.name}</h3>
                {school.alias && (
                  <span className="school-card-alias">{school.alias}</span>
                )}
              </div>
              <div className="school-card-meta">
                <span>{school.country || "Sin país"}</span>
                <span>•</span>
                <span>{school.system || "Sin sistema"}</span>
              </div>
              <p className="school-card-hint">
                Click para ver detalles, editar o eliminar.
              </p>
            </button>
          ))
        )}
      </section>

      <Modal
        isOpen={showCreateModal}
        title="Nuevo colegio"
        onClose={handleCloseModals}
        footer={
          <div className="modal-footer-spread">
            <button
              type="button"
              className="secondary-button"
              onClick={handleCloseModals}
            >
              Cancelar
            </button>
            <button
              className="primary-button"
              type="submit"
              form="create-school-form"
              disabled={saving}
            >
              {saving ? "Guardando..." : "Crear colegio"}
            </button>
          </div>
        }
      >
        <form id="create-school-form" className="school-form" onSubmit={handleSubmit}>
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
              <select
                className="form-input"
                name="country"
                value={form.country}
                onChange={handleChange}
              >
                {COUNTRY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
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
        </form>
      </Modal>

      <Modal
        isOpen={showDetailModal && !!selectedSchool}
        title={selectedSchool ? selectedSchool.name : "Detalle de colegio"}
        onClose={handleCloseModals}
        footer={
          <div className="modal-footer-spread">
            <div className="delete-confirm-area">
              {confirmingDelete ? (
                <>
                  <span className="delete-confirm-text">
                    ¿Eliminar este colegio? Esta acción no se puede deshacer.
                  </span>
                  <button
                    type="button"
                    className="danger-button"
                    onClick={handleDeleteSelectedSchool}
                  >
                    Sí, eliminar
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setConfirmingDelete(false)}
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="danger-button"
                  onClick={() => setConfirmingDelete(true)}
                >
                  Eliminar colegio
                </button>
              )}
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={handleCloseModals}
            >
              Cerrar
            </button>
          </div>
        }
      >
        {selectedSchool && (
          <div className="school-detail">
            <div className="school-detail-grid">
              <div className="school-detail-block">
                <span className="school-detail-label">Nombre</span>
                <span className="school-detail-value">
                  {selectedSchool.name || "—"}
                </span>
              </div>
              <div className="school-detail-block">
                <span className="school-detail-label">Alias</span>
                <span className="school-detail-value">
                  {selectedSchool.alias || "—"}
                </span>
              </div>
              <div className="school-detail-block">
                <span className="school-detail-label">País</span>
                <span className="school-detail-value">
                  {selectedSchool.country || "—"}
                </span>
              </div>
              <div className="school-detail-block">
                <span className="school-detail-label">Sistema</span>
                <span className="school-detail-value">
                  {selectedSchool.system || "—"}
                </span>
              </div>
            </div>

            <div className="school-detail-section">
              <h4 className="section-title">Docentes y contactos</h4>
              <p className="app-text-muted">
                Próximamente vas a poder cargar y editar acá los contactos
                (directivos, docentes) y vincular sus PLD y snapshots del
                backend.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

export default SchoolsPage;


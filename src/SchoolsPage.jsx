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
  updateDoc,
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

const CONTACT_TYPE_OPTIONS = [
  "Docente",
  "Coordinador",
  "Directivo",
  "Asesor de Santillana",
  "Otros",
];

const TEACHES_RELEVANT_TYPES = new Set(["Docente", "Coordinador", "Directivo"]);

function SchoolsPage() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsSaving, setContactsSaving] = useState(false);
  const [editingContactId, setEditingContactId] = useState(null);
  const [confirmDeleteContactId, setConfirmDeleteContactId] = useState(null);
  const [contactForm, setContactForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    whatsapp: "",
    contactType: "Docente",
    teaches: true,
  });

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

  const handleContactChange = (event) => {
    const { name, value } = event.target;
    setContactForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetContactForm = () => {
    setContactForm({
      firstName: "",
      lastName: "",
      email: "",
      whatsapp: "",
      contactType: "Docente",
      teaches: true,
    });
    setEditingContactId(null);
    setConfirmDeleteContactId(null);
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
    setContacts([]);
    setContactsLoading(false);
    resetContactForm();
  };

  useEffect(() => {
    if (!showDetailModal || !selectedSchool?.id) return;

    setContactsLoading(true);
    const colRef = collection(db, "schools", selectedSchool.id, "contacts");
    const q = query(colRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setContacts(data);
        setContactsLoading(false);
      },
      (error) => {
        console.error("Error al escuchar contacts:", error);
        toast.error("No se pudieron cargar los contactos.");
        setContactsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [showDetailModal, selectedSchool?.id]);

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

  const handleSubmitContact = async (event) => {
    event.preventDefault();
    if (!selectedSchool?.id) return;

    if (!contactForm.firstName.trim() || !contactForm.lastName.trim()) {
      toast.error("Nombre y apellido son obligatorios.");
      return;
    }

    const payload = {
      firstName: contactForm.firstName.trim(),
      lastName: contactForm.lastName.trim(),
      email: contactForm.email.trim() || null,
      whatsapp: contactForm.whatsapp.trim() || null,
      contactType: contactForm.contactType,
      teaches: TEACHES_RELEVANT_TYPES.has(contactForm.contactType)
        ? !!contactForm.teaches
        : null,
      updatedAt: serverTimestamp(),
    };

    try {
      setContactsSaving(true);

      if (editingContactId) {
        const ref = doc(
          db,
          "schools",
          selectedSchool.id,
          "contacts",
          editingContactId
        );
        await updateDoc(ref, payload);
        toast.success("Contacto actualizado.");
      } else {
        const colRef = collection(db, "schools", selectedSchool.id, "contacts");
        await addDoc(colRef, {
          ...payload,
          createdAt: serverTimestamp(),
        });
        toast.success("Contacto creado.");
      }

      resetContactForm();
    } catch (error) {
      console.error("Error al guardar contacto:", error);
      toast.error("No se pudo guardar el contacto.");
    } finally {
      setContactsSaving(false);
    }
  };

  const handleEditContact = (contact) => {
    setEditingContactId(contact.id);
    setConfirmDeleteContactId(null);
    setContactForm({
      firstName: contact.firstName || "",
      lastName: contact.lastName || "",
      email: contact.email || "",
      whatsapp: contact.whatsapp || "",
      contactType: contact.contactType || "Docente",
      teaches:
        contact.teaches === null || contact.teaches === undefined
          ? true
          : !!contact.teaches,
    });
  };

  const handleDeleteContact = async (contactId) => {
    if (!selectedSchool?.id) return;
    try {
      const ref = doc(db, "schools", selectedSchool.id, "contacts", contactId);
      await deleteDoc(ref);
      toast.success("Contacto eliminado.");
      if (editingContactId === contactId) resetContactForm();
      setConfirmDeleteContactId(null);
    } catch (error) {
      console.error("Error al eliminar contacto:", error);
      toast.error("No se pudo eliminar el contacto.");
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
        size="lg"
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
              <div className="contacts-header-row">
                <p className="app-text-muted" style={{ margin: 0 }}>
                  Cargá los contactos clave del colegio (docentes, directivos,
                  coordinadores, etc.).
                </p>
              </div>

              <form className="school-form" onSubmit={handleSubmitContact}>
                <div className="contacts-form-grid">
                  <label className="form-label">
                    Nombre
                    <input
                      className="form-input"
                      type="text"
                      name="firstName"
                      value={contactForm.firstName}
                      onChange={handleContactChange}
                      placeholder="Ej: María"
                      required
                    />
                  </label>

                  <label className="form-label">
                    Apellido
                    <input
                      className="form-input"
                      type="text"
                      name="lastName"
                      value={contactForm.lastName}
                      onChange={handleContactChange}
                      placeholder="Ej: González"
                      required
                    />
                  </label>

                  <label className="form-label">
                    Email
                    <input
                      className="form-input"
                      type="email"
                      name="email"
                      value={contactForm.email}
                      onChange={handleContactChange}
                      placeholder="ejemplo@digitalhouse.com"
                    />
                  </label>

                  <label className="form-label">
                    WhatsApp
                    <input
                      className="form-input"
                      type="text"
                      name="whatsapp"
                      value={contactForm.whatsapp}
                      onChange={handleContactChange}
                      placeholder="+54 9 ..."
                    />
                  </label>

                  <label className="form-label">
                    Tipo de contacto
                    <select
                      className="form-input"
                      name="contactType"
                      value={contactForm.contactType}
                      onChange={(e) => {
                        const nextType = e.target.value;
                        setContactForm((prev) => ({
                          ...prev,
                          contactType: nextType,
                          teaches: TEACHES_RELEVANT_TYPES.has(nextType)
                            ? prev.teaches
                            : true,
                        }));
                      }}
                    >
                      {CONTACT_TYPE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </label>

                  {TEACHES_RELEVANT_TYPES.has(contactForm.contactType) ? (
                    <div className="toggle-row">
                      <span className="toggle-label">¿Da clases?</span>
                      <div className="toggle-buttons">
                        <button
                          type="button"
                          className={`chip-button ${
                            contactForm.teaches ? "active" : ""
                          }`}
                          onClick={() =>
                            setContactForm((prev) => ({ ...prev, teaches: true }))
                          }
                        >
                          Sí
                        </button>
                        <button
                          type="button"
                          className={`chip-button ${
                            !contactForm.teaches ? "active" : ""
                          }`}
                          onClick={() =>
                            setContactForm((prev) => ({
                              ...prev,
                              teaches: false,
                            }))
                          }
                        >
                          No
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="toggle-row">
                      <span className="toggle-label">¿Da clases?</span>
                      <span className="app-text-muted" style={{ margin: 0 }}>
                        —
                      </span>
                    </div>
                  )}
                </div>

                <div className="form-actions" style={{ gap: "0.6rem" }}>
                  {editingContactId && (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={resetContactForm}
                      disabled={contactsSaving}
                    >
                      Cancelar edición
                    </button>
                  )}
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={contactsSaving}
                  >
                    {contactsSaving
                      ? "Guardando..."
                      : editingContactId
                      ? "Guardar cambios"
                      : "Agregar contacto"}
                  </button>
                </div>
              </form>

              <div style={{ marginTop: "1rem" }}>
                <h4 className="section-title">Contactos</h4>
                {contactsLoading ? (
                  <p className="app-text-muted">Cargando contactos...</p>
                ) : contacts.length === 0 ? (
                  <p className="app-text-muted">
                    Todavía no hay contactos cargados.
                  </p>
                ) : (
                  <div className="contacts-table">
                    <div className="contacts-table-header">
                      <span>Nombre</span>
                      <span>Tipo</span>
                      <span>Email</span>
                      <span>WhatsApp</span>
                      <span>Da clases</span>
                      <span style={{ textAlign: "right" }}>Acciones</span>
                    </div>
                    {contacts.map((c) => {
                      const fullName = `${c.lastName || ""}${
                        c.lastName ? ", " : ""
                      }${c.firstName || ""}`.trim();
                      const showTeaches = TEACHES_RELEVANT_TYPES.has(
                        c.contactType
                      );
                      return (
                        <div key={c.id} className="contacts-table-row">
                          <span>{fullName || "—"}</span>
                          <span>{c.contactType || "—"}</span>
                          <span>{c.email || "—"}</span>
                          <span>{c.whatsapp || "—"}</span>
                          <span>
                            {showTeaches
                              ? c.teaches
                                ? "Sí"
                                : "No"
                              : "—"}
                          </span>
                          <div className="contacts-actions">
                            <button
                              type="button"
                              className="link-button"
                              onClick={() => handleEditContact(c)}
                            >
                              Editar
                            </button>

                            {confirmDeleteContactId === c.id ? (
                              <div className="inline-confirm">
                                <button
                                  type="button"
                                  className="link-button danger"
                                  onClick={() => handleDeleteContact(c.id)}
                                >
                                  Confirmar
                                </button>
                                <button
                                  type="button"
                                  className="link-button"
                                  onClick={() => setConfirmDeleteContactId(null)}
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="link-button danger"
                                onClick={() => setConfirmDeleteContactId(c.id)}
                              >
                                Eliminar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

export default SchoolsPage;


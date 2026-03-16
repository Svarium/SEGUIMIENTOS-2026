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
  getDocs,
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
  const [showContactModal, setShowContactModal] = useState(false);
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

  const [snapshots, setSnapshots] = useState([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState(false);
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [snapshotFile, setSnapshotFile] = useState(null);
  const [snapshotUploading, setSnapshotUploading] = useState(false);
  const [snapshotSaving, setSnapshotSaving] = useState(false);
  const [snapshotError, setSnapshotError] = useState("");
  const [snapshotData, setSnapshotData] = useState(null);
  const [snapshotComments, setSnapshotComments] = useState("");
  const [snapshotRisk, setSnapshotRisk] = useState("medio");
  const [groupStatuses, setGroupStatuses] = useState({});
  const [snapshotMode, setSnapshotMode] = useState("create"); // "create" | "view"
  const [confirmDeleteSnapshotId, setConfirmDeleteSnapshotId] = useState(null);

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

  const handleOpenContactModal = () => {
    resetContactForm();
    setShowContactModal(true);
  };

  const handleCloseContactModal = () => {
    setShowContactModal(false);
    resetContactForm();
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
    setShowContactModal(false);
    setSelectedSchool(null);
    setConfirmingDelete(false);
    setContacts([]);
    setContactsLoading(false);
    resetContactForm();
    setConfirmDeleteSnapshotId(null);
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

  useEffect(() => {
    if (!showDetailModal || !selectedSchool?.id) return;

    setSnapshotsLoading(true);
    const colRef = collection(db, "schools", selectedSchool.id, "snapshots");
    const q = query(colRef, orderBy("generatedAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setSnapshots(data);
        setSnapshotsLoading(false);
      },
      (error) => {
        console.error("Error al escuchar snapshots:", error);
        toast.error("No se pudieron cargar los snapshots.");
        setSnapshotsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [showDetailModal, selectedSchool?.id]);

  const handleDeleteSelectedSchool = async () => {
    if (!selectedSchool) return;

    try {
      // Usar toast.promise si lo prefieres, pero un toast estático para dar feedback sirve
      const toastId = toast.loading("Eliminando colegio y sus datos...");
      
      const schoolRef = doc(db, "schools", selectedSchool.id);
      
      // Obtener y eliminar todos los contactos
      const contactsRef = collection(db, "schools", selectedSchool.id, "contacts");
      const contactsSnap = await getDocs(contactsRef);
      const deletePromises = [];
      contactsSnap.forEach((docSnap) => {
        deletePromises.push(deleteDoc(docSnap.ref));
      });

      // Obtener y eliminar todos los snapshots
      const snapshotsRef = collection(db, "schools", selectedSchool.id, "snapshots");
      const snapshotsSnap = await getDocs(snapshotsRef);
      snapshotsSnap.forEach((docSnap) => {
        deletePromises.push(deleteDoc(docSnap.ref));
      });

      // Ejecutar borrados en paralelo
      await Promise.all(deletePromises);
      
      // Borrar el colegio padre
      await deleteDoc(schoolRef);

      toast.success("Colegio y todos sus datos eliminados.", { id: toastId });
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

      setShowContactModal(false);
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
    setShowContactModal(true);
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

  const handleOpenSnapshotModal = () => {
    setSnapshotMode("create");
    setSnapshotFile(null);
    setSnapshotUploading(false);
    setSnapshotSaving(false);
    setSnapshotError("");
    setSnapshotData(null);
    setSnapshotComments("");
    setSnapshotRisk("medio");
    setGroupStatuses({});
    setConfirmDeleteSnapshotId(null);
    setShowSnapshotModal(true);
  };

  const handleCloseSnapshotModal = () => {
    setShowSnapshotModal(false);
  };

  const handleSnapshotFileChange = (event) => {
    const file = event.target.files?.[0];
    setSnapshotFile(file || null);
  };

  const handleUploadSnapshot = async () => {
    if (!snapshotFile) {
      toast.error("Seleccioná un archivo .csv o .xlsx.");
      return;
    }
    if (!selectedSchool) {
      toast.error("No hay un colegio seleccionado.");
      return;
    }

    try {
      setSnapshotUploading(true);
      setSnapshotError("");

      const formData = new FormData();
      formData.append("file", snapshotFile);

      const response = await fetch("http://127.0.0.1:8000/analyze-report", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }

      const data = await response.json();
      setSnapshotData(data);
      toast.success("Reporte analizado correctamente.");
    } catch (error) {
      console.error("Error al analizar reporte:", error);
      setSnapshotError(
        "No se pudo analizar el reporte. Verificá que el backend esté levantado."
      );
      toast.error("Error al analizar el reporte.");
    } finally {
      setSnapshotUploading(false);
    }
  };

  const handleSaveSnapshot = async () => {
    if (!selectedSchool?.id || !snapshotData || snapshotMode !== "create") return;

    try {
      setSnapshotSaving(true);

      const { school, students, teachers_pld, metadata } = snapshotData;

      const summary = {
        schoolIdFromReport: school?.id || null,
        total_students: school?.total_students ?? null,
        total_student_groups: school?.total_student_groups ?? null,
        total_teachers: teachers_pld?.summary?.total_teachers ?? null,
        certified_teachers: teachers_pld?.summary?.certified_teachers ?? null,
        certification_rate_percent:
          teachers_pld?.summary?.certification_rate_percent ?? null,
        digital_vitality_30d_avg:
          students?.summary?.digital_vitality_30d_avg ?? null,
        recent_progress_15d_avg:
          students?.summary?.recent_progress_15d_avg ?? null,
      };

      const colRef = collection(db, "schools", selectedSchool.id, "snapshots");
      const generatedDate = metadata?.generated_at
        ? new Date(metadata.generated_at)
        : new Date();

      await addDoc(colRef, {
        generatedAt: generatedDate,
        createdAt: serverTimestamp(),
        riskLevel: snapshotRisk,
        comments: snapshotComments.trim() || null,
        summary,
        backendPayload: snapshotData,
      });

      // actualizar resumen en el documento de colegio
      const schoolRef = doc(db, "schools", selectedSchool.id);
      await updateDoc(schoolRef, {
        lastSnapshotRisk: snapshotRisk,
        lastSnapshotAt: serverTimestamp(),
      });

      toast.success("Snapshot guardado.");
      setShowSnapshotModal(false);
    } catch (error) {
      console.error("Error al guardar snapshot:", error);
      toast.error("No se pudo guardar el snapshot.");
    } finally {
      setSnapshotSaving(false);
    }
  };

  const handleOpenSnapshotView = (snapshot) => {
    if (!snapshot?.backendPayload) {
      toast.error("Este snapshot no tiene payload almacenado.");
      return;
    }
    setSnapshotMode("view");
    setSnapshotFile(null);
    setSnapshotError("");
    setSnapshotUploading(false);
    setSnapshotSaving(false);
    setSnapshotData(snapshot.backendPayload);
    setSnapshotComments(snapshot.comments || "");
    setSnapshotRisk(snapshot.riskLevel || "medio");
    setGroupStatuses({});
    setConfirmDeleteSnapshotId(null);
    setShowSnapshotModal(true);
  };

  const handleDeleteSnapshot = async (snapshotId) => {
    if (!selectedSchool?.id) return;
    try {
      const ref = doc(db, "schools", selectedSchool.id, "snapshots", snapshotId);
      await deleteDoc(ref);
      toast.success("Snapshot eliminado.");
      setConfirmDeleteSnapshotId(null);
    } catch (error) {
      console.error("Error al eliminar snapshot:", error);
      toast.error("No se pudo eliminar el snapshot.");
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
              className={`school-card${
                school.lastSnapshotRisk
                  ? ` school-card-${school.lastSnapshotRisk}`
                  : ""
              }`}
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

            {/* SECOND SECTION: CONTACTS */}
            <div className="school-detail-section">
              <div className="contacts-header-row">
                <h4 className="section-title" style={{ margin: 0 }}>Docentes y contactos</h4>
                <button
                  type="button"
                  className="primary-button"
                  onClick={handleOpenContactModal}
                >
                  Nuevo contacto
                </button>
              </div>

              <div>
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

            {/* THIRD SECTION: SNAPSHOTS */}
            <div className="school-detail-section">
              <div className="snapshots-header-row">
                <h4 className="section-title">Snapshots del reporte</h4>
                <button
                  type="button"
                  className="primary-button"
                  onClick={handleOpenSnapshotModal}
                >
                  Nuevo snapshot
                </button>
              </div>
              {snapshotsLoading ? (
                <p className="app-text-muted">Cargando snapshots...</p>
              ) : snapshots.length === 0 ? (
                <p className="app-text-muted">
                  Todavía no hay snapshots guardados para este colegio.
                </p>
              ) : (
                <div className="snapshots-table">
                  <div className="snapshots-table-header">
                    <span>Fecha</span>
                    <span>Alumnos</span>
                    <span>Grupos</span>
                    <span>Docentes</span>
                    <span>Certificación</span>
                    <span>Riesgo</span>
                    <span style={{ textAlign: "right" }}>Acciones</span>
                  </div>
                  {snapshots.map((s) => {
                    const d =
                      s.generatedAt?.toDate?.() || s.generatedAt || null;
                    const dateLabel = d
                      ? new Date(d).toLocaleString("es-AR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "—";
                    const cert = s.summary?.certification_rate_percent;
                    return (
                      <div
                        key={s.id}
                        className="snapshots-table-row"
                        onClick={() => handleOpenSnapshotView(s)}
                        style={{ cursor: "pointer" }}
                      >
                        <span>{dateLabel}</span>
                        <span>{s.summary?.total_students ?? "—"}</span>
                        <span>{s.summary?.total_student_groups ?? "—"}</span>
                        <span>{s.summary?.total_teachers ?? "—"}</span>
                        <span>
                          {cert === null || cert === undefined
                            ? "—"
                            : `${cert.toFixed(1)}%`}
                        </span>
                        <span className={`risk-chip risk-${s.riskLevel || "medio"}`}>
                          {s.riskLevel === "bajo"
                            ? "A tiempo"
                            : s.riskLevel === "alto"
                            ? "Requiere atención inmediata"
                            : "A reforzar"}
                        </span>
                        <div 
                          className="contacts-actions" 
                          onClick={(e) => e.stopPropagation()}
                        >
                          {confirmDeleteSnapshotId === s.id ? (
                            <div className="inline-confirm">
                              <button
                                type="button"
                                className="link-button danger"
                                onClick={() => handleDeleteSnapshot(s.id)}
                              >
                                Confirmar
                              </button>
                              <button
                                type="button"
                                className="link-button"
                                onClick={() => setConfirmDeleteSnapshotId(null)}
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="link-button danger"
                              onClick={() => setConfirmDeleteSnapshotId(s.id)}
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
        )}
      </Modal>

      {/* NEW MODAL: CONTACT FORM */}
      <Modal
        isOpen={showContactModal}
        title={editingContactId ? "Editar contacto" : "Nuevo contacto"}
        onClose={handleCloseContactModal}
        size="md"
        footer={
          <div className="modal-footer-spread">
            <button
              type="button"
              className="secondary-button"
              onClick={handleCloseContactModal}
              disabled={contactsSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="contact-form"
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
        }
      >
        <form id="contact-form" className="school-form" onSubmit={handleSubmitContact}>
          <div className="contacts-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
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

            <label className="form-label" style={{ gridColumn: '1 / -1' }}>
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

            <div style={{ gridColumn: '1 / -1' }}>
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
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showSnapshotModal && !!selectedSchool}
        title={snapshotMode === "view" ? "Detalle de snapshot" : "Nuevo snapshot desde reporte"}
        onClose={handleCloseSnapshotModal}
        size="lg"
        footer={
          <div className="modal-footer-spread">
            <div />
            <div className="form-actions" style={{ gap: "0.6rem" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={handleCloseSnapshotModal}
                disabled={snapshotSaving || snapshotUploading}
              >
                {snapshotMode === "view" ? "Cerrar" : "Cancelar"}
              </button>
              {snapshotMode === "create" && (
                <button
                  type="button"
                  className="primary-button"
                  onClick={handleSaveSnapshot}
                  disabled={!snapshotData || snapshotSaving}
                >
                  {snapshotSaving ? "Guardando..." : "Guardar snapshot"}
                </button>
              )}
            </div>
          </div>
        }
      >
        <div className="snapshot-layout">
          {snapshotMode === "create" && (
            <section className="snapshot-upload">
              <h4 className="section-title">1. Subir reporte</h4>
              <p className="app-text-muted">
                Seleccioná el archivo exportado de la plataforma (CSV o Excel) y
                lo analizamos con el backend local.
              </p>
              <div className="snapshot-upload-row">
                <input
                  type="file"
                  accept=".csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  onChange={handleSnapshotFileChange}
                />
                <button
                  type="button"
                  className="primary-button"
                  onClick={handleUploadSnapshot}
                  disabled={!snapshotFile || snapshotUploading}
                >
                  {snapshotUploading ? "Analizando..." : "Analizar reporte"}
                </button>
              </div>
              {snapshotError && (
                <p className="snapshot-error">{snapshotError}</p>
              )}
            </section>
          )}

          {snapshotData && (
            <section className="snapshot-preview">
              <h4 className="section-title">2. Vista previa</h4>
              <div className="snapshot-kpi-grid">
                <div className="snapshot-kpi-card">
                  <span className="snapshot-kpi-label">Alumnos</span>
                  <span className="snapshot-kpi-value">
                    {snapshotData.school?.total_students ?? "—"}
                  </span>
                </div>
                <div className="snapshot-kpi-card">
                  <span className="snapshot-kpi-label">Grupos</span>
                  <span className="snapshot-kpi-value">
                    {snapshotData.school?.total_student_groups ?? "—"}
                  </span>
                </div>
                <div className="snapshot-kpi-card">
                  <span className="snapshot-kpi-label">
                    Vitalidad 30d (prom.)
                  </span>
                  <span className="snapshot-kpi-value">
                    {snapshotData.students?.summary
                      ?.digital_vitality_30d_avg != null
                      ? `${snapshotData.students.summary.digital_vitality_30d_avg.toFixed(
                          1
                        )}%`
                      : "—"}
                  </span>
                </div>
                <div className="snapshot-kpi-card">
                  <span className="snapshot-kpi-label">
                    Docentes certificados
                  </span>
                  <span className="snapshot-kpi-value">
                    {snapshotData.teachers_pld?.summary
                      ?.certification_rate_percent != null
                      ? `${snapshotData.teachers_pld.summary.certification_rate_percent.toFixed(
                          1
                        )}%`
                      : "—"}
                  </span>
                </div>
              </div>

              <div className="snapshot-columns">
                <div className="snapshot-column">
                  <h5 className="snapshot-subtitle">Grupos de alumnos</h5>
                  {snapshotData.students?.groups?.length ? (
                    <div className="snapshot-table">
                      <div className="snapshot-table-header">
                        <span>Ruta</span>
                        <span>Alumnos</span>
                        <span>Clases</span>
                        <span>Cursos</span>
                        <span>Vitalidad</span>
                        <span>Semáforo</span>
                      </div>
                      {snapshotData.students.groups.map((g, idx) => (
                        <div key={idx} className="snapshot-table-row">
                          <span>{g.route_name}</span>
                          <span>{g.students_count}</span>
                          <span>
                            {g.metrics?.classes_completion_percent != null
                              ? g.metrics.classes_completion_percent.toFixed(1)
                              : "—"}
                          </span>
                          <span>
                            {g.metrics?.courses_completion_percent != null
                              ? `${g.metrics.courses_completion_percent.toFixed(
                                  1
                                )}%`
                              : "—"}
                          </span>
                          <span>
                            {g.metrics?.digital_vitality_30d_percent != null
                              ? `${g.metrics.digital_vitality_30d_percent.toFixed(
                                  1
                                )}%`
                              : "—"}
                          </span>
                          <span>
                            <div className="status-dots">
                              {["green", "yellow", "red"].map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  className={`status-dot ${color} ${
                                    groupStatuses[g.route_name] === color
                                      ? "selected"
                                      : ""
                                  }`}
                                  onClick={() =>
                                    setGroupStatuses((prev) => ({
                                      ...prev,
                                      [g.route_name]:
                                        prev[g.route_name] === color ? null : color,
                                    }))
                                  }
                                  title=""
                                />
                              ))}
                            </div>
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="app-text-muted">
                      No se encontraron grupos de alumnos en este reporte.
                    </p>
                  )}
                </div>

                <div className="snapshot-column">
                  <h5 className="snapshot-subtitle">Docentes PLD</h5>
                  {snapshotData.teachers_pld?.teachers?.length ? (
                    <div className="snapshot-table">
                      <div className="snapshot-table-header">
                        <span>Docente</span>
                        <span>Certificaciones</span>
                        <span>Completas</span>
                      </div>
                      {snapshotData.teachers_pld.teachers.map((t, idx) => {
                        const total = t.plds?.length || 0;
                        const done = t.plds?.filter((p) => p.certified).length || 0;
                        return (
                          <div key={idx} className="snapshot-table-row">
                            <span>{t.name}</span>
                            <span
                              className={total ? "hint-hover" : ""}
                              title={
                                t.plds && t.plds.length
                                  ? t.plds
                                      .map((p) => p.certification_name)
                                      .join(" • ")
                                  : undefined
                              }
                            >
                              {total}
                            </span>
                            <span
                              className={done ? "hint-hover" : ""}
                              title={
                                done && t.plds
                                  ? t.plds
                                      .filter((p) => p.certified)
                                      .map((p) => p.certification_name)
                                      .join(" • ")
                                  : undefined
                              }
                            >
                              {done}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="app-text-muted">
                      No se encontraron docentes PLD en este reporte.
                    </p>
                  )}
                </div>
              </div>

              <div className="snapshot-notes">
                <h5 className="snapshot-subtitle">3. Comentarios y status del colegio</h5>
                <div className="snapshot-notes-grid">
                  <label className="form-label">
                    Comentarios
                    <textarea
                      className="form-input"
                      rows={3}
                      value={snapshotComments}
                      onChange={(e) => setSnapshotComments(e.target.value)}
                      placeholder="Notas sobre este snapshot, acuerdos, próximos pasos..."
                    />
                  </label>

                  <label className="form-label">
                    Status del colegio
                    <div className="toggle-buttons">
                      {[
                        { key: "bajo", label: "A tiempo" },
                        { key: "medio", label: "A reforzar" },
                        { key: "alto", label: "Requiere atención inmediata" },
                      ].map(({ key, label }) => (
                        <button
                          key={key}
                          type="button"
                          className={`chip-button risk-${key} ${
                            snapshotRisk === key ? "active" : ""
                          }`}
                          onClick={() => setSnapshotRisk(key)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </label>
                </div>
              </div>
            </section>
          )}
        </div>
      </Modal>
    </>
  );
}

export default SchoolsPage;


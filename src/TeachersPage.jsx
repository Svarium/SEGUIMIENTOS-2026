import React, { useEffect, useState, useMemo } from "react";
import { db } from "./firebase";
import {
  collection,
  getDocs,
  collectionGroup,
  query,
  onSnapshot,
} from "firebase/firestore";
import toast from "react-hot-toast";
import Modal from "./Modal";
import { EMAIL_TEMPLATES, openGmailCompose } from "./services/emailTemplates";

const CONTACT_TYPE_COLORS = {
  "Docente": "#22d3ee",
  "Coordinador": "#6366f1",
  "Directivo": "#ec4899",
  "Asesor de Santillana": "#f59e0b",
  "Otros": "#94a3b8",
};

function TeachersPage() {
  const [allContacts, setAllContacts] = useState([]);
  const [schoolsMap, setSchoolsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [showEmailTemplateModal, setShowEmailTemplateModal] = useState(false);
  const [selectedContactForEmail, setSelectedContactForEmail] = useState(null);

  // 1. Cargar mapeo de colegios para saber de dónde viene cada docente
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const schoolsCol = collection(db, "schools");
        const snapshot = await getDocs(schoolsCol);
        const mapping = {};
        snapshot.forEach(doc => {
          mapping[doc.id] = doc.data().name || doc.data().alias || "Colegio sin nombre";
        });
        setSchoolsMap(mapping);
      } catch (error) {
        console.error("Error al cargar colegios:", error);
      }
    };
    fetchSchools();
  }, []);

  // 2. Escuchar todos los contactos (collectionGroup)
  useEffect(() => {
    const contactsQuery = query(collectionGroup(db, "contacts"));
    
    const unsubscribe = onSnapshot(contactsQuery, (snapshot) => {
      const contacts = snapshot.docs.map(doc => {
        // Obtenemos el ID del colegio desde el path: schools/{schoolId}/contacts/{contactId}
        const pathSegments = doc.ref.path.split('/');
        const schoolId = pathSegments[1]; 
        
        return {
          id: doc.id,
          schoolId,
          ...doc.data()
        };
      });
      setAllContacts(contacts);
      setLoading(false);
    }, (error) => {
      console.error("Error al cargar docentes globalmente:", error);
      toast.error("No se pudieron cargar los docentes. Es posible que falte un índice en Firestore.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCopyEmail = (email) => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    toast.success("Email copiado al portapapeles");
  };

  const filteredTeachers = useMemo(() => {
    return allContacts.filter(t => {
      const fullName = `${t.firstName || ""} ${t.lastName || ""}`.toLowerCase();
      const email = (t.email || "").toLowerCase();
      const schoolName = (schoolsMap[t.schoolId] || "").toLowerCase();
      const search = searchTerm.toLowerCase();

      const matchesSearch = !searchTerm || 
        fullName.includes(search) || 
        email.includes(search) || 
        schoolName.includes(search);
      
      const matchesType = !filterType || t.contactType === filterType;

      return matchesSearch && matchesType;
    });
  }, [allContacts, schoolsMap, searchTerm, filterType]);

  return (
    <div className="schools-container">
      <div className="schools-header">
        <div>
          <h2 className="app-title">Buscador de Docentes</h2>
          <p className="app-text">
            Explorá y buscá contactos de todos los colegios del sistema.
          </p>
        </div>
      </div>

      <div className="filters-bar">
        <div className="filter-group" style={{ flex: 1, minWidth: '300px' }}>
          <label className="filter-label">Buscar Docente o Colegio</label>
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="filter-select search-input"
              placeholder="Nombre, email o colegio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div className="filter-group">
          <label className="filter-label">Tipo de Cargo</label>
          <select
            className="filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">👤 Todos los cargos</option>
            <option value="Docente">Docente</option>
            <option value="Coordinador">Coordinador</option>
            <option value="Directivo">Directivo</option>
            <option value="Asesor de Santillana">Asesor de Santillana</option>
            <option value="Otros">Otros</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="chart-placeholder">
          <p>Cargando lista global de docentes...</p>
        </div>
      ) : (
        <div className="contacts-table" style={{ marginTop: '1rem' }}>
          <div className="contacts-table-header" style={{ gridTemplateColumns: '1.2fr 1fr 1fr 1.5fr 1fr 0.5fr' }}>
            <span>Nombre</span>
            <span>Cargo</span>
            <span>Colegio</span>
            <span>Email</span>
            <span>WhatsApp</span>
            <span style={{ textAlign: 'right' }}>Da Clases</span>
          </div>
          
          {filteredTeachers.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
              No se encontraron docentes que coincidan con la búsqueda.
            </div>
          ) : (
            filteredTeachers.map(t => {
              const fullName = `${t.lastName || ""}${t.lastName ? ", " : ""}${t.firstName || ""}`.trim();
              return (
                <div key={t.id} className="contacts-table-row" style={{ gridTemplateColumns: '1.2fr 1fr 1fr 1.5fr 1fr 0.5fr' }}>
                  <span className="contact-text-truncate" title={fullName} style={{ fontWeight: 500 }}>
                    {fullName || "—"}
                  </span>
                  <span>
                    <span style={{ 
                      color: CONTACT_TYPE_COLORS[t.contactType] || '#94a3b8',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.02em'
                    }}>
                      {t.contactType || "—"}
                    </span>
                  </span>
                  <span className="contact-text-truncate" title={schoolsMap[t.schoolId]}>
                    {schoolsMap[t.schoolId] || "Cargando..."}
                  </span>
                  <div className="contact-info-cell">
                    <span className="contact-text-truncate" title={t.email}>{t.email || "—"}</span>
                    {t.email && (
                      <>
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => handleCopyEmail(t.email)}
                          title="Copiar email"
                        >
                          📋
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => {
                            setSelectedContactForEmail(t);
                            setShowEmailTemplateModal(true);
                          }}
                          title="Enviar email (Gmail)"
                          style={{ color: '#ef4444' }}
                        >
                          ✉️
                        </button>
                      </>
                    )}
                  </div>
                  <div className="contact-info-cell">
                    {t.whatsapp ? (
                      <a
                        href={`https://wa.me/${t.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="whatsapp-link"
                        title="Escribir por WhatsApp"
                      >
                        💬 {t.whatsapp}
                      </a>
                    ) : (
                      <span className="app-text-muted">—</span>
                    )}
                  </div>
                  <span style={{ textAlign: 'center' }}>
                    {t.teaches ? "✅" : "❌"}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* EMAIL TEMPLATES MODAL */}
      <Modal
        isOpen={showEmailTemplateModal}
        title="Seleccionar Plantilla de Email"
        onClose={() => setShowEmailTemplateModal(false)}
        footer={
          <button
            type="button"
            className="secondary-button"
            onClick={() => setShowEmailTemplateModal(false)}
          >
            Cerrar
          </button>
        }
      >
        <div className="template-list">
          {EMAIL_TEMPLATES.map((tmpl) => {
            const schoolName = schoolsMap[selectedContactForEmail?.schoolId] || "DH Schools";
            return (
              <button
                key={tmpl.id}
                className="template-item"
                onClick={() => {
                  openGmailCompose(selectedContactForEmail, schoolName, tmpl);
                  setShowEmailTemplateModal(false);
                }}
              >
                <div className="template-item-content">
                  <span className="template-label">{tmpl.label}</span>
                  <span className="template-subject">
                    Asunto: {tmpl.subject.replace("{nombre_colegio}", schoolName)}
                  </span>
                </div>
                <span className="template-arrow">→</span>
              </button>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}

export default TeachersPage;

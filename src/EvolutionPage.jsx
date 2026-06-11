import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { Line } from "react-chartjs-2";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import Modal from "./Modal";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function EvolutionPage() {
  const [schools, setSchools] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedComment, setSelectedComment] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  // Cargar lista de colegios al montar
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const q = query(collection(db, "schools"), orderBy("name"));
        const snap = await getDocs(q);
        const data = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSchools(data);
      } catch (error) {
        console.error("Error cargando colegios para evolución:", error);
      }
    };
    fetchSchools();
  }, []);

  // Cargar snapshots cuando se selecciona un colegio
  useEffect(() => {
    if (!selectedSchoolId) {
      setSnapshots([]);
      return;
    }

    const fetchSnapshots = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "schools", selectedSchoolId, "snapshots"),
          orderBy("generatedAt", "asc") // IMPORTANTE: ASCENDENTE PARA LINEA DE TIEMPO
        );
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setSnapshots(data);
      } catch (error) {
        console.error("Error fetching snapshots:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSnapshots();
  }, [selectedSchoolId]);

  const chartData = useMemo(() => {
    if (!snapshots || snapshots.length === 0) return null;

    const labels = [];
    const vitalityData = [];
    const certificationData = [];
    const mandatoryCoursesData = [];

    snapshots.forEach((s) => {
      // Formatting date
      let dLabel = "—";
      const dt = s.generatedAt?.toDate?.() || s.generatedAt || null;
      if (dt) {
        dLabel = new Date(dt).toLocaleDateString("es-AR", {
          month: "short",
          day: "numeric",
        });
      }
      labels.push(dLabel);

      vitalityData.push(s.summary?.digital_vitality_30d_avg ?? null);
      certificationData.push(s.summary?.certification_rate_percent ?? null);
      mandatoryCoursesData.push(s.summary?.mandatory_courses_full_completion_percent ?? null);
    });

    return {
      labels,
      datasets: [
        {
          label: "Vitalidad Digital (%)",
          data: vitalityData,
          borderColor: "rgba(56, 189, 248, 1)",
          backgroundColor: "rgba(56, 189, 248, 0.2)",
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "rgba(56, 189, 248, 1)",
          pointRadius: 5,
        },
        {
          label: "Tasa de Certif. Docente (%)",
          data: certificationData,
          borderColor: "rgba(167, 139, 250, 1)", // Púrpura
          backgroundColor: "transparent",
          borderDash: [5, 5],
          tension: 0.4,
          pointBackgroundColor: "rgba(167, 139, 250, 1)",
          pointRadius: 4,
        },
        {
          label: "Cursos Obligatorios Completos (%)",
          data: mandatoryCoursesData,
          borderColor: "rgba(250, 204, 21, 1)", // Amarillo/Dorado
          backgroundColor: "transparent",
          borderDash: [2, 2],
          tension: 0.4,
          pointBackgroundColor: "rgba(250, 204, 21, 1)",
          pointRadius: 4,
        },
      ],
    };
  }, [snapshots]);

  // Idea A: Tarjetas KPI de "Resumen Histórico"
  const historyStats = useMemo(() => {
    if (!snapshots || snapshots.length === 0) return null;
    
    let maxVit = -1;
    let maxVitDate = "";
    let minVit = 101;
    let minVitDate = "";

    const vitHistory = [];

    snapshots.forEach((s) => {
      const vit = s.summary?.digital_vitality_30d_avg;
      if (vit != null) {
        vitHistory.push(vit);
        const dtStr = s.generatedAt?.toDate?.() 
                        ? new Date(s.generatedAt.toDate()).toLocaleDateString("es-AR", { month: "short" }) 
                        : "—";

        if (vit > maxVit) {
          maxVit = vit;
          maxVitDate = dtStr;
        }
        if (vit < minVit) {
          minVit = vit;
          minVitDate = dtStr;
        }
      }
    });

    let trendLabel = "Sin datos";
    let trendColor = "#94a3b8";

    if (vitHistory.length >= 2) {
      const first = vitHistory[0];
      const last = vitHistory[vitHistory.length - 1];
      const diff = last - first;
      if (diff > 0) {
        trendLabel = `Crecimiento de +${diff.toFixed(1)}% desde inicio`;
        trendColor = "#22c55e"; // verde
      } else if (diff < 0) {
        trendLabel = `Caída de ${diff.toFixed(1)}% desde inicio`;
        trendColor = "#ef4444"; // rojo
      } else {
        trendLabel = `Se mantiene estable vs inicio`;
      }
    } else if (vitHistory.length === 1) {
       trendLabel = "Primer registro (sin tendencia)";
    }

    return {
      maxVit: maxVit !== -1 ? maxVit.toFixed(1) : "—",
      maxVitDate,
      minVit: minVit !== 101 ? minVit.toFixed(1) : "—",
      minVitDate,
      trendLabel,
      trendColor,
    };
  }, [snapshots]);

  // Idea C: Exportar a PDF
  const handleExportPDF = async () => {
    const reportElement = document.getElementById("evolution-report-container");
    if (!reportElement) return;

    try {
      setIsExporting(true);

      // Truco: Para que html2canvas pinte bien el feed que tiene overflow-y: auto,
      // necesitamos quitarle el max-height temporalmente y dejar que crezca.
      const historyCol = document.getElementById("evolution-history-col");
      let originalMaxHeight = "";
      if (historyCol) {
        originalMaxHeight = historyCol.style.maxHeight;
        historyCol.style.maxHeight = "none";
        historyCol.style.overflowY = "visible";
      }

      const canvas = await html2canvas(reportElement, {
        scale: 2, // Mejor calidad
        useCORS: true,
        backgroundColor: "#050816" // Fondo oscuro de la app
      });

      // Restauramos el estilo
      if (historyCol) {
        historyCol.style.maxHeight = originalMaxHeight;
        historyCol.style.overflowY = "auto";
      }

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      
      const selectedSchoolName = schools.find(s => s.id === selectedSchoolId)?.name || "colegio";
      pdf.save(`Evolucion_${selectedSchoolName.replace(/\s+/g, '_')}.pdf`);

    } catch (error) {
      console.error("Error al exportar PDF:", error);
      alert("Hubo un error al generar el PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: { color: "#94a3b8", usePointStyle: true },
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        grid: { color: "rgba(148, 163, 184, 0.1)" },
        ticks: { color: "#94a3b8" },
      },
      x: {
        grid: { display: false },
        ticks: { color: "#94a3b8" },
      },
    },
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case "bajo":
        return "#22c55e"; // verde
      case "medio":
        return "#eab308"; // amarillo
      case "alto":
        return "#ef4444"; // rojo
      default:
        return "#64748b"; // gris
    }
  };

  const getRiskLabel = (risk) => {
    switch (risk) {
      case "bajo":
        return "A tiempo";
      case "medio":
        return "A reforzar";
      case "alto":
        return "Atención inmediata";
      default:
        return "Sin definir";
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div className="schools-header" style={{ marginBottom: "2rem" }}>
        <div>
          <h2 className="app-title">Línea de Vida Escolar</h2>
          <p className="app-text">
            Analizá la evolución temporal de los indicadores clave y la historia
            de cada colegio registrada en los reportes.
          </p>
        </div>
      </div>

      {/* SELECTOR */}
      <div className="evolution-selector-container">
        <label className="form-label">
          Seleccioná un Colegio para analizar:
          <select
            className="form-input"
            value={selectedSchoolId}
            onChange={(e) => setSelectedSchoolId(e.target.value)}
          >
            <option value="">-- Ningún colegio seleccionado --</option>
            {schools.map((sch) => (
              <option key={sch.id} value={sch.id}>
                {sch.name} {sch.system ? `(${sch.system})` : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* ESTADO CERO */}
      {!selectedSchoolId && (
        <div className="chart-placeholder" style={{ marginTop: "2rem" }}>
          <span>Por favor, seleccioná un colegio arriba.</span>
          <span className="placeholder-sub">
            Se cargarán todos los snapshots ordenados cronológicamente.
          </span>
        </div>
      )}

      {/* ESTADO CARGANDO */}
      {selectedSchoolId && loading && (
        <p className="app-text-muted" style={{ marginTop: "2rem" }}>
          Cargando evolución histórica...
        </p>
      )}

      {/* SIN DATOS */}
      {selectedSchoolId && !loading && snapshots.length === 0 && (
        <div className="chart-placeholder" style={{ marginTop: "2rem" }}>
          <span>Este colegio aún no tiene snapshots cargados.</span>
          <span className="placeholder-sub">
            Dirigite al listado de colegios para generar el primero.
          </span>
        </div>
      )}

      {/* VISTA PRINCIPAL (DATOS CARGADOS) */}
      {selectedSchoolId && !loading && snapshots.length > 0 && chartData && (
        <div id="evolution-report-container" style={{ padding: "0.5rem" }}>
          
          {/* HEADER SECCIÓN EXPORTAR */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h3 className="app-subtitle" style={{ margin: 0 }}>Análisis Histórico</h3>
            <button 
              className="primary-button" 
              onClick={handleExportPDF}
              disabled={isExporting}
            >
              {isExporting ? "Generando PDF..." : "📄 Exportar a PDF"}
            </button>
          </div>

          {/* IDEA A: TARJETAS KPI HISTORICAS */}
          {historyStats && (
            <div className="dashboard-kpi-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: "1.5rem" }}>
              <div className="dashboard-kpi-card">
                <span className="dashboard-kpi-title">Mayor Vitalidad (Pico)</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span className="dashboard-kpi-value" style={{ color: "#22c55e" }}>
                    {historyStats.maxVit !== "—" ? `${historyStats.maxVit}%` : "—"}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>en {historyStats.maxVitDate}</span>
                </div>
              </div>
              <div className="dashboard-kpi-card">
                <span className="dashboard-kpi-title">Menor Vitalidad (Valle)</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span className="dashboard-kpi-value" style={{ color: "#ef4444" }}>
                    {historyStats.minVit !== "—" ? `${historyStats.minVit}%` : "—"}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>en {historyStats.minVitDate}</span>
                </div>
              </div>
              <div className="dashboard-kpi-card">
                <span className="dashboard-kpi-title">Tendencia del Año</span>
                <span className="dashboard-kpi-value" style={{ fontSize: "1.2rem", color: historyStats.trendColor, marginTop: "0.25rem" }}>
                  {historyStats.trendLabel}
                </span>
              </div>
            </div>
          )}

          <div className="evolution-grid">
            {/* COLUMNA IZQUIERDA: GRÁFICOS */}
            <div className="evolution-charts-col">
              <div className="dashboard-chart-card">
                <h4 className="dashboard-chart-title">Tendencia de Indicadores</h4>
                <div className="chart-wrapper" style={{ height: "300px" }}>
                  <Line data={chartData} options={lineOptions} />
                </div>
              </div>

              <div className="dashboard-chart-card">
                <h4 className="dashboard-chart-title">Semáforo de Status</h4>
                <div className="evolution-status-timeline">
                  {snapshots.map((s, idx) => {
                    let dLabel = "—";
                    const dt = s.generatedAt?.toDate?.() || s.generatedAt || null;
                    if (dt) dLabel = new Date(dt).toLocaleDateString("es-AR", { month: "short", day: "numeric" });
                    return (
                      <div key={s.id} className="status-timeline-item">
                        <div className="status-timeline-date">{dLabel}</div>
                        <div
                          className="status-timeline-block"
                          style={{ backgroundColor: getRiskColor(s.riskLevel) }}
                          title={getRiskLabel(s.riskLevel)}
                        ></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* COLUMNA DERECHA: HITOS */}
            <div className="evolution-history-col dashboard-chart-card" id="evolution-history-col">
              <h4 className="dashboard-chart-title">Historia Clínica / Hitos</h4>
              <div className="evolution-feed">
                {snapshots.map((s, idx) => {
                  let dLabel = "—";
                  const dt = s.generatedAt?.toDate?.() || s.generatedAt || null;
                  if (dt) dLabel = new Date(dt).toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" });
                  
                  // TRUNCADO DE COMENTARIO
                  const fullComment = s.comments || "";
                  const isLong = fullComment.length > 100;
                  const displayComment = isLong ? fullComment.substring(0, 100) + "..." : fullComment;

                  return (
                    <div key={s.id} className="feed-item">
                      <div className="feed-item-header">
                        <div 
                          className="feed-dot" 
                          style={{ backgroundColor: getRiskColor(s.riskLevel) }}
                        ></div>
                        <span className="feed-date">{dLabel}</span>
                      </div>
                      <div className="feed-content">
                        <p className="feed-metrics">
                          Vit: <strong>{s.summary?.digital_vitality_30d_avg?.toFixed(1) || "—"}%</strong> · 
                          Cert: <strong>{s.summary?.certification_rate_percent?.toFixed(1) || "—"}%</strong> · 
                          Cursos Oblig: <strong>{s.summary?.mandatory_courses_full_completion_percent?.toFixed(1) || "—"}%</strong>
                        </p>
                        {fullComment ? (
                           <div className="feed-comment">
                             "{displayComment}"
                             {isLong && (
                                <button 
                                  className="link-button" 
                                  style={{ marginLeft: "5px", fontSize: "0.8rem", padding: 0 }}
                                  onClick={() => setSelectedComment(s)}
                                >
                                  Ver más
                                </button>
                             )}
                           </div>
                        ) : (
                           <div className="feed-comment empty">Sin observaciones registradas en este reporte.</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA VER COMENTARIO COMPLETO */}
      <Modal
        isOpen={!!selectedComment}
        onClose={() => setSelectedComment(null)}
        title={`Reporte del ${
          selectedComment 
          ? new Date(selectedComment.generatedAt?.toDate?.() || selectedComment.generatedAt).toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" })
          : ""
        }`}
        size="md"
        footer={
          <div className="form-actions" style={{ justifyContent: 'flex-end', width: '100%' }}>
             <button type="button" className="secondary-button" onClick={() => setSelectedComment(null)}>
                Cerrar
             </button>
          </div>
        }
      >
        {selectedComment && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
               <span className="chip-button" style={{ backgroundColor: getRiskColor(selectedComment.riskLevel), color: "#fff", borderColor: "transparent" }}>
                 Status: {getRiskLabel(selectedComment.riskLevel)}
               </span>
               <span className="chip-button active">
                 Vitalidad: {selectedComment.summary?.digital_vitality_30d_avg?.toFixed(1) || "—"}%
               </span>
            </div>
            <div style={{
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(148, 163, 184, 0.2)'
            }}>
              <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", color: "#e2e8f0" }}>Observaciones del Informe</h4>
              <p style={{ margin: 0, color: "#cbd5e1", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                 {selectedComment.comments}
              </p>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
export default EvolutionPage;

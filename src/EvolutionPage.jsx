import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { Line } from "react-chartjs-2";
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
      ],
    };
  }, [snapshots]);

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
          <div className="evolution-history-col dashboard-chart-card">
            <h4 className="dashboard-chart-title">Historia Clínica / Hitos</h4>
            <div className="evolution-feed">
              {snapshots.map((s, idx) => {
                let dLabel = "—";
                const dt = s.generatedAt?.toDate?.() || s.generatedAt || null;
                if (dt) dLabel = new Date(dt).toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" });
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
                        Cert: <strong>{s.summary?.certification_rate_percent?.toFixed(1) || "—"}%</strong>
                      </p>
                      {s.comments ? (
                         <div className="feed-comment">"{s.comments}"</div>
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
      )}
    </div>
  );
}

export default EvolutionPage;

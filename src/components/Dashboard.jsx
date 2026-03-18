import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import Modal from '../Modal';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

ChartJS.defaults.color = '#9ca3af';
ChartJS.defaults.font.family = "'Roboto', system-ui, -apple-system, sans-serif";

function Dashboard({ schools }) {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalTitle, setModalTitle] = React.useState('');
  const [filteredSchools, setFilteredSchools] = React.useState([]);
  const [studentModalOpen, setStudentModalOpen] = React.useState(false);

  const stats = useMemo(() => {
    let total = schools.length;
    let santillana = 0;
    let argNativa = 0;

    let vitalityBaja = [];
    let vitalityMedia = [];
    let vitalityOptima = [];

    let statusBa = []; // Bajo (A tiempo)
    let statusMe = []; // Medio (A reforzar)
    let statusAl = []; // Alto (Atención inmediata)

    const countryCounts = {};

    const studentData = schools
      .filter(s => s.lastSnapshotSummary?.total_students != null)
      .map(s => ({
        name: s.name,
        students: s.lastSnapshotSummary.total_students,
      }))
      .sort((a, b) => b.students - a.students);

    schools.forEach((school) => {
      // 1. Conteo por sistema
      if (school.system === "Santillana") santillana++;
      if (school.system === "Argentina Nativa") argNativa++;

      // 2. Conteo por país
      const c = school.country || "Sin país";
      countryCounts[c] = (countryCounts[c] || 0) + 1;

      // 3. Vitalidad Digital (del último snapshot)
      if (school.lastSnapshotSummary?.digital_vitality_30d_avg != null) {
        const vitality = school.lastSnapshotSummary.digital_vitality_30d_avg;
        if (vitality <= 50) vitalityBaja.push(school);
        else if (vitality <= 75) vitalityMedia.push(school);
        else vitalityOptima.push(school);
      }

      // 4. Status del colegio (Riesgo del último snapshot)
      if (school.lastSnapshotRisk) {
        if (school.lastSnapshotRisk === "bajo") statusBa.push(school);
        else if (school.lastSnapshotRisk === "medio") statusMe.push(school);
        else if (school.lastSnapshotRisk === "alto") statusAl.push(school);
      }
    });

    // Preparar colores
    const darkBgBase = 'rgba(15, 23, 42, 0.9)';
    const gridColor = 'rgba(148, 163, 184, 0.1)';

    // Dataset arrays
    const vitalityDataArray = [vitalityBaja.length, vitalityMedia.length, vitalityOptima.length];
    const statusDataArray = [statusBa.length, statusMe.length, statusAl.length];

    return {
      total,
      santillana,
      argNativa,
      
      // Arrays of schools for click handlers
      vitalityLists: [vitalityBaja, vitalityMedia, vitalityOptima],
      statusLists: [statusBa, statusMe, statusAl],

      pieData: {
        labels: ['Riesgo / Baja (0-50%)', 'Media (51-75%)', 'Óptima (76-100%)'],
        datasets: [
          {
            data: vitalityDataArray,
            backgroundColor: [
              'rgba(239, 68, 68, 0.8)', // Rojo
              'rgba(234, 179, 8, 0.8)',  // Amarillo
              'rgba(34, 197, 94, 0.8)',  // Verde
            ],
            borderColor: darkBgBase,
            borderWidth: 2,
          },
        ],
      },
      hasVitalityData: vitalityDataArray.some(val => val > 0),

      statusData: {
        labels: ['A tiempo (Verde)', 'A reforzar (Amarillo)', 'Atención inmediata (Rojo)'],
        datasets: [
          {
            data: statusDataArray,
            backgroundColor: [
              'rgba(34, 197, 94, 0.8)',  // Verde
              'rgba(234, 179, 8, 0.8)',  // Amarillo
              'rgba(239, 68, 68, 0.8)', // Rojo
            ],
            borderColor: darkBgBase,
            borderWidth: 2,
          },
        ],
      },
      hasStatusData: statusDataArray.some(val => val > 0),

      barData: {
        labels: Object.keys(countryCounts),
        datasets: [
          {
            label: 'Colegios por País',
            data: Object.values(countryCounts),
            backgroundColor: 'rgba(56, 189, 248, 0.7)',
            borderColor: 'rgba(56, 189, 248, 1)',
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      
      studentChartData: {
        labels: studentData.map(s => s.name),
        datasets: [
          {
            label: 'Alumnos por Colegio',
            data: studentData.map(s => s.students),
            backgroundColor: 'rgba(167, 139, 250, 0.7)', // Púrpura
            borderColor: 'rgba(167, 139, 250, 1)',
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      hasStudentData: studentData.length > 0,

      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 20, usePointStyle: true, pointStyle: 'circle' }
          }
        }
      },
      barOptions: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { grid: { color: gridColor }, ticks: { stepSize: 1 } },
          y: { grid: { display: false } }
        }
      },
      studentChartOptions: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { grid: { color: gridColor }, title: { display: true, text: 'Cantidad de Alumnos', color: '#9ca3af' } },
          y: { grid: { display: false } }
        }
      }
    };
  }, [schools]);

  const handleVitalityClick = (event, elements) => {
    if (elements && elements.length > 0) {
      const index = elements[0].index;
      const label = stats.pieData.labels[index];
      const schoolList = stats.vitalityLists[index];
      
      setModalTitle(`Colegios: ${label}`);
      setFilteredSchools(schoolList);
      setModalOpen(true);
    }
  };

  const handleStatusClick = (event, elements) => {
    if (elements && elements.length > 0) {
      const index = elements[0].index;
      const label = stats.statusData.labels[index];
      const schoolList = stats.statusLists[index];
      
      setModalTitle(`Colegios: ${label}`);
      setFilteredSchools(schoolList);
      setModalOpen(true);
    }
  };

  if (schools.length === 0) return null;

  return (
    <div className="dashboard-container">
      <div className="dashboard-kpi-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="dashboard-kpi-card">
          <span className="dashboard-kpi-title">Total Colegios</span>
          <span className="dashboard-kpi-value">{stats.total}</span>
        </div>
        <div className="dashboard-kpi-card" style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
          <div>
            <span className="dashboard-kpi-title">Santillana</span>
            <div className="dashboard-kpi-value">{stats.santillana}</div>
          </div>
          <div style={{ width: '1px', backgroundColor: 'rgba(148,163,184,0.3)', height: '100%' }}></div>
          <div>
            <span className="dashboard-kpi-title">Arg. Nativa</span>
            <div className="dashboard-kpi-value">{stats.argNativa}</div>
          </div>
        </div>
        <div 
          className="dashboard-kpi-card clickable-kpi" 
          onClick={() => setStudentModalOpen(true)}
          style={{ border: '1px solid rgba(167, 139, 250, 0.3)' }}
        >
          <span className="dashboard-kpi-title">Distribución de Alumnos</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '0.25rem' }}>
             <span className="dashboard-kpi-value" style={{ fontSize: '1.2rem', color: '#a78bfa' }}>Ver Gráfico</span>
             <span style={{ fontSize: '1.5rem' }}>📊</span>
          </div>
        </div>
      </div>

      <div className="dashboard-charts-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="dashboard-chart-card">
          <h4 className="dashboard-chart-title">Vitalidad Digital</h4>
          {stats.hasVitalityData ? (
            <div className="chart-wrapper" style={{ cursor: 'pointer' }}>
              <Pie 
                data={stats.pieData} 
                options={{
                  ...stats.chartOptions,
                  onClick: handleVitalityClick,
                  onHover: (event, chartElement) => {
                    event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
                  }
                }} 
              />
            </div>
          ) : (
            <div className="chart-placeholder">
              <span>No hay datos de vitalidad digital todavía.</span>
              <span className="placeholder-sub">Creá snapshots para los colegios para poblar este gráfico.</span>
            </div>
          )}
        </div>

        <div className="dashboard-chart-card">
          <h4 className="dashboard-chart-title">Status (Semáforo)</h4>
          {stats.hasStatusData ? (
            <div className="chart-wrapper" style={{ cursor: 'pointer' }}>
              <Pie 
                data={stats.statusData} 
                options={{
                  ...stats.chartOptions,
                  onClick: handleStatusClick,
                  onHover: (event, chartElement) => {
                    event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
                  }
                }} 
              />
            </div>
          ) : (
            <div className="chart-placeholder">
              <span>No hay status calculado todavía.</span>
              <span className="placeholder-sub">Generá snapshots para poblar el gráfico.</span>
            </div>
          )}
        </div>

        <div className="dashboard-chart-card">
          <h4 className="dashboard-chart-title">Distribución por País</h4>
          <div className="chart-wrapper">
            <Bar data={stats.barData} options={stats.barOptions} />
          </div>
        </div>
      </div>

      {/* MODAL PARA LISTAR COLEGIOS FILTRADOS */}
      <Modal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={modalTitle}
        size="md"
        footer={
          <div className="form-actions" style={{ justifyContent: 'flex-end', width: '100%' }}>
             <button type="button" className="secondary-button" onClick={() => setModalOpen(false)}>
                Cerrar
             </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredSchools.length === 0 ? (
            <p className="app-text-muted">No se encontraron colegios en este rango.</p>
          ) : (
            filteredSchools.map((school) => (
              <div key={school.id} style={{
                padding: '1rem',
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '0.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{school.name}</span>
                <span className="chip-button active">{school.system || '—'}</span>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* MODAL PARA GRÁFICO DE ALUMNOS */}
      <Modal
        isOpen={studentModalOpen}
        onClose={() => setStudentModalOpen(false)}
        title="Distribución de Alumnos por Colegio"
        size="lg"
        footer={
          <div className="form-actions" style={{ justifyContent: 'flex-end', width: '100%' }}>
             <button type="button" className="secondary-button" onClick={() => setStudentModalOpen(false)}>
                Cerrar
             </button>
          </div>
        }
      >
        <div style={{ height: '70vh', minHeight: '400px', padding: '1rem' }}>
          {stats.hasStudentData ? (
            <Bar 
              data={stats.studentChartData} 
              options={{
                ...stats.studentChartOptions,
                plugins: {
                  ...stats.studentChartOptions.plugins,
                  tooltip: {
                    callbacks: {
                      label: (context) => `Alumnos: ${context.raw}`
                    }
                  }
                }
              }} 
            />
          ) : (
            <div className="chart-placeholder">
              <span>No hay datos de alumnos suficientes para generar la comparativa.</span>
              <span className="placeholder-sub">Asegurate de que los colegios tengan al menos un snapshot guardado.</span>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default Dashboard;

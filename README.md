# Seguimientos DH-Schools 👩‍💻 — Frontend (React + Vite)

Aplicación web en React, construida como una **Single Page Application (SPA)**, pensada para que un mentor pueda hacer un seguimiento pedagógico y gerencial detallado de colegios a lo largo del año académico.

La plataforma se integra con:
- Un **backend en FastAPI** que analiza reportes masivos de plataformas educativas y devuelve JSON estructurados.
- **Firestore (Firebase)** para persistir jerárquicamente colegios, contactos y el historial de "snapshots" (fotos del estado del colegio en un momento dado).
- **Firebase Auth (Google)** para restringir el acceso únicamente a personal autorizado.

Todo el UI está construido en un elegante **modo oscuro (Dark Mode)**, utilizando CSS puro, tipografías del sistema (`Roboto`), gráficos interactivos y modales limpios para una experiencia de usuario gerente ('delicada' y rápida).

---

## 🏗 Estructura General del Proyecto

- `vite.config.js`: Configuración de Vite con React.
- `index.html`: Base de la SPA.
- `package.json`: Dependencias principales (`react`, `react-router-dom`, `firebase`, `chart.js`, `html2canvas`, `jspdf`, `react-hot-toast`).

### 📂 Carpeta `src/` (Componentes Clave)

- `main.jsx`: Punto de entrada que inyecta React y las notificaciones flotantes (`Toaster`).
- `App.jsx`: Configura el enrutador (`react-router-dom`) manejando las rutas `/schools` y `/evolution` bajo el paraguas de autenticación.
- `AuthGate.jsx`: Escucha la sesión del usuario. Si no hay sesión, muestra el login de Google. Si la hay, renderiza el **Ménu de Navegación Global (NavLinks)** y el contenido protegido.
- `App.css` y `index.css`: Archivos de estilo que controlan el modo oscuro, grillas corporativas, tarjetas y modales.

---

## 📊 Vistas y Funcionalidades Principales

La aplicación se divide en dos grandes "Pestañas" o Vistas principales accesibles desde el menú superior:

### 1. Pestaña: Colegios (`SchoolsPage.jsx` y `Dashboard.jsx`)
Es el panel de control principal (Home).

**Dashboard Gerencial Superior:**
Una vez cargados los colegios, la parte superior renderiza gráficos generados con `Chart.js`:
- **Tarjetas KPI:** Total de colegios y distribución por "Sistema" (Santillana, Argentina Nativa, etc.).
- **Torta de Vitalidad Digital:** Lee el último reporte (*snapshot*) de cada colegio y los agrupa en: *Óptima (Verde), Media (Amarillo) y Riesgo/Baja (Rojo)*.
- **Torta de Status (Semáforo):** Gráfico que representa el nivel de riesgo general (*A tiempo, A reforzar, Requiere atención inmediata*).
- **Interactividad Dinámica:** Al hacer **clic sobre cualquier porción de color** en los gráficos, se abre instantáneamente un modal listando qué colegios exactos conforman ese grupo.
- **Gráfico de Barras:** Distribución de colegios por país de residencia.

**Gestión de Colegios (Grid):**
- Debajo del Dashboard, se listan todos los colegios en forma de tarjetas (Cards).
- El borde de cada tarjeta cambia de color (Verde, Amarillo, Rojo) basándose en el status del **último snapshot** subido.
- Se pueden registrar, editar y **eliminar en cascada** (borrar un colegio elimina también sus contactos y reportes históricos para no dejar datos huérfanos).

### 2. Pestaña: Tendencias / Evolución Histórica (`EvolutionPage.jsx`)
Vista diseñada para aislar a **un colegio en particular** y analizar su desempeño mes a mes.

- **Selector Principal:** Desplegable para seleccionar el colegio a auditar.
- **KPIs Históricos:** Calcula en tiempo real, basándose en la base de datos cronológica: *Mayor vitalidad del año, Menor vitalidad del año, y Tendencia matemática (creció vs cayó).*
- **Gráfico de Área Continua:** Cruza en el tiempo la métrica de **Vitalidad Digital** (curva principal) vs la **Certificación Docente** (línea punteada) para entender si la capacitación impactó en el uso.
- **Línea de Vida de Status:** Una tira de bloques de colores (semáforos) que resume visualmente la racha de rendimiento del colegio en el año.
- **Historia Clínica / Hitos:** Un *feed* vertical similar a una red social que lista la fecha de cada snapshot y la **observación manual** dejada por el mentor.
  - *Truncado Inteligente:* Si un mentor dejó un comentario larguísimo, el sistema lo corta a 100 caracteres e introduce un botón **"Ver más"**. Al hacer clic, se abre un modal de lectura placentera con todos los detalles.
- **Exportación a PDF:** Usando `html2canvas` y `jsPDF`, esta vista incluye un botón para renderizar toda la pantalla de análisis en un archivo PDF listo para enviar por correo a los directivos.

---

## 📝 Gestión de Snapshots (Reportes)

Los *Snapshots* son el corazón analítico. Representan el estado de un colegio luego de pedir un informe en las plataformas educativas.
Se guardan en Firestore dentro de la subcolección `schools/{schoolId}/snapshots`.

**Flujo de Análisis de un Snapshot Nuevo:**
1. Clic en el colegio -> "Nuevo Snapshot".
2. Seleccionar el `.csv` / `.xlsx` del colegio.
3. Se envía al Backend (`FastAPI`) para parseo complejo de alumnos y docentes.
4. El frontend recibe el JSON y despliega una **Vista Previa Editable**, separada en dos columnas:
   * **Grupos de Alumnos:** Donde el mentor puede analizar métricas duras y asignar un semáforo interactivo por cada aula.
   * **Docentes PLD:** Donde, interactuando con tooltips, se ve quién se certificó y en qué cursos.
5. El mentor redacta una conclusión escrita y le asigna un **Nivel de Status** global al colegio (Verde/Amarillo/Rojo).
6. Al "Guardar", se empaqueta todo el JSON y se envía a Firebase. Simultáneamente, el colegio padre actualiza su `lastSnapshotRisk` para alimentar instantáneamente el Dashboard Principal y acelerar los tiempos de carga.

**Eliminación de Snapshots:**
Se pueden eliminar individualmente desde el listado del colegio con una confirmación propia por seguridad.

---

## 👥 Modal de Contactos

Alojado en `schools/{schoolId}/contacts`. Permite llevar una agenda de contactos directos (Rectores, coordinadores, docentes) con:
- Formularios Modales desvinculados para que no "estorben" en la vista principal del colegio.
- Roles dinámicos y números de WhatsApp a mano.

---

## 🚀 Cómo ejecutar el proyecto para Desarrollo

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar Variables de Entorno:**
   - Creá un archivo `.env` en la raíz (se ha creado uno por defecto).
   - Definí `VITE_API_BASE_URL=https://automatic-report-backend.onrender.com`.
   - Si necesitás volver al backend local, podés cambiarlo a `http://127.0.0.1:8000`.

3. **Configurar Firebase:**
   - Crear un proyecto en Firebase (Database + Auth).
   - Crear un archivo `.env` o sobreescribir las settings en `src/firebase.js`.

3. **Backend:**
   - Ejecutar la instancia paralela de FastAPI (generalmente en `http://localhost:8000`).

4. **Ejecutar Frontend (Local):**
   ```bash
   npm run dev
   ```

5. **Acceso:** Abrir `http://localhost:5173`. Iniciar sesión con una cuenta de Google cuyo dominio esté autorizado (Ej: `@digitalhouse.com`) en las reglas de seguridad de Firestore. 

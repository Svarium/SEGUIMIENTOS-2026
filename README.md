
## App Seguimientos 2026 — Frontend (React + Vite)

Aplicación web en React pensada para que un mentor pueda hacer seguimiento pedagógico de colegios a lo largo del año, integrándose con:

- Un backend en FastAPI que analiza reportes de plataformas educativas y devuelve JSON estructurado.
- Firestore (Firebase) para persistir colegios, contactos y snapshots.
- Firebase Auth (Google) para restringir acceso.

Todo el UI está construido en **modo oscuro**, con CSS puro y tipografía estilo sistema/Roboto.

---

## Estructura general del proyecto

Raíz del proyecto:

- `vite.config.js`  
  Configuración de Vite con React y el nuevo compilador de React.

- `index.html`  
  HTML base donde se monta la app (`<div id="root">`).

- `package.json`  
  Dependencias principales:
  - `react`, `react-dom`
  - `firebase`
  - `react-hot-toast`
  - Vite + plugin React

- `README.md`  
  Este archivo: documentación funcional y técnica del frontend.

### Carpeta `src/`

Contiene todo el código de la app.

- `main.jsx`  
  Punto de entrada. Hace:
  - Import de estilos globales `index.css`.
  - Renderiza `<App />` envuelto en `StrictMode`.
  - Monta `<Toaster />` de `react-hot-toast` con estilos oscuros para notificaciones flotantes.

- `App.jsx`  
  Componente raíz:
  - Envuelve todo en `AuthGate` (requiere login con Google).
  - Dentro de `AuthGate`, renderiza el layout principal (`app-background`, `app-panel`) y la página de colegios (`<SchoolsPage />`).

- `index.css`  
  Estilos globales:
  - Resetea márgenes del `body`, configura fuente base y colores de fondo.
  - Elimina el “marco” central del template de Vite para que la app use **todo el ancho** de la ventana.

- `App.css`  
  Estilos del layout y componentes “de dominio”:
  - `app-background`, `app-panel`: fondo degradado oscuro y panel central.
  - Cards de colegios (`school-card`).
  - Formularios (`form-row`, `form-label`, `form-input`).
  - Botones primarios/ secundarios (`primary-button`, `secondary-button`, `danger-button`).
  - Modales (`modal-backdrop`, `modal-shell`, variantes `modal-sm`, `modal-md`, `modal-lg`).
  - Tablas de colegios, contactos, snapshots y vista previa de snapshot.
  - Estilos específicos para chips de riesgo, “semáforos” de grupos, etc.

---

## Autenticación y Firebase

- `firebase.js`  
  - Inicializa Firebase con la configuración del proyecto.
  - Exporta:
    - `auth`, `googleProvider`, `signInWithPopup`, `signOut`, `onAuthStateChanged`.
    - `db` (Firestore).
    - `analytics` (si el entorno lo soporta).

- `AuthGate.jsx`  
  - Escucha el estado de autenticación (`onAuthStateChanged`).
  - Si **no hay usuario**:
    - Muestra un modal centrado “App Seguimientos 2026” con botón “Ingresar con Google”.
  - Si **hay usuario**:
    - Muestra:
      - Header fijo con nombre de la app y email actual + botón “Cerrar sesión”.
      - Un `<main>` donde se renderiza el contenido de la app (`children`).

Reglas recomendadas de Firestore (ejemplo usado):

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Solo usuarios autenticados cuyo email termina en @digitalhouse.com
    match /{document=**} {
      allow read, write: if
        request.auth != null
        && request.auth.token.email != null
        && request.auth.token.email.matches('.*@digitalhouse\\.com');
    }
  }
}
```

---

## Página principal: colegios (`SchoolsPage.jsx`)

Responsable de todo el flujo principal: colegios, contactos y snapshots.

### Colección `schools` (colegios)

En Firestore, cada colegio se guarda en la colección `schools` con campos:

- `name`: nombre del colegio.
- `alias`: alias corto (ej: “GCC”).
- `country`: país (selector entre Argentina, Brasil, Colombia, México, Uruguay, Chile, Honduras, Guatemala, El Salvador).
- `system`: sistema (ej: “Argentina Nativa”, “Santillana”, “Otro”).
- `createdAt`: `serverTimestamp()`.
- `lastSnapshotRisk`: nivel de status del colegio según el último snapshot (`"bajo" | "medio" | "alto"`).
- `lastSnapshotAt`: fecha/hora del último snapshot guardado.

#### UI en Home

La parte superior de `SchoolsPage` muestra:

- Título “Colegios” y una breve descripción.
- Botón **“Agregar colegio”** → abre un modal para crear un nuevo colegio.

Debajo, un grid de cards:

- Cada card (`school-card`) muestra:
  - Nombre, alias, país, sistema.
  - Texto: “Click para ver detalles, editar o eliminar.”
- El borde de la card toma un tinte según `lastSnapshotRisk`:
  - `school-card-bajo` → borde verde suave (colegio “A tiempo”).
  - `school-card-medio` → borde amarillo suave (“A reforzar”).
  - `school-card-alto` → borde rojo suave (“Requiere atención inmediata”).
- Click en la card → abre el **modal de detalle del colegio**.

### Modal “Nuevo colegio”

Campos:

- Nombre del colegio (obligatorio).
- Alias.
- País (selector con países permitidos).
- Sistema (selector con opciones predefinidas).

Al enviar:

- Crea el documento en `schools`.
- Cierra el modal y muestra un toast de éxito.

---

## Detalle de colegio (modal principal)

Al hacer click en un colegio se abre un modal grande (`modal-lg`) con:

1. **Datos básicos del colegio** (Nombre, Alias, País, Sistema).
2. **Snapshots del reporte** (historial de análisis).
3. **Docentes y contactos** (personas clave del colegio).

### 1. Snapshots del reporte

Subcolección: `schools/{schoolId}/snapshots`

Cada snapshot se guarda con:

- `generatedAt`: fecha/hora proveniente del backend (`metadata.generated_at`) o `new Date()` si no viene.
- `status`: `"bajo" | "medio" | "alto"` (se traduce a etiquetas “A tiempo”, “A reforzar”, “Requiere atención inmediata”).
- `comments`: texto libre del mentor.
- `backendPayload`: **respuesta completa** del backend FastAPI (JSON anidado: `metadata`, `students`, `teachers_pld`, etc.).

En la UI dentro del modal del colegio:

- Se listan todos los snapshots en orden cronológico (más recientes primero).
- Cada fila muestra:
  - Fecha formateada.
  - Status del colegio.
  - Botón para **eliminar** snapshot (con confirmación custom).
- **Click en una fila** → abre el **modal de visualización de snapshot** en modo solo lectura.

Además, hay un botón **“Nuevo snapshot”** para iniciar el flujo de análisis.

### Flujo: crear un snapshot

1. Desde el modal del colegio, clic en **“Nuevo snapshot”**.
2. Se abre un **modal de snapshot** aún más grande (`modal-lg`, casi pantalla completa).
3. Pasos dentro del modal:
   - Subir archivo de reporte (CSV/Excel) con un `<input type="file">`.
   - Enviar el archivo al backend FastAPI con `fetch` y `FormData`.
   - Esperar la respuesta JSON.
   - Renderizar una **vista previa editable** con:
     - Comentarios del mentor.
     - `Status del colegio` (A tiempo / A reforzar / Requiere atención inmediata).
     - Tablas de **Grupos de alumnos** y **Docentes PLD**.
   - Botón **“Guardar snapshot”**:
     - Guarda en Firestore:
       - Documento en `schools/{id}/snapshots`.
       - Actualiza en el documento del colegio:
         - `lastSnapshotRisk`
         - `lastSnapshotAt`
     - Muestra toast de éxito y cierra el modal.

---

## Vista previa del snapshot

La vista previa es clave antes de guardar. Se organiza en dos columnas (`snapshot-columns`):

- Columna izquierda (3fr): **Grupos de alumnos**.
- Columna derecha (2fr): **Docentes PLD**.

### Grupos de alumnos

Fuente: `snapshotData.students.groups`.

Cada fila de grupo muestra:

- Nombre del grupo / ruta.
- Métricas (ejemplos):
  - `students_total`
  - `students_with_progress`
  - `students_completed`
  - `courses_completion_percent`
- **Semáforo manual**:
  - Tres círculos (`status-dot`) en una columna “Semáforo”.
  - Colores: verde, amarillo, rojo.
  - El usuario elige color manualmente para cada grupo (estado **no se persiste**, es solo para análisis visual en el momento).

### Docentes PLD

Fuente: `snapshotData.teachers_pld.teachers`.

Cada fila muestra:

- Nombre del docente.
- Email u otra identificación relevante.
- Conteo de:
  - **Certificaciones** (todas).
  - **Completas**.

Para las columnas de conteo:

- Se muestra un número.
- Si hay elementos:
  - El `span` tiene clase `hint-hover` (cursor tipo ayuda).
  - El atributo `title` contiene:
    - Lista de `certification_name` para todas las certificaciones.
    - Lista de `certification_name` de las completadas, respectivamente.
  - Al pasar el mouse, el navegador muestra un tooltip nativo con el detalle.

---

## Status del colegio (riesgo)

En el formulario de snapshot:

- Campo **“Status del colegio”** sustituye a “Nivel de riesgo”.
- Opciones (chips tipo botón):
  - **A tiempo** → riesgo `bajo`.
  - **A reforzar** → riesgo `medio`.
  - **Requiere atención inmediata** → riesgo `alto`.

Este valor se guarda dentro del snapshot y también se replica como `lastSnapshotRisk` en el documento del colegio para colorear las cards del home.

---

## Contactos del colegio

Subcolección: `schools/{schoolId}/contacts`

Campos típicos de cada contacto:

- `firstName`
- `lastName`
- `email`
- `whatsapp`
- `type` (selector: directivo, docente, coordinador, etc.).
- `teaches` (booleano “Da clases” para tipos relevantes).

UI en el modal de colegio:

- Formulario para crear/editar contacto con los campos anteriores.
- Tabla estilizada con:
  - Columnas para nombre, rol, email, WhatsApp y “Da clases”.
  - Botones de acción:
    - Editar → rellena el formulario con los datos.
    - Eliminar → muestra confirmación inline (no `window.confirm`).

---

## Integración con backend FastAPI

El backend se ejecuta de forma local (por ejemplo, en `http://localhost:8000`) y expone rutas para analizar reportes.

En el frontend:

- Se usa `fetch` con `FormData`:
  - `formData.append("file", selectedFile)`.
  - `fetch("http://localhost:8000/analyze-report", { method: "POST", body: formData })`.
- Si la respuesta es `ok`, se parsea JSON y se almacena en estado (`snapshotData`).
- Si hay error:
  - Se muestra toast de error con mensaje comprensible (problema de conexión o error del backend).

El JSON completo que devuelve el backend se guarda en el campo `backendPayload` del snapshot para poder re-visualizarlo luego en modo solo lectura.

---

## Visualización de snapshots históricos

Una vez que existen snapshots guardados:

- Desde el modal del colegio, en la sección “Snapshots”:
  - Se listan todos los registros con fecha y status.
  - **Click en un snapshot**:
    - Abre el mismo modal de snapshot pero en **modo vista**:
      - Muestra toda la información tal cual se generó (a partir de `backendPayload`).
      - Los campos son **solo lectura** (no se puede re-editar el snapshot).
      - El botón principal es “Cerrar”.

Esto permite ver la evolución del colegio a lo largo del ciclo lectivo, comparando snapshots antiguos con los más recientes.

---

## UX y diseño

Principios aplicados:

- **Modo oscuro** coherente en toda la app.
- Tipografía limpia, paddings generosos, modales grandes para evitar scrolleo excesivo.
- Uso de:
  - Cards clicables para colegios.
  - Modales grandes para formularios y vistas de detalle.
  - Tablas compactas para contactos y tablas de snapshot.
  - Toasters (`react-hot-toast`) para feedback: éxito, error y estados de carga.
- Todas las confirmaciones de borrado usan UI propia, nunca `window.confirm`.

---

## Cómo ejecutar el proyecto

1. Instalar dependencias:

```bash
npm install
```

2. Configurar Firebase:

- Crear un proyecto en Firebase.
- Habilitar:
  - Authentication con proveedor Google.
  - Firestore.
- Crear un archivo `.env` o modificar directamente `firebase.js` con las claves de tu proyecto.
- Configurar reglas de Firestore (como el ejemplo de arriba, ajustado a tu dominio).

3. Levantar el backend FastAPI (ver README del backend).

4. Ejecutar la app frontend:

```bash
npm run dev
```

5. Abrir la URL que indica Vite (típicamente `http://localhost:5173`).

Iniciar sesión con una cuenta Google permitida por las reglas de Firestore y comenzar a crear colegios, contactos y snapshots.


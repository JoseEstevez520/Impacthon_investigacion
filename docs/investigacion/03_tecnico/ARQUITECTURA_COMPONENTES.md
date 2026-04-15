# Arquitectura de Componentes y Decisiones Técnicas

Documento de decisiones previas al desarrollo. Define la estructura de
componentes React y resuelve las preguntas técnicas abiertas.

---

## 1. Decisión: Visor 3D — Mol* vs 3Dmol.js

### Comparativa

| Criterio | 3Dmol.js | Mol* (Molstar) |
|---|---|---|
| **Facilidad de integración** | ⭐⭐⭐⭐⭐ Muy fácil | ⭐⭐⭐ Moderada |
| **Curva de aprendizaje** | Baja — API imperativa simple | Alta — arquitectura compleja |
| **Integración con React** | `useRef` + `useEffect` | Componentes propios o wrapper |
| **Tiempo de setup** | < 1 hora | 2-4 horas |
| **Rendimiento** | Alto (WebGL) | Muy alto (optimizado para macros) |
| **Tamaño del bundle** | Ligero | Pesado |
| **Quien lo usa** | Múltiples portales biológicos | RCSB PDB, AlphaFold DB oficial |
| **Coloreado por pLDDT** | Sí, con API sencilla | Sí, más opciones |
| **Aspecto visual** | Bueno | Igual que AlphaFold DB oficial |

### ✅ Decisión: **3Dmol.js para el hackathon**

**Justificación:**
- Es un hackathon de 48h. El tiempo de integración es crítico.
- 3Dmol carga un PDB como string con 5 líneas de código.
- Soporta coloreado por `b-factor` (que usaremos para mapear pLDDT).
- Mol* requeriría días para dominarlo bien; 3Dmol funciona en horas.
- Si ganamos y continuamos el proyecto → migrar a Mol* para producción.

**Alternativa futura:** `pdbe-molstar` (wrapper React de Mol*) si se necesita
una UI más profesional en la versión de producción conectada al CESGA real.

---

## 2. Arquitectura de Componentes React

### Árbol de componentes

```
App
├── NavBar
│   ├── Logo
│   └── Link → /jobs (historial)
│
├── [Ruta /]  →  SubmitPage
│   ├── HeroHeader
│   ├── FastaInput            ← textarea + validación visual del formato
│   ├── ResourceSelector      ← sliders/dropdowns GPUs, CPUs, RAM
│   ├── ProteinCatalogChips   ← botones de proteínas ejemplo del catálogo
│   └── SubmitButton
│
├── [Ruta /jobs/:jobId]  →  JobStatusPage
│   ├── JobStepper            ← PENDING → RUNNING → COMPLETED
│   ├── LogTerminal           ← caja de logs con autoscroll
│   ├── ResourceBadges        ← GPU/CPU/RAM solicitados
│   └── PollingController     ← lógica de polling cada 3s (hook)
│
├── [Ruta /results/:jobId]  →  ResultsPage
│   ├── ProteinHeader         ← nombre, UniProt, PDB ID, organismo
│   ├── ResultsLayout (2 col)
│   │   ├── [Izquierda] MolecularViewer   ← 3Dmol.js, coloreado pLDDT
│   │   └── [Derecha]
│   │       ├── PLDDTPanel               ← media + histograma de 4 rangos
│   │       ├── PAEHeatmap               ← matriz NxN con Plotly/D3
│   │       └── BiologicalDataPanel      ← solubilidad, estabilidad, toxicidad
│   ├── AIExplanation          ← resumen en lenguaje natural (LLM)
│   └── DownloadBar            ← PDB, mmCIF, JSON, logs
│
└── [Ruta /jobs]  →  JobsHistoryPage  (could have)
    └── JobsTable              ← historial con estado, pLDDT, accesos
```

---

## 3. Gestión de Estado

Para un hackathon, **sin Redux ni Zustand**. Solución mínima funcional:

```
Estado global mínimo (React Context o useState en App):
├── currentJobId        → string | null
└── jobHistory[]        → lista de jobs enviados en sesión

Estado local por página:
├── SubmitPage:   fastaText, gpus, cpus, memory, isLoading
├── JobStatusPage: jobStatus, logs[], pollingActive
└── ResultsPage:  outputData (pdb, plddt, pae, biological_data)
```

> **Nota:** El historial de jobs se puede persistir en `localStorage` para
> que no se pierda al recargar la página, sin necesitar backend propio.

---

## 4. Llamadas a la API — Estructura

Todas las llamadas se centralizan en un módulo `src/api/cesga.js`:

```
src/api/cesga.js
├── submitJob(fastaSequence, filename, gpus, cpus, memoryGb)
│     → POST /jobs/submit
│     → retorna: { job_id, status }
│
├── getJobStatus(jobId)
│     → GET /jobs/{jobId}/status
│     → retorna: { job_id, status, started_at, completed_at, ... }
│
├── getJobOutputs(jobId)
│     → GET /jobs/{jobId}/outputs
│     → retorna: { structural_data, biological_data, protein_metadata, logs }
│
├── getJobAccounting(jobId)
│     → GET /jobs/{jobId}/accounting
│     → retorna: { accounting: { cpu_hours, gpu_hours, ... } }
│
├── getProteins(filters?)
│     → GET /proteins/
│     → retorna: lista de proteínas del catálogo
│
└── getProteinSamples()
      → GET /proteins/samples
      → retorna: 8 secuencias FASTA listas
```

---

## 5. Lógica de Polling (JobStatusPage)

```
Hook: useJobPolling(jobId)
│
├── Cada 3 segundos → llamar getJobStatus(jobId)
├── Si status === "PENDING" o "RUNNING" → seguir polling
├── Si status === "COMPLETED" → parar polling → redirigir a /results/:jobId
├── Si status === "FAILED" → parar polling → mostrar error con mensaje
└── Timeout de seguridad: si pasan 5 min sin completar → mostrar aviso
```

---

## 6. Componente MolecularViewer (3Dmol.js)

Patrón de integración con React:

```javascript
// Pseudocódigo — no ejecutar, es solo arquitectura
function MolecularViewer({ pdbString, plddtPerResidue }) {
  const viewerRef = useRef(null)

  useEffect(() => {
    // 1. Inicializar el viewer en el div
    const viewer = $3Dmol.createViewer(viewerRef.current)

    // 2. Cargar el PDB desde string
    viewer.addModel(pdbString, 'pdb')

    // 3. Colorear por b-factor (que mapeamos con pLDDT)
    //    pLDDT >90 → azul oscuro | 70-90 → azul claro
    //    50-70 → amarillo | <50 → naranja
    viewer.setStyle({}, {
      cartoon: { colorscheme: { prop: 'b', gradient: 'roygb', min: 50, max: 90 } }
    })

    // 4. Zoom automático al centro de la proteína
    viewer.zoomTo()
    viewer.render()
  }, [pdbString])

  return <div ref={viewerRef} style={{ width: '100%', height: '500px' }} />
}
```

> **Truco clave:** El fichero PDB de la API incluye el pLDDT de cada
> residuo en la columna `b-factor` (columna B del formato PDB estándar).
> 3Dmol puede colorear por `b-factor` nativamente → coloreado automático.

---

## 7. PAE Heatmap

La `pae_matrix` es un array de arrays NxN (N = número de residuos).
Opciones para renderizarlo:

| Librería | Ventaja | Cómo |
|---|---|---|
| **Plotly.js** | Heatmap nativo, muy fácil | `<Plot data={[{z: paeMatrix, type:'heatmap'}]} />` |
| **D3.js** | Control total | Más código, más personalizable |
| **Canvas nativo** | Sin dependencia | Manual, viable para NxN no muy grandes |

**Recomendación: Plotly.js** — una línea de código para el heatmap básico.

---

## 8. Estructura de Carpetas del Proyecto

```
src/
├── api/
│   └── cesga.js          ← todas las llamadas a la API Mock
├── components/
│   ├── NavBar.jsx
│   ├── FastaInput.jsx
│   ├── ResourceSelector.jsx
│   ├── ProteinCatalogChips.jsx
│   ├── JobStepper.jsx
│   ├── LogTerminal.jsx
│   ├── MolecularViewer.jsx  ← 3Dmol.js
│   ├── PLDDTPanel.jsx
│   ├── PAEHeatmap.jsx       ← Plotly.js
│   ├── BiologicalDataPanel.jsx
│   ├── AIExplanation.jsx
│   └── DownloadBar.jsx
├── pages/
│   ├── SubmitPage.jsx
│   ├── JobStatusPage.jsx
│   └── ResultsPage.jsx
├── hooks/
│   └── useJobPolling.js  ← lógica de polling
└── main.jsx
```

---

## 9. Dependencias NPM a instalar

```bash
npm install 3dmol           # Visor 3D molecular
npm install plotly.js       # PAE heatmap
npm install react-router-dom # Navegación entre páginas
```

> Todo lo demás (React 19, Vite) ya viene en el boilerplate base.

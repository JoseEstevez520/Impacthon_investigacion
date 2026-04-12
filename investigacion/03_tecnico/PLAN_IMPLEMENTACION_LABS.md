# Plan de Implementación: Sección "Labs" (LocalFold)

## 1. Visión General
La sección **Labs** es un módulo educativo diseñado para que estudiantes e investigadores interactúen con proteínas documentadas a través de cuestionarios técnicos. Utiliza datos reales de la **AlphaFold Protein Structure Database** para validar conocimientos sobre estructura, función y origen de las proteínas.

---

## 2. Investigación de la API de AlphaFold
Se ha investigado la API REST pública de AlphaFold ([https://alphafold.ebi.ac.uk/api/](https://alphafold.ebi.ac.uk/api/)).

### Endpoints Clave:
- **Metadatos**: `GET /api/prediction/{uniprot_id}`
  - Proporciona: `entryId`, `gene`, `organismScientificName`, `uniprotSequence`, `uniprotDescription`.
  - Enlaces a archivos: `pdbUrl`, `cifUrl`, `paeImageUrl`.
- **Confianza (pLDDT)**: `https://alphafold.ebi.ac.uk/files/{entryId}-confidence_v4.json`
  - Útil para preguntas sobre la calidad de la predicción en regiones específicas.

---

## 3. Arquitectura del Mockup

### Estructura de Datos (Hardcoded para el MVP):
Se utilizará un objeto central que mapee IDs de UniProt con preguntas personalizadas, pero cuyos datos base se extraigan de la API.

```javascript
const LAB_PROTEINS = [
  {
    uniprotId: 'P69905',
    name: 'Hemoglobin subunit alpha',
    questions: [
      {
        id: 1,
        text: "¿Cuál es el nombre del gen que codifica esta proteína?",
        options: ["HBA1", "INS", "GFP", "TP53"],
        correct: "HBA1"
      },
      {
        id: 2,
        text: "¿En qué organismo se encuentra principalmente esta variante?",
        options: ["Homo sapiens", "Aequorea victoria", "Escherichia coli", "Mus musculus"],
        correct: "Homo sapiens"
      }
    ]
  },
  // ... más proteínas
];
```

### Componentes Frontend:
1. **Labs.jsx**: Página principal de la sección. Listado de proteínas disponibles.
2. **ProteinQuiz.jsx**: Componente interactivo para responder preguntas.
3. **LabViewer.jsx**: Versión simplificada del visor 3D para inspeccionar la proteína mientras se responde.

---

## 4. Guía de Diseño (Identidad LocalFold)
Se seguirán estrictamente las guías de `IDENTIDAD_MARCA.md`:
- **Fondo**: `#0D1117` (Carbon lab).
- **Acentos**: `#3CEFFF` (Cian biotech) para elementos activos.
- **Tipografía**: Inter.
- **Tono**: Sage + Magician (educativo y experto).

---

## 5. Fases de Implementación

### Fase 1: Setup y Rutas (Hoy)
- [ ] Registrar la ruta `/app/labs` en `App.jsx`.
- [ ] Añadir acceso en `Sidebar.jsx`.
- [ ] Crear estructura básica de `Labs.jsx`.

### Fase 2: Integración de Datos (Mockup)
- [ ] Implementar un servicio `alphafoldApi.js` (opcional si se usa fetch directo).
- [ ] Definir el set de 3 proteínas de ejemplo con sus preguntas.

### Fase 3: UI/UX Interactiva
- [ ] Diseñar tarjetas de selección de laboratorio.
- [ ] Implementar el flujo de preguntas (Quiz) con feedback visual (Verde `#00C48C` / Naranja `#FF8C42`).
- [ ] Integrar el visor 3D si es posible dentro del flujo del quiz.

---

## 6. Próximos Pasos
1. Crear el archivo `Labs.jsx`.
2. Actualizar la navegación.
3. Implementar la lógica del cuestionario.

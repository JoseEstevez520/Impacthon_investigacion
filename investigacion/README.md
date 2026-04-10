# LocalFold — Documentación de Investigación y Producto

Repositorio de conocimiento para el reto **LocalFold** del Impacthón 2026.
Todo lo que necesitas saber antes de abrir el editor.

---

## Estructura de carpetas

```
investigacion/
│
├── 01_problema/              ← Por qué existe LocalFold
│   ├── DOCUMENTO_DE_INVESTIGACION.md       → Contexto del reto, el problema y estado del arte
│   ├── INVESTIGACION_USUARIOS.md           → Perfiles de usuario, flujos, features (MoSCoW)
│   └── ANALISIS_COMPETENCIA_NEUROSNAP.md   → Análisis del competidor principal (funcionalidades, pricing, gaps)
│
├── 02_producto/              ← Qué construimos
│   └── MVP_SKETCH.md                    → Sketches ASCII de las 3 pantallas del MVP
│
└── 03_tecnico/               ← Cómo lo construimos
    ├── STACK_Y_APUNTES_DESARROLLO.md    → Stack, endpoints, campos de API, trampas técnicas
    └── ARQUITECTURA_COMPONENTES.md      → Árbol de componentes, decisión visor 3D, polling, estructura src/

Documentacion/                ← Fuente: PDFs originales del reto + doc unificado
    ├── CONTEXTUALIZACION_DEL_RETO.pdf
    ├── GUIA_DE_USO_API.pdf
    ├── IMPACTHON_2026_CAMELIA.pdf
    ├── PRESENTACIÓN_IDEA_GENERAL.pdf
    └── DOCUMENTACION_COMPLETA_IMPACTHON.md  → Resumen unificado de los 4 PDFs
```

---

## Estado actual de la documentación

| Documento | Estado | Contenido |
|---|---|---|
| `DOCUMENTO_DE_INVESTIGACION.md` | ✅ Completo | Problema, usuarios, estado del arte |
| `INVESTIGACION_USUARIOS.md` | ✅ Completo | 4 perfiles, flujos reales, features priorizadas (MoSCoW) |
| `ANALISIS_COMPETENCIA_NEUROSNAP.md` | ✅ Completo | Features, pricing, puntos débiles, posicionamiento vs LocalFold |
| `MVP_SKETCH.md` | ✅ Completo | 3 pantallas en ASCII + flujo completo |
| `STACK_Y_APUNTES_DESARROLLO.md` | ✅ Completo | Stack, endpoints, campos salida, apuntes clave |
| `DOCUMENTACION_COMPLETA_IMPACTHON.md` | ✅ Completo | Resumen de todos los PDFs del reto |

---

## Conclusión estratégica (resumen ejecutivo)

**El problema:** Los investigadores biológicos no pueden usar AlphaFold2 directamente.  
**La solución existente:** Neurosnap — cara ($7-80/mes), datos en USA, UX orientada a técnicos.  
**Nuestra ventaja:** CESGA (infraestructura gallega, segura, institucional) + UX pensada para el biólogo.  
**Nuestro diferenciador clave:** Privacidad de datos garantizada + lenguaje natural con IA.

---

## Siguientes pasos

### 🔴 CRÍTICO — antes de escribir código
- [ ] **Decidir visor 3D** — Mol* (mismo que AlphaFold DB, más potente) vs 3Dmol.js (más fácil de integrar en hackathon)
- [ ] **Probar la API en Swagger** — verificar cold-start y que el flujo completo funciona con una proteína real
- [ ] **Arquitectura de componentes React** — qué componentes necesitamos y cómo se comunican

### 🟡 ALTA PRIORIDAD — durante el hackathon
- [ ] **Pantalla 1:** textarea FASTA + validación visual + chips de ejemplo + botón submit
- [ ] **Pantalla 2:** polling automático cada 3s + logs en tiempo real + stepper de estado
- [ ] **Pantalla 3:** panel de métricas (pLDDT histograma + datos biológicos en lenguaje claro)
- [ ] **Visor 3D:** renderizar PDB con coloreado por pLDDT

### 🟢 DIFERENCIACIÓN — si queda tiempo
- [ ] **Resumen LLM** — llamada a Gemini/GPT que explique el resultado en lenguaje natural
- [ ] **Dashboard "Mis Jobs"** — historial de predicciones enviadas
- [ ] **Advertencias automáticas** — banner si `plddt_mean < 50`
- [ ] **Comparar nuestro visor con Neurosnap** y superar su UX como benchmark explícito

---

## Links de referencia rápida

| Recurso | URL |
|---|---|
| API Mock (base) | https://api-mock-cesga.onrender.com |
| Swagger / Docs interactivos | https://api-mock-cesga.onrender.com/docs |
| AlphaFold DB (referencia visual 1) | https://alphafold.ebi.ac.uk |
| Neurosnap AlphaFold2 (referencia visual 2) | https://neurosnap.ai/service/AlphaFold2 |
| Mol* viewer | https://molstar.org/viewer/ |
| 3Dmol.js | https://3dmol.csb.pitt.edu |

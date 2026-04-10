# Plan de Sprint — Impacthón 2026 (10-12 Abril)

El hackathon dura ~48h. Este documento divide el trabajo en bloques
realistas para llegar al pitch con algo funcional y diferenciador.

---

## Vista General

```
JUEVES 10 (noche)     VIERNES 11 (día completo)     SÁBADO 12 (mañana)
──────────────────    ─────────────────────────     ───────────────────
Setup + fundamentos   Core features + visor 3D      Polish + pitch
                      LLM si queda tiempo            Demo final
```

---

## 🌙 JUEVES NOCHE (10 Abril — 21:00 a 02:00)

**Objetivo:** Proyecto arrancando, Pantalla 1 funcional, API verificada.

| # | Tarea | Responsable | Tiempo |
|---|---|---|---|
| 1 | Verificar que `npm run dev` arranca en el frontend | Dev | 15 min |
| 2 | Probar la API en Swagger — enviar Ubiquitina, ver que completa | Cualquiera | 20 min |
| 3 | Instalar dependencias: `react-router-dom`, `3dmol`, `plotly.js` | Dev | 15 min |
| 4 | Crear estructura de carpetas `src/` según arquitectura | Dev | 20 min |
| 5 | Crear módulo `src/api/cesga.js` con las 5 funciones | Dev | 45 min |
| 6 | Pantalla 1: `SubmitPage` — textarea FASTA + validación + botón | Dev | 60 min |
| 7 | Test: enviar una secuencia y ver que llega a `JobStatusPage` | Todos | 15 min |

**Checkpoint noche:** La app arranca, el usuario puede pegar una secuencia y enviarla. El job_id llega.

---

## ☀️ VIERNES (11 Abril — 09:00 a 22:00)

### BLOQUE 1 — Mañana (09:00 - 14:00): Ciclo de vida del Job

| # | Tarea | Tiempo |
|---|---|---|
| 1 | `JobStatusPage` — stepper PENDING / RUNNING / COMPLETED | 60 min |
| 2 | Hook `useJobPolling` — polling cada 3s con parada automática | 60 min |
| 3 | `LogTerminal` — caja de logs con autoscroll y fuente mono | 45 min |
| 4 | Redirección automática a `/results/:jobId` al completar | 20 min |
| 5 | Manejo de errores: FAILED + cold-start API (30s loader) | 30 min |

**Checkpoint mediodía:** El flujo completo PENDING → RUNNING → COMPLETED funciona. El usuario ve el progreso en tiempo real.

---

### BLOQUE 2 — Tarde (15:00 - 20:00): Resultados + Visor 3D

| # | Tarea | Tiempo |
|---|---|---|
| 1 | `ProteinHeader` — nombre, UniProt, PDB ID (si catálogo) | 30 min |
| 2 | `MolecularViewer` — integrar 3Dmol.js, cargar PDB string | 90 min |
| 3 | Coloreado por pLDDT en 3Dmol (b-factor gradient) | 45 min |
| 4 | `PLDDTPanel` — media global + histograma 4 rangos + colores | 60 min |
| 5 | `BiologicalDataPanel` — solubilidad, estabilidad, toxicidad | 45 min |

**Checkpoint tarde:** Los resultados se muestran. El visor 3D carga y colorea la proteína.

---

### BLOQUE 3 — Noche (20:00 - 22:00): PAE + Descargas + Pulido base

| # | Tarea | Tiempo |
|---|---|---|
| 1 | `PAEHeatmap` — Plotly.js con la pae_matrix | 60 min |
| 2 | `DownloadBar` — botones descarga PDB, mmCIF, JSON | 30 min |
| 3 | Responsive básico — que no se rompa en pantallas distintas | 30 min |

**Checkpoint noche viernes:** MVP 100% funcional. Todo el flujo de punta a punta.

---

## 🚀 SÁBADO MAÑANA (12 Abril — 09:00 a 13:00): Diferenciación + Pitch

### BLOQUE 4 — Diferenciación (09:00 - 11:00)

Elegir **uno** según el tiempo disponible:

**Opción A — LLM Asistente (máximo impacto en jurado)**
- Integrar llamada a Gemini/GPT con el resultado
- El LLM recibe: pLDDT medio, datos biológicos, nombre proteína
- Genera un párrafo en lenguaje natural para el biólogo
- Tiempo estimado: ~90 min

**Opción B — ProteinCatalogChips + historial de jobs**
- Chips de proteínas del catálogo que autorrellanan el formulario
- Persistir historial en localStorage
- Tiempo estimado: ~90 min

**Opción C — Comparación sano vs mutado**
- Formulario doble: secuencia original + variante
- Visual side-by-side
- Tiempo estimado: ~2h (solo si el equipo va muy adelantado)

---

### BLOQUE 5 — Pitch + Demo (11:00 - 13:00)

| # | Tarea | Tiempo |
|---|---|---|
| 1 | Preparar demo en vivo con Ubiquitina (pequeña, rápida) | 20 min |
| 2 | Slides del pitch (ver estructura abajo) | 45 min |
| 3 | Ensayo del pitch con demo en vivo | 30 min |
| 4 | Arreglos finales de bugs visibles | 25 min |

---

## Estructura del Pitch (5-7 minutos)

```
1. EL PROBLEMA (1 min)
   "Un biólogo con una secuencia nueva no puede usarla en AlphaFold
   sin ayuda de un informático y sin exponer datos sensibles."

2. NUESTRA SOLUCIÓN (1 min)
   "LocalFold — la interfaz que faltaba para el CESGA.
   Tan sencilla como pegar una secuencia y darle a un botón."

3. DEMO EN VIVO (2-3 min)
   → Pegar Ubiquitina → Ver cola → Resultados → Visor 3D → Métricas
   [Si hay LLM: mostrar el resumen generado automáticamente]

4. POR QUÉ GANAMOS vs NEUROSNAP (30 seg)
   "Datos en Galicia, gratis para investigadores, UX para biólogos."

5. PRÓXIMOS PASOS (30 seg)
   "Con el CESGA real esto entra en producción cambiando una URL."
```

---

## Tabla de Riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| API cold-start (30s delay) | Alta | Mostrar "Calentando servidor..." con spinner amigable |
| 3Dmol no carga el PDB | Media | Tener fallback: mostrar solo métricas sin visor |
| Plotly PAE muy lento en N grande | Baja | Limitar display a 100x100 si N > 100 |
| LLM sin API key disponible | Media | Preparar textos preescritos como fallback |
| No da tiempo al LLM | Alta | MVP sin LLM sigue siendo ganador si el visor funciona bien |

---

## Regla de oro

> Si en algún momento el equipo está atascado más de **30 minutos**
> en un problema, se descarta esa feature y se avanza a la siguiente.
> Un MVP funcional sin LLM vale más que un MVP roto con LLM.

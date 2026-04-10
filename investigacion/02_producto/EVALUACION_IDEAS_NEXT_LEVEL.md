# Evaluación de Ideas — Versión "Next Level" de LocalFold

Análisis honesto de cada idea propuesta: qué tiene valor real, qué es
factible en el hackathon, y qué es visión de producto a largo plazo.

---

## Semáforo general

```
🟢 Factible en 48h + impacto alto en jurado
🟡 Simplificable para el hackathon / impacto medio
🔴 Out of scope para hackathon — visión a largo plazo
```

---

## 1. UX más científica e intuitiva

### 🟢 A) Buscar proteína por nombre/gen/enfermedad
**Valoración: EXCELENTE — y es factible.**

La API del CESGA ya tiene `GET /proteins/?search=nombre` con filtrado
por nombre, organismo y categoría. Esto se puede implementar como una
barra de búsqueda con autocompletado usando las 22 proteínas del catálogo.

> **Recomendación:** Hacerlo. Es 1-2 horas de trabajo y eleva mucho la UX
> frente a solo mostrar chips de proteínas. El jurado lo verá al instante.

---

### 🟡 B) Modo "exploración guiada"
**Valoración: BUENA IDEA — pero simplificar el alcance.**

El concepto de guiar al usuario paso a paso ("¿qué quieres hacer?") es
acertado. Sin embargo, implementar un flujo completo de exploración en 48h
es arriesgado. Versión simplificada factible:

- En la pantalla de resultados, añadir secciones colapsables:
  "¿Qué significan estos datos?" con tooltips educativos.
- Un botón "Ver función biológica" que abre la ficha UniProt de la proteína.

> **Recomendación:** Tooltips educativos + link a UniProt. El "modo wizard"
> completo es para la versión de producción.

---

## 2. IA encima de AlphaFold

### 🟢 A) "Protein Copilot" — Chat sobre la proteína
**Valoración: LA MEJOR IDEA DEL LISTADO. Hacer sí o sí.**

Es el diferenciador más potente y más factible. Nadie más lo tiene
(ni Neurosnap). El jurado valorará explícitamente el uso de LLMs.

Implementación en el hackathon:
- Un input de chat en la pantalla de resultados
- Prompt al LLM con el contexto: nombre de proteína, pLDDT medio, datos
  biológicos, toxicidad, estabilidad
- El LLM responde preguntas como "¿qué parte es activa?" usando ese contexto

Preguntas presugeridas (para que el usuario sepa qué puede preguntar):
- "¿Qué hace esta proteína?"
- "¿Qué significan las regiones naranjas?"
- "¿Podría ser diana terapéutica?"

> **Recomendación:** Implementar mínimo un resumen automático generado al
> cargar resultados + el chat si queda tiempo. **Es el feature ganador.**

---

### 🔴 B) Predicción de binding / docking
**Valoración: INTERESANTE — pero imposible en 48h.**

El docking molecular requiere herramientas específicas (AutoDock, Vina,
DiffDock) que son modelos ML separados y pesados. La API del CESGA no
los incluye. Implementar esto desde cero en un hackathon no es viable.

> **Para el pitch:** Mencionarlo como "next step" o "visión de producto".
> En el hackathon no va.

---

### 🟡 C) Mutaciones simuladas — Comparar sano vs mutado
**Valoración: MUY BUENA IDEA — versión simplificada factible.**

Enviar dos jobs (secuencia original + variante) y mostrarlos en paralelo
es posible con la API. El reto es la UI de comparación lado a lado.

Versión mínima factible en el hackathon:
- Formulario con 2 textarea: "Secuencia original" y "Variante/Mutación"
- Se envían 2 jobs, se espera que ambos completen
- Panel de comparación de métricas (pLDDT, estabilidad left vs right)
- Si hay tiempo, dos visores 3D lado a lado

> **Recomendación:** Implementar solo si el MVP base ya funciona al 100%.
> Es el "could have" más cercano a diferenciador real para el caso de uso
> de medicina personalizada (Cátedra Camelia lo agradecería mucho).

---

## 3. Visualización 3D mejorada

### 🟢 A) Comparación múltiple (si ya se tiene el viewer)
**Valoración: BUENA — derivado natural de la sección de mutaciones.**
Ver punto 2C arriba.

---

### 🟢 B) Surface view + ribbon + bonds
**Valoración: FÁCIL DE IMPLEMENTAR con 3Dmol.js.**

3Dmol soporta múltiples estilos con pocas líneas:
- Selector de estilo: `Ribbon / Surface / Stick / Cartoon`
- Un dropdown o botones de radio para cambiar el render en tiempo real.

> **Recomendación:** Añadir un selector de modo de visualización.
> Son 30 min de trabajo y mejora mucho la percepción visual del visor.

---

### 🟢 C) "Explain mode" — clicar zona y explicar
**Valoración: BUENA — y combinable con el Protein Copilot.**

Versión simplificada: al posicionar el cursor sobre una región roja/naranja
del visor, un tooltip dice:
*"Residuos con pLDDT < 50 — probablemente región intrínsecamente desordenada"*

Versión con LLM: clic en residuo → el LLM explica esa región en contexto.

> **Recomendación:** Tooltips informativos en el visor. El LLM on-click
> solo si ya funciona el chat general.

---

## 4. Performance + Backend

### 🔴 Cache de estructuras, GPU pool, ColabFold
**Valoración: CORRECTA como visión — imposible en 48h.**

La API Mock ya gestiona todo esto de forma simulada. Optimizaciones
reales de infraestructura son para cuando se conecte al CESGA real.

> **Para el pitch:** Describir la arquitectura técnica de producción
> como "la capa que ya existe en el CESGA". No hay que construirla.

---

### 🟡 API abierta (/predict, /mutate, /dock, /compare)
**Valoración: INTERESANTE — mencionarlo en el pitch como "API-first design".**

El módulo `src/api/cesga.js` que ya tenemos actúa como capa de abstracción.
Con naming bien pensado es suficiente para demostrar el concepto.

---

## 5. Knowledge Graph ("Google Maps de biología molecular")

### 🔴 Neo4j + grafo de enfermedades/genes/fármacos
**Valoración: VISIÓN CORRECTA — imposible en 48h.**

Un grafo de conocimiento completo es un producto de años. Sin embargo:

**Versión simulada factible para el hackathon:**
- Usar la API del CESGA (que ya tiene `biological_data`) y enriquecerla
  con llamadas a la API pública de **UniProt** para obtener:
  - Función conocida
  - Enfermedades asociadas
  - Interacciones proteicas conocidas
- Presentarlo visualmente como un panel "Contexto biológico" simple.

> **Recomendación:** Llamada a UniProt API + panel de contexto = simula
> el knowledge graph sin construir la base de datos. Muy impactante.

---

## 6. Features "wow"

### 🟡 A) Disease Mode
**Valoración: SIMPLIFICABLE.**

Con las 22 proteínas del catálogo se puede hacer una versión funcional:
- Seleccionar enfermedad (Alzheimer, cáncer, ELA, etc.)
- Mostrar las proteínas del catálogo implicadas en esa enfermedad
- Hacer la predicción de las más relevantes con un clic

> **Recomendación:** Muy bueno para el pitch aunque sea solo con las
> 22 proteínas conocidas. Demuestra el caso de uso médico directamente.

---

### 🔴 B) Drug Discovery Mode — ranking de binding
Sin docking real, esto no se puede computar. Solo como mockup/visión.

### 🔴 C) Evolution Mode
Requiere alineamientos evolutivos y base de datos extra. Visión a largo plazo.

---

## 7. Arquitectura propuesta (Frontend → API → AlphaFold + LLM)

### 🟢 Valoración: CORRECTA. Y ya está casi diseñada.

La arquitectura que propones es exactamente la que el CESGA ya tiene:
```
Frontend (React + 3Dmol.js)
   ↓
API Mock CESGA (ya existe, pública)
   ↓ (en producción)
AlphaFold GPU + LLM Layer ← esta parte la añadimos nosotros
   ↓
Knowledge Graph ← MVP: UniProt API pública
```

Para el hackathon el LLM Layer se implementa como llamadas directas
de frontend a la API de Gemini/OpenAI (sin backend propio intermedio).

---

## Resumen — ¿Qué hacer y en qué orden?

### 🟢 Implementar en el hackathon (ordenado por prioridad)

| Prioridad | Feature | Impacto en jurado |
|---|---|---|
| 1 | Buscador de proteína por nombre/gen/enfermedad | Alto — UX |
| 2 | Protein Copilot (resumen LLM automático en resultados) | Muy alto — IA |
| 3 | Selector de estilo 3D (ribbon/surface/stick) | Medio — visualización |
| 4 | Tooltips educativos en métricas (pLDDT, PAE, etc.) | Alto — UX biólogo |
| 5 | Panel "Contexto biológico" con llamada a UniProt | Alto — datos adicionales |
| 6 | Comparación sano vs mutado (si queda tiempo) | Muy alto — caso uso médico |
| 7 | Disease Mode simplificado (si queda tiempo) | Alto — storytelling |

### 🔴 Mencionar en el pitch como "visión de producto"
- Knowledge graph completo
- Drug discovery / docking
- Evolution mode
- GPU pool / cache de infraestructura

---

## Conclusión

Estas ideas tienen una calidad estratégica muy alta. El problema no es
la ambición — está bien tenerla. El problema es priorizar.

**El hackathon se gana con:**
1. Un MVP funcional y bonito (criterio 1 y 3)
2. Un Protein Copilot con LLM que explique los resultados (criterio 1 y 4)
3. Un pitch que muestre la visión grande aunque no esté implementada (criterio 5)

**La trampa a evitar:** Intentar implementar todo y llegar al pitch
con 7 features a medio hacer en lugar de 3 features perfectas.

# Documentación Completa - Impacthón 2026: LocalFold

Este documento recopila de manera unificada la información de los recursos entregados para el reto **LocalFold** organizado por el GDG Santiago de Compostela y la Cátedra Camelia.

---

## 1. Contextualización del Reto

### 1.1 El Problema
La ejecución de sistemas modernos de predicción de estructuras proteicas (como AlphaFold2) presenta una barrera tecnológica significativa para investigadores biológicos debido a los requisitos de infraestructura: sistemas Linux, GPUs de última generación, bases de datos masivas (~3 TB) y conocimientos sobre sistemas de colas (Slurm).

### 1.2 El Objetivo del Proyecto "LocalFold"
Construir una "última milla" o interfaz web intuitiva, orientada a usuarios sin experiencia técnica en HPC, que permita interactuar con la infraestructura existente de supercomputación. No se trata de crear la IA desde cero ni de ejecutar el sistema de predicción final, sino de desarrollar un **frontend** amigable conectado a un backend simulador de cara a validar un modelo de producción para el supercomputador FT3 del CESGA (Centro de Supercomputación de Galicia).

### 1.3 Arquitectura Prevista
La idea real tras el sistema contempla 3 capas:
1. **Investigador (Frontend web):** Navegador donde el investigador pega su secuencia FASTA.
2. **Backend API (Mock/Simulador para el Hackathon):** Simula comandos SLURM de la cola (PENDING -> RUNNING -> COMPLETED).
3. **Clúster HPC real (CESGA FT3):** Con nodos AlphaFold2 y GPUs NVIDIA A100. (Fuera del alcance directo de desarrollo por los participantes; se interactúa a través de la API).

---

## 2. Bases y Criterios del Impacthón 2026

* **Organizador:** GDG Santiago de Compostela / ETSE / USC.
* **Patrocinador:** Cátedra Camelia Medicina Personalizada - Plexus.
* **Premio:** El equipo ganador tendrá la oportunidad de continuar el desarrollo de su proyecto en el entorno estratégico del CiTIUS y CAMELIA, contando con recursos y apoyo experto para llevar el prototipo a producción real.

### Criterios de Evaluación
1. **Usabilidad y UX orientada al biólogo (Prioridad 1):** Facilidad de uso total para no bioinformáticos. Lenguaje claro, tooltips explicativos, y flujos que eliminen casi toda complejidad técnica.
2. **Visualización e interpretabilidad:** Es obligada la presentación interactiva del PDB con herramientas como Mol* o 3Dmol.js. Representar el coloreando según la métrica pLDDT y comprender el heatmap 2D de la PAE Matrix. 
3. **Gestión del ciclo de vida del Job:** Flujo PENDING -> RUNNING -> COMPLETED robusto. Resiliencia ante errores. Muestra comprensible al usuario del progreso.
4. **Integración creativa de datos adicionales:** Sumar valor con información opcional proporcionada por la API como métricas HPC, solubilidad o alertas de toxicidad. (Se valora la adición de GenAI y LLMs).
5. **Viabilidad para producción:** El código debe sentar bases reales para acoplarse con la arquitectura de Slurm y el ecosistema real del CESGA sin tener que rehacer todo desde cero.

**No es premiado:**
La perfección algorítmica ni el desarrollo de la IA para las predicciones, dado que todo viene en base a la API.

---

## 3. Guía de Uso de la API Mock

La API está desplegada temporalmente como backend simulador accesible en un servidor público sin autenticación. 

* **URL base Swagger Docs:** `https://api-mock-cesga.onrender.com/docs`
* **Notas de arranque:** Puede tardar ~30s en responder de una pausa larga.

### 3.1 Catálogo de Proteínas (`GET /proteins/`)
Hay 22 proteínas precargadas curadas manualmente (Ej: Ubiquitina, Calmodulina, GFP).
* *Acción con proteínas precargadas:* Retornan resultados reales de AlphaFold y metadata del UniProt.
* *Acción con FASTA nuevo:* Retorna resultados pero generados algorítmicamente sintéticos, comportándose a nivel sistema igual que uno real.

### 3.2 Flujo Principal de Trabajo
1. Enviar una petición a **`POST /jobs/submit`** en JSON con la secuencia `fasta_sequence` incluyendo el "header" con `>`.
2. Conservar el **`job_id`** devuelto.
3. Consultar periódicamente en **`GET /jobs/{job_id}/status`** el avance del job.
4. Al marcar `COMPLETED`, llamar a **`GET /jobs/{job_id}/outputs`** para recuperar:
    * El fichero de estructura (`pdb_file`).
    * Medición de calidad como `plddt` y la matriz `PAE`.
    * Datos biológicos predictivos y estadísticos.

### 3.3 Datos y Criterios Biológicos de Salida
* **pLDDT:** Valor entre 0 y 100 de confianza del pliegue aminoácido a aminoácido. (Azul = Alta precisión; Naranja = Inestable)
* **PAE Matrix:** Matriz cuadriculada que calcula de 0 a 5 la viabilidad cruzada. Ideal para representar mediante "Heatmaps".
* **Accounting HPC:** Permite reportes sobre los minutos de GPU, CPU y memoria RAM virtualizados como parte de la integración propuesta de HPC real.

---

## 4. Presentación de la Idea General (Pitch)

*(Nota: En la documentación entregada, el archivo `PRESENTACIÓN_IDEA_GENERAL.pdf` aparecía todavía sin contenido estructurado para el equipo. Sin embargo, os sugerimos completarla con esta estructura base orientada al "Pitch" del evento)*

1. **La Barrera de la Ciencia:** Por qué AlphaFold es magia inaccesible para los biólogos a día de hoy.
2. **Nuestra Solución (LocalFold):** Cómo nuestra plataforma elimina la frustración y la terminal. Demo web o flujos de UX limpios. 
3. **El Corazón del Visualizador:** Demostración del renderizado interactivo PDB, la colorización por pLDDT del modelo generado y comprensión del Error Predictivo (PAE).
4. **Innovación Añadida y Ecosistema CESGA:** ¿Cómo hemos aplicado IA (Asistentes virtuales) o preparado la arquitectura para el traspaso a un clúster Slurm / FT3?
5. **Impacto a Futuro:** Próximos pasos en integración productiva.

---
*Este documento sintetiza de forma estructurada todo el contexto técnico y estratégico recabado para dar solución y enfocar el esfuerzo de desarrollo.*

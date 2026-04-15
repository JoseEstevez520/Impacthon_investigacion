# <img src="frontend/public/logo.png" width="45" height="45" align="center" style="margin-right: 15px;"> Micafold — Por el Equipo Teis

[![Hackathon](https://img.shields.io/badge/Impacthon-2026-blueviolet?style=for-the-badge)](https://github.com/JoseEstevez520/Impacthon_investigacion)
[![Premio](https://img.shields.io/badge/Premio-🥈%202º%20Puesto-gold?style=for-the-badge)](https://github.com/JoseEstevez520/Impacthon_investigacion)
[![Plataforma](https://img.shields.io/badge/Plataforma-CESGA%20HPC-brightgreen?style=for-the-badge)](https://www.cesga.es/)
[![IA](https://img.shields.io/badge/IA-ProteIA-orange?style=for-the-badge)](https://github.com/JoseEstevez520/Impacthon_investigacion)

**Micafold** no es solo una herramienta, es el centro de trabajo digital para el biólogo del futuro. Desarrollada por el **Equipo Teis** durante la **Impacthon 2026**, esta plataforma aprovecha la potencia del CESGA para transformar datos complejos en descubrimientos científicos accionables.

---

## 🌟 La Visión del Equipo Teis: Un Ecosistema, no una Herramienta

Nuestra filosofía se basa en que la tecnología debe adaptarse al científico, y no al revés. En **Micafold**, la apuesta por la **personalización radical** comienza desde el primer contacto.

### 🧬 Personalización Inteligente (Onboarding)
A través de un proceso de onboarding diseñado para captar el perfil y las necesidades específicas del investigador, la plataforma se reconfigura para ahorrar iteraciones críticas y eliminar la frustración técnica. No entregamos una interfaz genérica; entregamos un espacio de trabajo a medida.

### 🏢 Más que un Visor 3D: Una Plataforma Integral
Micafold ha sido diseñado como un entorno completo para la investigación:
*   **Organización**: Espacios de trabajo dedicados para gestionar múltiples proyectos de plegamiento.
*   **Colaboración**: Herramientas integradas para compartir resultados y hallazgos con la comunidad científica.
*   **Aprendizaje**: Recursos educativos dinámicos para que los investigadores puedan evolucionar junto con las herramientas de IA.

---

## 🏗️ Arquitectura Técnica

Micafold utiliza una arquitectura desacoplada para garantizar escalabilidad y seguridad en entornos de supercomputación.

```mermaid
graph TD
    User([🔬 Investigador]) -->|Onboarding & Perfil| React[Plataforma React]
    React -->|Persistencia Proyectos| Firebase[(Cloud Firestore)]
    React -->|Tarea de Plegamiento| CESGA[HPC CESGA / Slurm]
    
    subgraph "Nube de Cómputo"
    CESGA -->|Ejecución AF2| AF2[AlphaFold2 + GPUs]
    AF2 -->|Resultados Estructurales| Storage[Almacenamiento Seguro]
    end
    
    Storage -->|Contexto| N8N{Orquestador IA}
    N8N -->|Generación de Insights| LLM[Modelo de Lenguaje]
    LLM -->|Asesoría Personalizada| React
    
    React -->|Ecosistema Visual| Viewer[Visor 3D + Dashboard Colaborativo]
```

---

## 🚀 Funcionalidades Principales

### 🤖 ProteIA: Asistente de Investigación con IA
Integrado en todo el flujo de trabajo para traducir datos en conocimiento biológico:
- **Informes a Medida**: Genera automáticamente resúmenes científicos adaptados al nivel de especialización del usuario.
- **Chat Contextual**: Pregunta sobre regiones específicas, mutaciones o aplicaciones terapéuticas.
- **Diagnóstico Humano**: Traduce errores complejos de infraestructura en consejos prácticos.

### 🔬 Inteligencia Visual y Colaborativa
- **Visor 3D Interactivo**: Renderizado de alta definición integrado en el flujo de trabajo diario.
- **Interpretación de Métricas**: Mapeo visual de confianza y matrices PAE explicadas en lenguaje natural.
- **Centro de Exportación**: Descarga informes y estructuras optimizados para publicaciones científicas.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Plataforma** | React 19, Vite, Tailwind CSS, Framer Motion |
| **Visualización** | 3Dmol.js, Plotly.js |
| **Inteligencia** | n8n (Flujos Agentic), LLMs |
| **Infraestructura** | CESGA HPC, Slurm, Firebase Firestore |

---

## 📂 Estructura del Repositorio

*   **`frontend/`**: Todo el código fuente de la plataforma cliente.
*   **`docs/`**: Base de conocimientos completa del proyecto (Investigación, Pitch y Guías).
*   **Raíz**: Configuraciones de despliegue y dependencias globales.

---

## 🚦 Primeros Pasos

1. **Clonar**: `git clone https://github.com/JoseEstevez520/Impacthon_investigacion.git`
2. **Setup**: `cd frontend && npm install`
3. **Despegue**: `npm run dev`

---

## 👥 Equipo
Desarrollado con ❤️ por el **Equipo Teis** durante la **Impacthon 2026** en el CESGA.

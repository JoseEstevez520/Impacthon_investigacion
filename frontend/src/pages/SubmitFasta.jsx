import { useState } from "react";
import {
  UploadCloud, FileText, CheckCircle, AlertTriangle,
  Cpu, MemoryStick, Zap, Timer, ChevronRight, Gauge
} from "lucide-react";
import { db, auth } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// ── Hardware presets ──────────────────────────────────────────────────────────
const PRESETS = [
  {
    id: "lite",
    label: "Lite",
    description: "Secuencias cortas (<200 aa)",
    icon: "⚡",
    color: "from-emerald-500 to-teal-500",
    border: "border-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    gpus: 0,
    cpus: 2,
    memory_gb: 8,
    max_runtime_seconds: 1800,
  },
  {
    id: "standard",
    label: "Standard",
    description: "Uso general recomendado",
    icon: "🧬",
    color: "from-primary-500 to-violet-500",
    border: "border-primary-400",
    bg: "bg-primary-50 dark:bg-primary-900/20",
    gpus: 1,
    cpus: 8,
    memory_gb: 32,
    max_runtime_seconds: 3600,
  },
  {
    id: "hpc",
    label: "HPC Max",
    description: "Proteínas complejas, máx rendimiento",
    icon: "🚀",
    color: "from-orange-500 to-rose-500",
    border: "border-orange-400",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    gpus: 4,
    cpus: 32,
    memory_gb: 128,
    max_runtime_seconds: 21600,
  },
];

function formatTime(seconds) {
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  return `${(seconds / 3600).toFixed(1)} h`;
}

// ── Custom range slider with live value bubble ────────────────────────────────
function ResourceSlider({ id, label, icon: Icon, min, max, step, value, onChange, unit, color }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
          <Icon className={`w-4 h-4 ${color}`} />
          {label}
        </label>
        <span className={`text-sm font-bold tabular-nums px-2 py-0.5 rounded-lg ${color.replace('text-','bg-').replace('-500','-100')} dark:bg-slate-700 ${color}`}>
          {value}{unit}
        </span>
      </div>
      <div className="relative h-6 flex items-center">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value))}
          style={{ '--pct': `${pct}%` }}
          className="hw-slider w-full"
        />
      </div>
      <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

export default function SubmitFasta() {
  const [fastaContent, setFastaContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [activePreset, setActivePreset] = useState("standard");

  // Hardware state – default to Standard preset
  const [gpus, setGpus] = useState(1);
  const [cpus, setCpus] = useState(8);
  const [memoryGb, setMemoryGb] = useState(32);
  const [maxRuntime, setMaxRuntime] = useState(3600);

  const applyPreset = (preset) => {
    setActivePreset(preset.id);
    setGpus(preset.gpus);
    setCpus(preset.cpus);
    setMemoryGb(preset.memory_gb);
    setMaxRuntime(preset.max_runtime_seconds);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fastaContent.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    setSubmitted(false);

    try {
      const cleanFasta = fastaContent.replace(/\\n/g, '\n');

      const response = await fetch("https://api-mock-cesga.onrender.com/jobs/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "accept": "application/json",
        },
        body: JSON.stringify({
          fasta_sequence: cleanFasta,
          fasta_filename: "sequence.fasta",
          gpus: gpus,
          cpus: cpus,
          memory_gb: memoryGb,
          max_runtime_seconds: maxRuntime,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        let msg = "Error desconocido al procesar la secuencia";
        if (data.detail) {
          msg = Array.isArray(data.detail) ? data.detail[0].msg : data.detail;
        }
        throw new Error(msg);
      }

      const lines = cleanFasta.split('\n');
      let name = "Secuencia Nueva";
      if (lines[0].startsWith('>')) {
        name = lines[0].substring(1, 30) + (lines[0].length > 30 ? "..." : "");
      }

      if (auth.currentUser) {
        await addDoc(collection(db, "jobs"), {
          userId: auth.currentUser.uid,
          cesgaJobId: data.job_id,
          proteinName: name,
          status: data.status || "PENDING",
          createdAt: serverTimestamp(),
          fastaContent: cleanFasta,
          hardware: { gpus, cpus, memory_gb: memoryGb, max_runtime_seconds: maxRuntime },
        });
        console.log("Trabajo guardado en Firestore ✅");
      }

      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 4000);
      setFastaContent("");
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setFastaContent(ev.target.result);
      reader.readAsText(file);
    }
  };

  return (
    <>
      {/* ── Global slider styles injected once ── */}
      <style>{`
        .hw-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 9999px;
          background: linear-gradient(
            to right,
            #6366f1 0%,
            #6366f1 var(--pct, 0%),
            #e2e8f0 var(--pct, 0%),
            #e2e8f0 100%
          );
          outline: none;
          cursor: pointer;
          transition: background 0.15s;
        }
        .dark .hw-slider {
          background: linear-gradient(
            to right,
            #818cf8 0%,
            #818cf8 var(--pct, 0%),
            #334155 var(--pct, 0%),
            #334155 100%
          );
        }
        .hw-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          background: #6366f1;
          border: 2.5px solid white;
          box-shadow: 0 1px 4px rgba(99,102,241,0.5);
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .hw-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 2px 8px rgba(99,102,241,0.6);
        }
        .hw-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          background: #6366f1;
          border: 2.5px solid white;
          box-shadow: 0 1px 4px rgba(99,102,241,0.5);
          cursor: pointer;
        }
      `}</style>

      <div className="max-w-4xl mx-auto p-8 w-full">
        {/* ── Header ── */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Nueva Predicción de Estructura
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Introduce tu secuencia FASTA y configura los recursos del clúster CESGA para la predicción 3D con AlphaFold.
          </p>
        </div>

        {/* ── Error banner ── */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="font-medium text-sm">Error en la API: {errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* ── FASTA input ── */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Secuencia FASTA
              </label>
              <textarea
                value={fastaContent}
                onChange={(e) => setFastaContent(e.target.value)}
                placeholder={">sp|P02769|ALBU_BOVIN Serum albumin OS=Bos taurus OX=9913\nMKWVTFISLLLLFSSAYSRGVFRR..."}
                className="w-full h-52 p-4 font-mono text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-slate-200 resize-none transition-all"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-center mt-4">
              <div className="relative w-full sm:w-auto">
                <input type="file" accept=".txt,.fasta,.fa" onChange={handleFileUpload} id="file-upload" className="hidden" />
                <label
                  htmlFor="file-upload"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-400 font-medium text-sm hover:border-primary-500 hover:text-primary-600 dark:hover:border-primary-500 dark:hover:text-primary-400 cursor-pointer transition-colors"
                >
                  <UploadCloud className="w-4 h-4" />
                  Cargar fichero .fasta
                </label>
              </div>
            </div>
          </div>

          {/* ── Hardware Config ── */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Section header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
              <Gauge className="w-5 h-5 text-primary-500" />
              <h2 className="font-bold text-slate-800 dark:text-white text-base">Recursos de Hardware</h2>
              <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">Clúster CESGA · Slurm</span>
            </div>

            <div className="p-6 flex flex-col gap-6">

              {/* ── Preset cards ── */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
                  Presets rápidos
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {PRESETS.map((preset) => {
                    const isActive = activePreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className={`
                          relative flex flex-col gap-1 p-4 rounded-xl border-2 text-left
                          transition-all duration-200 cursor-pointer select-none
                          ${isActive
                            ? `${preset.border} ${preset.bg} shadow-md`
                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm"
                          }
                        `}
                      >
                        {isActive && (
                          <span className={`absolute top-3 right-3 w-2 h-2 rounded-full bg-gradient-to-br ${preset.color} shadow-sm`} />
                        )}
                        <span className="text-xl">{preset.icon}</span>
                        <span className={`font-bold text-sm ${isActive ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"}`}>
                          {preset.label}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{preset.description}</span>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {preset.gpus} GPU{preset.gpus !== 1 ? "s" : ""}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {preset.cpus} CPUs
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {preset.memory_gb} GB RAM
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Divider ── */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700" />
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">o ajusta manualmente</span>
                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700" />
              </div>

              {/* ── Sliders grid ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                <ResourceSlider
                  id="slider-gpus"
                  label="GPUs (aceleradoras)"
                  icon={Zap}
                  min={0} max={4} step={1}
                  value={gpus} onChange={(v) => { setGpus(v); setActivePreset(null); }}
                  unit="" color="text-yellow-500"
                />
                <ResourceSlider
                  id="slider-cpus"
                  label="Núcleos de CPU"
                  icon={Cpu}
                  min={1} max={64} step={1}
                  value={cpus} onChange={(v) => { setCpus(v); setActivePreset(null); }}
                  unit=" cores" color="text-sky-500"
                />
                <ResourceSlider
                  id="slider-memory"
                  label="Memoria RAM"
                  icon={MemoryStick}
                  min={4} max={256} step={4}
                  value={memoryGb} onChange={(v) => { setMemoryGb(v); setActivePreset(null); }}
                  unit=" GB" color="text-violet-500"
                />
                <ResourceSlider
                  id="slider-runtime"
                  label="Tiempo máximo"
                  icon={Timer}
                  min={60} max={86400} step={60}
                  value={maxRuntime} onChange={(v) => { setMaxRuntime(v); setActivePreset(null); }}
                  unit="s" color="text-rose-500"
                />
              </div>

              {/* ── Summary bar ── */}
              <div className="mt-1 p-4 rounded-xl bg-gradient-to-r from-primary-50 to-violet-50 dark:from-primary-900/20 dark:to-violet-900/20 border border-primary-100 dark:border-primary-800">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary-600 dark:text-primary-400 mb-3">
                  Resumen del job
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  {[
                    { label: "GPUs", value: gpus, icon: "⚡" },
                    { label: "CPUs", value: `${cpus} cores`, icon: "🖥️" },
                    { label: "RAM", value: `${memoryGb} GB`, icon: "💾" },
                    { label: "Límite", value: formatTime(maxRuntime), icon: "⏱️" },
                  ].map(({ label, value, icon }) => (
                    <div key={label} className="flex flex-col items-center gap-0.5">
                      <span className="text-lg">{icon}</span>
                      <span className="text-base font-bold text-slate-800 dark:text-white tabular-nums">{value}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
                    </div>
                  ))}
                </div>
                {gpus === 0 && (
                  <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    Sin GPU seleccionada, la predicción puede tardar varias horas. Considera añadir al menos 1 GPU.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Submit button ── */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !fastaContent.trim()}
              className="px-10 py-3.5 bg-gradient-to-r from-primary-600 to-violet-600 hover:from-primary-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold flex items-center gap-2.5 transition-all shadow-lg hover:shadow-primary-500/30 hover:shadow-xl"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enviando al clúster...
                </>
              ) : submitted ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  ¡Job encolado!
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Ejecutar AlphaFold
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* ── Info footer ── */}
        <div className="mt-6 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 text-primary-800 dark:text-primary-300 rounded-xl text-sm leading-relaxed">
          <strong>Conectado a la API Simuladora:</strong> Una vez envíes la secuencia, ve a la pestaña{" "}
          <strong>Mis Trabajos</strong> para consultar en tiempo real el estado en la cola del clúster (PENDING,
          RUNNING...). Nota: La API puede tardar 20-30&nbsp;s en despertar si estaba dormida.
        </div>
      </div>
    </>
  );
}


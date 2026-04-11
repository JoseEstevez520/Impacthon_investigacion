import { useState, useEffect } from "react";
import { UploadCloud, CheckCircle2, AlertTriangle, FlaskConical, Dna, ArrowRight, FolderOpen } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { db, auth } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";

const PROTEIN_SAMPLES = [
  {
    name: "Ubiquitina",
    tag: "UBQ",
    fasta: `>sp|P0CG48|UBC_HUMAN Polyubiquitin-C OS=Homo sapiens
MQIFVKTLTGKTITLEVEPSDTIENVKAKIQDKEGIPPDQQRLIFAGKQLEDGRTLSDYNIQKESTLHLVLRLRGG`
  },
  {
    name: "GFP",
    tag: "GFP",
    fasta: `>sp|P42212|GFP_AEQVI Green fluorescent protein OS=Aequorea victoria
MSKGEELFTGVVPILVELDGDVNGHKFSVSGEGEGDATYGKLTLKFICTTGKLPVPWPTLVTTLTYGVQCFSRYPDHMKQHDFFKSAMPEGYVQERTIFFKDDGNYKTRAEVKFEGDTLVNRIELKGIDFKEDGNILGHKLEYNYNSHNVYIMADKQKNGIKVNFKIRHNIEDGSVQLADHYQQNTPIGDGPVLLPDNHYLSTQSALSKDPNEKRDHMVLLEFVTAAGITLGMDELYK`
  },
  {
    name: "p53",
    tag: "P53",
    fasta: `>sp|P04637|P53_HUMAN Cellular tumor antigen p53 OS=Homo sapiens
MEEPQSDPSVEPPLSQETFSDLWKLLPENNVLSPLPSQAMDDLMLSPDDIEQWFTEDPGPDEAPRMPEAAPPVAPAPAAPTPAAPAPAPSWPLSSSVPSQKTYPQGLNGTVNLFRNLNSSSSPQPKKKPLDGEYFTLQIRGRERFEMFRELNEALELKDAHATEESGDSRAHSSYLKTKKGQSTSRHKKLMFKTEGPDSD`
  },
  {
    name: "SOD1",
    tag: "SOD1",
    fasta: `>sp|P00441|SODC_HUMAN Superoxide dismutase [Cu-Zn] OS=Homo sapiens
MATKAVCVLKGDGPVQGIINFEQKESNGPVKVWGSIKGLTEGLHGFHVHEFGDNTAGCTSAGPHFNPLSRKHGGPKDEERHVGDLGNVTADKDGVADVSIEDSVISLSGDHCIIGRTLVVHEKADDLGKGGNEESTKTGNAGSRLACGVIGIAQ`
  },
  {
    name: "Insulina",
    tag: "INS",
    fasta: `>sp|P01308|INS_HUMAN Insulin OS=Homo sapiens
MALWMRLLPLLALLALWGPDPAAAFVNQHLCGSHLVEALYLVCGERGFFYTPKTRREAEDLQVGQVELGGGPGAGSLQPLALEGSLQKRGIVEQCCTSICSLYQLENYCN`
  },
];

/** Extrae un nombre legible del header FASTA.
 *  - UniProt:  >sp|P00441|SODC_HUMAN Superoxide dismutase OS=Homo sapiens → "Superoxide dismutase"
 *  - NCBI:     >gi|12345|ref|NP_123.1| Protein name [Homo sapiens]       → "Protein name"
 *  - Simple:   >My protein                                                → "My protein"
 */
function parseFastaName(header) {
  if (!header.startsWith(">")) return "Secuencia nueva";
  const raw = header.slice(1).trim();

  // UniProt: >sp|ACC|ENTRY_NAME description OS=...
  const uniprotMatch = raw.match(/^(?:sp|tr|ref)\|[^|]+\|[^\s]+\s+(.+?)(?:\s+OS=.*)?$/);
  if (uniprotMatch) return uniprotMatch[1].trim();

  // NCBI gi: >gi|...|...|id| description [organism]
  const ncbiMatch = raw.match(/^(?:gi\|\d+\|[^|]*\|[^|]+\|)\s*(.+?)(?:\s+\[.+\])?$/);
  if (ncbiMatch) return ncbiMatch[1].trim();

  // Cualquier pipe: descartar todo hasta el último pipe y usar el resto
  if (raw.includes("|")) {
    const afterLastPipe = raw.split("|").pop().trim();
    const desc = afterLastPipe.split(/\s+OS=/)[0].trim();
    if (desc.length > 2) return desc.length > 60 ? desc.slice(0, 60) + "…" : desc;
  }

  // Header simple — usar como está
  return raw.length > 60 ? raw.slice(0, 60) + "…" : raw;
}

export default function SubmitFasta() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || null;
  const [projectName, setProjectName] = useState(null);
  const [fastaContent, setFastaContent] = useState("");
  const [customName, setCustomName] = useState("");

  /* Load project name if coming from a project */
  useEffect(() => {
    if (!projectId) return;
    getDoc(doc(db, "projects", projectId)).then((snap) => {
      if (snap.exists()) setProjectName(snap.data().name);
    });
  }, [projectId]);
  const [activeChip, setActiveChip] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const [resourcePreset, setResourcePreset] = useState("Alta");
  const [customResources, setCustomResources] = useState({ cpu: "", gpu: "", memory: "", runtime: "" });
  
  const [jobStatus, setJobStatus] = useState(null);
  const [jobOutputs, setJobOutputs] = useState(null);
  const [jobAccounting, setJobAccounting] = useState(null);

  const PRESET_RESOURCES = {
    Alta: { cpu: 16, gpu: 80, mem: 64, runtime: 7200, res: "Alta", note: "Mayor fiabilidad = mayor precisión estructural, pero requiere más tiempo de cómputo y recursos de GPU." },
    Intermedia: { cpu: 8, gpu: 40, mem: 32, runtime: 3600, res: "Media", note: "Equilibrio ideal entre velocidad de procesamiento y precisión de la estructura final." },
    Baja: { cpu: 4, gpu: 16, mem: 16, runtime: 1200, res: "Baja", note: "Resultados más rápidos, pero la resolución 3D será menor y los datos pueden ser difusos." },
  };

  const handleChipClick = (protein) => {
    if (activeChip === protein.tag) {
      setFastaContent("");
      setCustomName("");
      setActiveChip(null);
    } else {
      setFastaContent(protein.fasta);
      setCustomName(protein.name);
      setActiveChip(protein.tag);
    }
  };

  const handleTextareaChange = (e) => {
    setFastaContent(e.target.value);
    setActiveChip(null);
  };

  useEffect(() => {
    let intervalId;
    if (jobStatus && (jobStatus.status === "PENDING" || jobStatus.status === "RUNNING")) {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`https://api-mock-cesga.onrender.com/jobs/${jobStatus.id}/status`);
          const data = await res.json();
          setJobStatus(prev => ({ ...prev, status: data.status, error: data.error_message }));
        } catch (e) {
          console.error(e);
        }
      }, 2000);
    }
    return () => clearInterval(intervalId);
  }, [jobStatus]);

  useEffect(() => {
    if (jobStatus?.status === "COMPLETED" && !jobOutputs) {
      Promise.all([
        fetch(`https://api-mock-cesga.onrender.com/jobs/${jobStatus.id}/outputs`).then(r => r.json()),
        fetch(`https://api-mock-cesga.onrender.com/jobs/${jobStatus.id}/accounting`).then(r => r.json())
      ]).then(([outputs, accounting]) => {
        setJobOutputs(outputs);
        setJobAccounting(accounting);
      }).catch(e => console.error(e));
    }
  }, [jobStatus, jobOutputs]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fastaContent.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    setSubmitted(false);
    setJobStatus(null);
    setJobOutputs(null);
    setJobAccounting(null);

    try {
      const cleanFasta = fastaContent.replace(/\\n/g, "\n");
      const lines = cleanFasta.split("\n");

      let gpus, cpus, memory_gb, max_runtime_seconds;
      if (resourcePreset === 'Personalizado') {
         // La API solo acepta gpus entere 0 y 4 (es el contaje, no los GB). Asumimos 1 GPU por defecto.
         gpus = 1;
         cpus = parseInt(customResources.cpu) || 8;
         memory_gb = parseFloat(customResources.memory) || 32.0;
         max_runtime_seconds = parseInt(customResources.runtime) || 3600;
      } else {
         gpus = 1;
         cpus = parseInt(PRESET_RESOURCES[resourcePreset].cpu);
         memory_gb = parseFloat(PRESET_RESOURCES[resourcePreset].mem);
         max_runtime_seconds = parseInt(PRESET_RESOURCES[resourcePreset].runtime);
      }

      const response = await fetch("https://api-mock-cesga.onrender.com/jobs/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", accept: "application/json" },
        body: JSON.stringify({ 
          fasta_sequence: cleanFasta, 
          fasta_filename: customName.trim() || "proteina.fasta",
          gpus,
          cpus,
          memory_gb,
          max_runtime_seconds
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        let msg = "Error desconocido al procesar la secuencia";
        if (data.detail) msg = Array.isArray(data.detail) ? data.detail[0].msg : data.detail;
        throw new Error(msg);
      }

      const autoName = lines[0].startsWith(">") ? parseFastaName(lines[0]) : "Secuencia nueva";
      const name = customName.trim() || autoName;

      if (auth.currentUser) {
        await addDoc(collection(db, "jobs"), {
          userId: auth.currentUser.uid,
          cesgaJobId: data.job_id,
          proteinName: name,
          status: data.status || "PENDING",
          createdAt: serverTimestamp(),
          fastaContent: cleanFasta,
          ...(projectId ? { projectId } : {}),
        });
      }

      setSubmitted(true);
      setJobStatus({ id: data.job_id, status: data.status || "PENDING" });
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
      setActiveChip(null);
    }
  };

  const lineCount = fastaContent ? fastaContent.split("\n").length : 0;
  const aaCount = fastaContent
    ? fastaContent.split("\n").filter((l) => !l.startsWith(">")).join("").replace(/\s/g, "").length
    : 0;

  return (
    <div className="max-w-4xl mx-auto px-5 py-8 w-full">

      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Nueva predicción</h1>
          {projectName && (
            <div className="flex items-center gap-1.5 mt-1">
              <FolderOpen className="w-3.5 h-3.5 text-primary-500" />
              <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">{projectName}</span>
            </div>
          )}
        </div>
        <button
          onClick={() => navigate(projectId ? `/app/projects/${projectId}` : "/app/jobs")}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          {projectId ? "← Proyecto" : "Mis trabajos"}
          {!projectId && <ArrowRight className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Error banner */}
      {errorMsg && (
        <div className="mb-4 flex items-center gap-2.5 px-4 py-3 rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Success banner */}
      {submitted && (
        <div className="mb-4 flex items-center gap-2.5 px-4 py-3 rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Secuencia enviada. Ve a <button onClick={() => navigate(projectId ? `/app/projects/${projectId}` : "/app/jobs")} className="underline font-medium mx-1">{projectId ? "el proyecto" : "Mis trabajos"}</button> para seguir el progreso.
        </div>
      )}

      {/* Main panel */}
      <form onSubmit={handleSubmit}>
        <div className="rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden">

          {/* Sample proteins */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60">
            <div className="flex items-center gap-2 mb-2.5">
              <FlaskConical className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Proteínas de ejemplo
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PROTEIN_SAMPLES.map((protein) => (
                <button
                  key={protein.tag}
                  type="button"
                  onClick={() => handleChipClick(protein)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
                    activeChip === protein.tag
                      ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400"
                      : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  <span className="font-mono text-[10px] opacity-60">{protein.tag}</span>
                  {protein.name}
                  {activeChip === protein.tag && <CheckCircle2 className="w-3 h-3" />}
                </button>
              ))}
            </div>
          </div>

          {/* Nombre personalizado */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">Nombre</label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={
                fastaContent
                  ? parseFastaName(fastaContent.split("\n")[0]) + " (autodetectado)"
                  : "Opcional — se extrae del header FASTA"
              }
              className="flex-1 text-sm bg-transparent border-none outline-none text-slate-800 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600"
            />
          </div>

          {/* FASTA textarea */}
          <div className="relative">
            <textarea
              value={fastaContent}
              onChange={handleTextareaChange}
              placeholder={">sp|P02769|ALBU_BOVIN Serum albumin OS=Bos taurus\nMKWVTFISLLLLFSSAYSRGVFRR..."}
              rows={12}
              className="w-full px-4 py-3 font-mono text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500/40 border-none"
            />
            {fastaContent && (
              <div className="absolute bottom-3 right-3 flex items-center gap-2 pointer-events-none">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500">
                  {aaCount} aa · {lineCount} líneas
                </span>
              </div>
            )}
          </div>

          {/* Recursos de cómputo */}
          <div className="px-4 py-5 bg-[#0f1117] border-t border-[#1e2535]">
            <h3 className="text-[11px] font-semibold text-[#64748b] tracking-[0.08em] uppercase mb-3">
              Recursos de cómputo
            </h3>

            {/* Preset Selector */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {['Alta', 'Intermedia', 'Baja', 'Personalizado'].map((preset) => {
                const isSelected = resourcePreset === preset;
                let label = preset;
                if (preset === 'Alta') label = 'Alta fiabilidad';
                if (preset === 'Baja') label = 'Baja fiabilidad';

                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setResourcePreset(preset)}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ease-in-out border outline-none ${
                      isSelected
                        ? "border-[#2dd4bf] text-[#2dd4bf] bg-[rgba(45,212,191,0.07)]"
                        : "border-[#2a2f3e] text-[#94a3b8] hover:border-slate-600"
                    }`}
                  >
                    {label}
                    {preset === 'Alta' && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-bold ${
                        isSelected ? "bg-[#2dd4bf]/20 text-[#2dd4bf]" : "bg-slate-800 text-slate-400"
                      }`}>
                        Recomendado
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Preset Info / Custom Form */}
            {resourcePreset !== 'Personalizado' ? (
              <div>
                <div className="bg-[#161b27] border border-[#1e2535] rounded-[10px] py-[14px] px-[18px] flex flex-wrap lg:flex-nowrap items-center justify-between gap-4">
                  {[
                    { label: "CPU", value: `${PRESET_RESOURCES[resourcePreset].cpu} cores` },
                    { label: "GPU (GB)", value: `${PRESET_RESOURCES[resourcePreset].gpu} GB` },
                    { label: "Memoria", value: `${PRESET_RESOURCES[resourcePreset].mem} GB` },
                    { label: "Max runtime", value: `${PRESET_RESOURCES[resourcePreset].runtime} s` },
                    { label: "Resolución 3D", value: PRESET_RESOURCES[resourcePreset].res }
                  ].map((field, idx) => (
                    <div key={idx} className="flex flex-col gap-1">
                      <span className="text-[11px] text-[#4b5563] uppercase font-medium">{field.label}</span>
                      <span className="text-[14px] font-medium text-[#cbd5e1]">{field.value}</span>
                    </div>
                  ))}
                </div>
                {PRESET_RESOURCES[resourcePreset].note && (
                  <p className="mt-2 text-[12px] text-[#4b5872]">
                    {PRESET_RESOURCES[resourcePreset].note}
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-[#161b27] border border-[#1e2535] rounded-[10px] p-4">
                <div className="grid grid-cols-2 lg:flex lg:flex-row gap-4 mb-3">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-[11px] text-[#4b5563] uppercase font-medium">CPU (cores)</label>
                    <input
                      type="number"
                      placeholder="8"
                      value={customResources.cpu}
                      onChange={(e) => setCustomResources({ ...customResources, cpu: e.target.value })}
                      className="bg-[#0f1117] border border-[#2a2f3e] focus:border-[#3b82f6] rounded-[6px] px-3 py-1.5 text-sm outline-none text-[#cbd5e1] placeholder:text-[#4b5563] transition-colors duration-150"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-[11px] text-[#4b5563] uppercase font-medium">GPU (GB)</label>
                    <input
                      type="number"
                      placeholder="40"
                      value={customResources.gpu}
                      onChange={(e) => setCustomResources({ ...customResources, gpu: e.target.value })}
                      className="bg-[#0f1117] border border-[#2a2f3e] focus:border-[#3b82f6] rounded-[6px] px-3 py-1.5 text-sm outline-none text-[#cbd5e1] placeholder:text-[#4b5563] transition-colors duration-150"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-[11px] text-[#4b5563] uppercase font-medium">Memoria (GB)</label>
                    <input
                      type="number"
                      placeholder="32"
                      value={customResources.memory}
                      onChange={(e) => setCustomResources({ ...customResources, memory: e.target.value })}
                      className="bg-[#0f1117] border border-[#2a2f3e] focus:border-[#3b82f6] rounded-[6px] px-3 py-1.5 text-sm outline-none text-[#cbd5e1] placeholder:text-[#4b5563] transition-colors duration-150"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-[11px] text-[#4b5563] uppercase font-medium">Max runtime (s)</label>
                    <input
                      type="number"
                      placeholder="3600"
                      value={customResources.runtime}
                      onChange={(e) => setCustomResources({ ...customResources, runtime: e.target.value })}
                      className="bg-[#0f1117] border border-[#2a2f3e] focus:border-[#3b82f6] rounded-[6px] px-3 py-1.5 text-sm outline-none text-[#cbd5e1] placeholder:text-[#4b5563] transition-colors duration-150"
                    />
                  </div>
                </div>
                <div className="pt-3 border-t border-[#1e2535] text-[13px] text-[#64748b]">
                  Resumen: {customResources.cpu || "X"} cores · {customResources.gpu || "GPU"} · {customResources.memory || "Y"} GB · {customResources.runtime || "Z"} s
                </div>
              </div>
            )}
          </div>

          {/* Footer bar or Job Status */}
          {jobStatus ? (
            <div className="flex flex-col p-5 border-t border-[#1e2535] bg-[#0f1117]">
              {/* Status Indicator */}
              <div className="bg-[#161b27] border border-[#1e2535] rounded-[10px] p-4 flex flex-col items-center justify-center">
                <div className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide flex items-center gap-2 ${
                  jobStatus.status === 'PENDING' ? 'bg-amber-500/20 text-amber-500' :
                  jobStatus.status === 'RUNNING' ? 'bg-blue-500/20 text-blue-400' :
                  jobStatus.status === 'COMPLETED' ? 'bg-[#2dd4bf]/20 text-[#2dd4bf]' :
                  jobStatus.status === 'FAILED' ? 'bg-red-500/20 text-red-500' : 'bg-slate-800 text-slate-400'
                }`}>
                  {jobStatus.status === 'RUNNING' && <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />}
                  {jobStatus.status}
                </div>
                <div className="mt-2 text-[11px] text-[#64748b] font-mono tracking-widest">
                  ID: {jobStatus.id}
                </div>
              </div>

              {/* FAILED Alert */}
              {jobStatus.status === 'FAILED' && jobStatus.error && (
                <div className="mt-4 flex flex-col gap-1.5 px-4 py-3 rounded-[10px] border border-red-900/50 bg-[#161b27] text-red-400 text-sm">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <strong>Error de ejecución</strong>
                  </div>
                  <p className="text-xs text-[#94a3b8]">{jobStatus.error}</p>
                </div>
              )}

              {/* COMPLETED Summary Info */}
              {jobStatus.status === 'COMPLETED' && jobOutputs && jobAccounting && (
                <div className="mt-4 bg-[#161b27] border border-[#1e2535] rounded-[10px] p-5">
                  {/* Metadata Row */}
                  {jobOutputs.protein_metadata && (
                    <div className="mb-5 pb-4 border-b border-[#1e2535] text-[12px] text-[#64748b] flex flex-wrap gap-x-5 gap-y-2">
                      {jobOutputs.protein_metadata.name && <span><strong className="text-[#94a3b8] font-medium">Nombre:</strong> {jobOutputs.protein_metadata.name}</span>}
                      {jobOutputs.protein_metadata.uniprot_id && <span><strong className="text-[#94a3b8] font-medium">UniProt ID:</strong> {jobOutputs.protein_metadata.uniprot_id}</span>}
                      {jobOutputs.protein_metadata.pdb_id && <span><strong className="text-[#94a3b8] font-medium">PDB ID:</strong> {jobOutputs.protein_metadata.pdb_id}</span>}
                      {jobOutputs.protein_metadata.organism && <span><strong className="text-[#94a3b8] font-medium">Organismo:</strong> {jobOutputs.protein_metadata.organism}</span>}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Estructura Group */}
                    <div>
                      <h4 className="text-[11px] font-semibold text-[#64748b] tracking-[0.08em] uppercase mb-3">Estructura</h4>
                      <div className="flex flex-col gap-2.5">
                         <div className="flex justify-between items-center bg-[#0f1117] px-3 py-2 border border-[#1e2535] rounded-[6px]">
                           <span className="text-xs text-[#cbd5e1]">pLDDT medio</span>
                           <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                              jobOutputs.metrics.plddt_mean > 90 ? 'bg-[#2dd4bf]/20 text-[#2dd4bf]' :
                              jobOutputs.metrics.plddt_mean >= 70 ? 'bg-blue-500/20 text-blue-400' :
                              jobOutputs.metrics.plddt_mean >= 50 ? 'bg-amber-500/20 text-amber-500' :
                              'bg-red-500/20 text-red-500'
                           }`}>
                             {jobOutputs.metrics.plddt_mean.toFixed(1)}
                           </span>
                         </div>
                         <div className="bg-[#0f1117] px-3 py-2.5 border border-[#1e2535] rounded-[6px] flex flex-col gap-2">
                           <span className="text-xs text-[#cbd5e1]">Fracción de residuos</span>
                           <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] uppercase font-medium tracking-wider">
                             <span className="text-[#2dd4bf]">Muy Alta: {(jobOutputs.metrics.fraction_plddt_above_90 * 100).toFixed(0)}%</span>
                             <span className="text-blue-400">Alta: {(jobOutputs.metrics.fraction_plddt_70_to_90 * 100).toFixed(0)}%</span>
                             <span className="text-amber-500">Media: {(jobOutputs.metrics.fraction_plddt_50_to_70 * 100).toFixed(0)}%</span>
                             <span className="text-red-500">Baja: {(jobOutputs.metrics.fraction_plddt_below_50 * 100).toFixed(0)}%</span>
                           </div>
                         </div>
                         {jobOutputs.derived_insights && (
                           <>
                             <div className="flex justify-between items-center bg-[#0f1117] px-3 py-2 border border-[#1e2535] rounded-[6px]">
                               <span className="text-xs text-[#cbd5e1]">Solubilidad score</span>
                               <span className="text-xs text-[#94a3b8]">{jobOutputs.derived_insights.solubility_score.toFixed(2)}</span>
                             </div>
                             <div className="flex justify-between items-center bg-[#0f1117] px-3 py-2 border border-[#1e2535] rounded-[6px]">
                               <span className="text-xs text-[#cbd5e1]">Estado estabilidad</span>
                               <span className="text-xs text-[#94a3b8] capitalize">{jobOutputs.derived_insights.stability_status}</span>
                             </div>
                           </>
                         )}
                      </div>
                    </div>

                    {/* Contabilidad HPC Group */}
                    <div>
                      <h4 className="text-[11px] font-semibold text-[#64748b] tracking-[0.08em] uppercase mb-3">Contabilidad HPC</h4>
                      <div className="flex flex-col gap-2.5">
                         <div className="flex justify-between items-center bg-[#0f1117] px-3 py-2 border border-[#1e2535] rounded-[6px]">
                           <span className="text-xs text-[#cbd5e1]">CPU Hours</span>
                           <span className="text-xs text-[#94a3b8]">{jobAccounting.cpu_hours.toFixed(2)} h</span>
                         </div>
                         <div className="flex justify-between items-center bg-[#0f1117] px-3 py-2 border border-[#1e2535] rounded-[6px]">
                           <span className="text-xs text-[#cbd5e1]">GPU Hours</span>
                           <span className="text-xs text-[#94a3b8]">{jobAccounting.gpu_hours.toFixed(2)} h</span>
                         </div>
                         <div className="flex justify-between items-center bg-[#0f1117] px-3 py-2 border border-[#1e2535] rounded-[6px]">
                           <span className="text-xs text-[#cbd5e1]">Wall Time</span>
                           <span className="text-xs text-[#94a3b8]">{jobAccounting.wall_time_seconds} s</span>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-[#1e2535] bg-[#0f1117]">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".txt,.fasta,.fa"
                  onChange={handleFileUpload}
                  id="file-upload"
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer transition-colors"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  Cargar .fasta
                </label>

                <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block">
                  Formatos aceptados: .fasta, .fa, .txt
                </span>
              </div>

              <div className="flex flex-col items-end gap-1.5">
                <button
                  type="submit"
                  disabled={isSubmitting || !fastaContent.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold rounded-md bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Enviando…
                    </>
                  ) : (
                    <>
                      <Dna className="w-3.5 h-3.5" />
                      Ejecutar AlphaFold
                    </>
                  )}
                </button>
                {isSubmitting && (
                  <span className="text-[11px] text-[#64748b] italic">
                    La API puede tardar hasta 30 s en responder si llevaba inactiva.
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Info footer */}
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
        La secuencia se enviará al clúster <strong className="text-slate-500 dark:text-slate-400">CESGA FinisTerrae III</strong> para predicción con AlphaFold 2. La API puede tardar 20–30 s en responder si estaba inactiva.
      </p>
    </div>
  );
}

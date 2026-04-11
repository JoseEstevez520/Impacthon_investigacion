/**
 * Servicio de conexión con los orquestadores de IA en n8n
 */

const N8N_CHAT_URL = "https://n8n-n8n.yaqvsc.easypanel.host/webhook/protein-chat";
const N8N_SUMMARY_URL = "https://n8n-n8n.yaqvsc.easypanel.host/webhook/protein-summary";

/**
 * Extrae solo los campos relevantes para el análisis IA.
 * IMPORTANTE: excluye pdbFileUrl y paeMatrix para no superar el límite de tokens del LLM.
 */
function buildMetricsPayload(statusData) {
  if (!statusData) return {};
  return {
    name: statusData.name || null,
    plddt: statusData.plddt || null,
    organism: statusData.organism || null,
    uniprot: statusData.uniprot || null,
    biological: statusData.biological
      ? {
          solubility_score: statusData.biological.solubility_score ?? null,
          solubility_prediction: statusData.biological.solubility_prediction ?? null,
          instability_index: statusData.biological.instability_index ?? null,
          stability_status: statusData.biological.stability_status ?? null,
          toxicity_alerts: statusData.biological.toxicity_alerts ?? [],
          allergenicity_alerts: statusData.biological.allergenicity_alerts ?? [],
          secondary_structure_prediction: statusData.biological.secondary_structure_prediction ?? null,
          sequence_properties: statusData.biological.sequence_properties ?? null,
        }
      : null,
    plddtHistogram: statusData.plddtHistogram || null,
    // pdbFileUrl y paeMatrix se excluyen deliberadamente — son demasiado grandes para el LLM
  };
}

export const copilotApi = {
  /**
   * Obtiene un resumen inicial de la proteína analizada
   */
  async getInitialSummary(jobId, proteinName, statusData) {
    try {
      const response = await fetch(N8N_SUMMARY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: jobId,
          protein_name: proteinName,
          metrics: buildMetricsPayload(statusData)
        })
      });
      if (!response.ok) throw new Error("Error en el resumen de n8n");
      const data = await response.json();
      return data.output || data.response || "No se pudo generar un resumen automático.";
    } catch (error) {
      console.error("Copilot Summary Error:", error);
      return "Hubo un problema al conectar con el Asistente de IA.";
    }
  },

  /**
   * Envía un mensaje al chat interactivo
   * @param {string} jobId - ID del trabajo del CESGA
   * @param {string} message - Pregunta del usuario
   * @param {Array} chatHistory - Historial de la sesión
   * @param {Object} proteinContext - Datos de la proteína (nombre, pLDDT, etc.)
   */
  async sendChatMessage(jobId, message, chatHistory = [], proteinContext = {}) {
    try {
      const response = await fetch(N8N_CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: `job_${jobId}`,
          chatInput: message,
          history: chatHistory,
          // Contexto de la proteína para que el LLM sepa de qué estamos hablando
          protein_context: {
            job_id: jobId,
            protein_name: proteinContext.name || "Proteína desconocida",
            plddt: proteinContext.plddt || null,
            organism: proteinContext.organism || null,
            uniprot: proteinContext.uniprot || null,
            solubility: proteinContext.biological?.solubility_score || null,
            instability: proteinContext.biological?.instability_index || null,
            toxicity_alerts: proteinContext.biological?.toxicity_alerts || [],
            secondary_structure: proteinContext.biological?.secondary_structure_prediction || null,
            sequence_properties: proteinContext.biological?.sequence_properties || null,
          }
        })
      });
      if (!response.ok) throw new Error("Error en el chat de n8n");
      const data = await response.json();
      return data.output || data.response || "Mmm, no estoy seguro de cómo responder a eso.";
    } catch (error) {
      console.error("Copilot Chat Error:", error);
      return "Lo siento, la conexión con mi cerebro de IA se ha interrumpido.";
    }
  }
};

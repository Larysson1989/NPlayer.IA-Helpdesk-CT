/**
 * Utility to parse Gemini API errors into user-friendly messages.
 */
export function parseGeminiError(error: any): string {
  console.error("Gemini API Error:", error);

  const rawMessage: string = error?.message ?? '';

  if (rawMessage.includes("API key not valid")) {
    return "Erro: Chave de API inválida. Verifique suas configurações.";
  }

  // 429 - Too Many Requests / RESOURCE_EXHAUSTED
  if (rawMessage.includes("RESOURCE_EXHAUSTED") || error?.status === 429 || error?.code === 429) {
    // Créditos pré-pagos esgotados / billing — não vai se resolver "tentando de novo"
    if (rawMessage.includes("prepayment credits") || rawMessage.includes("billing")) {
      return "O assistente está temporariamente indisponível por uma questão administrativa do sistema. Nossa equipe técnica já foi notificada. Por favor, tente novamente mais tarde ou contate o suporte.";
    }

    // Rate limit "comum" (requisições por minuto/dia) — esse sim pode se resolver com espera
    if (rawMessage.includes("quota exceeded") || rawMessage.includes("rate limit")) {
      return "Estamos com alta demanda no momento. Aguarde um instante e tente novamente.";
    }

    // 429 genérico sem detalhes — trata como indisponibilidade temporária
    return "O assistente está temporariamente indisponível. Por favor, tente novamente em alguns minutos.";
  }

  if (rawMessage.includes("safety") || error?.finishReason === "SAFETY") {
    return "Desculpe, não posso responder a isso por questões de segurança.";
  }

  return "Ocorreu um erro ao processar sua solicitação. Tente novamente.";
}
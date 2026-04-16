/**
 * Utility to parse Gemini API errors into user-friendly messages.
 */
export function parseGeminiError(error: any): string {
  console.error("Gemini API Error:", error);
  
  if (error?.message?.includes("API key not valid")) {
    return "Erro: Chave de API inválida. Verifique suas configurações.";
  }
  
  if (error?.message?.includes("quota exceeded") || error?.status === 429) {
    return "Limite de mensagens atingido. Por favor, tente novamente mais tarde.";
  }

  if (error?.message?.includes("safety") || error?.finishReason === "SAFETY") {
    return "Desculpe, não posso responder a isso por questões de segurança.";
  }

  return "Ocorreu um erro ao processar sua solicitação. Tente novamente.";
}

export const STATUS_LABELS: Record<string, string> = {
  pedido_recebido: "Pedido Recebido",
  pedido_confirmado: "Pedido Confirmado",
  em_processamento: "Em Processamento",
  separacao: "Separação de Mercadoria",
  em_transporte: "Em Transporte",
  em_rota: "Em Rota de Entrega",
  proximo_entrega: "Próximo da Entrega",
  entregue: "Entregue",
  atrasado: "Atrasado",
  reagendado: "Reagendado",
};

export const STATUS_KEYS = Object.keys(STATUS_LABELS);

export function statusCor(s: string): string {
  switch (s) {
    case "entregue": return "bg-emerald-100 text-emerald-700";
    case "atrasado": return "bg-red-100 text-red-700";
    case "reagendado": return "bg-amber-100 text-amber-700";
    case "em_rota":
    case "proximo_entrega": return "bg-indigo-100 text-indigo-700";
    default: return "bg-blue-100 text-blue-700";
  }
}

export const STATUS_ICONE: Record<string, string> = {
  pedido_recebido: "📥", pedido_confirmado: "✅", em_processamento: "⚙️",
  separacao: "📦", em_transporte: "🚛", em_rota: "🚚",
  proximo_entrega: "📍", entregue: "🎉", atrasado: "⚠️", reagendado: "📅",
};

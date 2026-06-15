export const STATUS = {
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
} as const;

export type StatusKey = keyof typeof STATUS;

export const FLUXO: StatusKey[] = [
  "pedido_recebido", "pedido_confirmado", "em_processamento", "separacao",
  "em_transporte", "em_rota", "proximo_entrega", "entregue",
];

export function isStatusValido(s: string): s is StatusKey {
  return Object.prototype.hasOwnProperty.call(STATUS, s);
}

export function progressoPercentual(status: StatusKey): number {
  if (status === "entregue") return 100;
  const idx = FLUXO.indexOf(status);
  if (idx < 0) return 10;
  return Math.round((idx / (FLUXO.length - 1)) * 100);
}

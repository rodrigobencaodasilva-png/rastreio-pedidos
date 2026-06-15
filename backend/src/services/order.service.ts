import { query } from "../db/pool";
import { STATUS, StatusKey, FLUXO, progressoPercentual } from "../utils/statuses";
import { adicionarHorasUteis, horasUteisRestantes } from "../utils/businessHours";
import { formatarDocumento } from "../utils/documento";

export async function recalcularPrazo(pedidoId: string) {
  const r = await query(`SELECT data_confirmacao, prazo_horas_uteis FROM pedidos WHERE id=$1`, [pedidoId]);
  const p = r.rows[0];
  if (!p?.data_confirmacao) return null;
  const prevista = adicionarHorasUteis(new Date(p.data_confirmacao), p.prazo_horas_uteis);
  await query(`UPDATE pedidos SET data_prevista=$1, atualizado_em=now() WHERE id=$2`, [prevista, pedidoId]);
  return prevista;
}

export async function detalharPedido(where: string, param: any) {
  const r = await query(`
    SELECT p.*, c.nome AS cliente_nome, c.documento, c.tipo_doc,
           c.email, c.whatsapp, c.notif_email, c.notif_whats,
           q.codigo AS qr_codigo, q.versao AS qr_versao, q.confirmado_em AS qr_confirmado
    FROM pedidos p
    JOIN clientes c ON c.id = p.cliente_id
    LEFT JOIN qrcodes q ON q.pedido_id = p.id AND q.ativo = TRUE
    WHERE ${where} LIMIT 1`, [param]);
  if (!r.rows[0]) return null;
  const p = r.rows[0];

  const hist = await query(
    `SELECT status, descricao, criado_em FROM historico_status WHERE pedido_id=$1 ORDER BY criado_em ASC`, [p.id]);

  const statusKey = p.status as StatusKey;
  const prevista = p.data_prevista ? new Date(p.data_prevista) : null;

  return {
    id: p.id, numero: p.numero,
    cliente: {
      nome: p.cliente_nome, documento: formatarDocumento(p.documento), tipo_doc: p.tipo_doc,
      email: p.email, whatsapp: p.whatsapp, notif_email: p.notif_email, notif_whats: p.notif_whats,
    },
    produto: p.produto,
    valor: p.valor != null ? Number(p.valor) : null,
    status: statusKey,
    status_label: STATUS[statusKey] ?? p.status,
    progresso: progressoPercentual(statusKey),
    fluxo: FLUXO.map((s) => ({ status: s, label: STATUS[s] })),
    data_pedido: p.data_pedido, data_confirmacao: p.data_confirmacao,
    prazo_horas_uteis: p.prazo_horas_uteis, data_prevista: prevista,
    horas_uteis_restantes: prevista ? horasUteisRestantes(prevista) : null,
    observacoes: p.observacoes, info_adicional: p.info_adicional ?? {},
    qr: p.qr_codigo ? { codigo: p.qr_codigo, versao: p.qr_versao, confirmado_em: p.qr_confirmado } : null,
    historico: hist.rows.map((h) => ({
      status: h.status, label: STATUS[h.status as StatusKey] ?? h.status,
      descricao: h.descricao, data: h.criado_em,
    })),
  };
}

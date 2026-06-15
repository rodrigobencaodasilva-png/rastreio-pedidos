import { Response } from "express";
import { z } from "zod";
import { query, pool } from "../db/pool";
import { AuthRequest } from "../middleware/auth";
import { registrarLog } from "../middleware/audit";
import { soDigitos, tipoDocumento } from "../utils/documento";
import { isStatusValido, StatusKey } from "../utils/statuses";
import { parseFicha } from "../utils/parser";
import { gerarCodigoUnico, gerarQrDataUrl } from "../utils/qrcode";
import { detalharPedido, recalcularPrazo } from "../services/order.service";
import { notificarAtualizacao } from "../services/notification.service";
import { env } from "../config/env";

export async function previewFicha(req: AuthRequest, res: Response) {
  const texto = z.object({ texto: z.string().min(1) }).parse(req.body).texto;
  res.json(parseFicha(texto));
}

const pedidoSchema = z.object({
  nome: z.string().min(2),
  documento: z.string().min(11),
  numero: z.string().optional(),
  produto: z.string().optional(),
  valor: z.number().nonnegative().optional(),
  email: z.string().email().optional().or(z.literal("")),
  whatsapp: z.string().optional(),
  notif_email: z.boolean().optional(),
  notif_whats: z.boolean().optional(),
  observacoes: z.string().optional(),
  info_adicional: z.record(z.string()).optional(),
});

async function upsertCliente(c: any) {
  const doc = soDigitos(c.documento);
  const tipo = tipoDocumento(doc);
  if (!tipo) throw Object.assign(new Error("CPF ou CNPJ inválido"), { status: 400 });
  const r = await query(
    `INSERT INTO clientes (nome, documento, tipo_doc, email, whatsapp, notif_email, notif_whats)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (documento) DO UPDATE SET
       nome=EXCLUDED.nome,
       email=COALESCE(EXCLUDED.email, clientes.email),
       whatsapp=COALESCE(EXCLUDED.whatsapp, clientes.whatsapp),
       notif_email=EXCLUDED.notif_email, notif_whats=EXCLUDED.notif_whats, atualizado_em=now()
     RETURNING id`,
    [c.nome, doc, tipo, c.email || null, c.whatsapp ? soDigitos(c.whatsapp) : null,
     !!c.notif_email, !!c.notif_whats]);
  return r.rows[0].id;
}

export async function criarPedido(req: AuthRequest, res: Response) {
  const data = pedidoSchema.parse(req.body);
  const numero = (data.numero && data.numero.trim()) ? data.numero.trim() : ("PED-" + Date.now().toString().slice(-8));
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const clienteId = await upsertCliente(data);
    const ped = await client.query(
      `INSERT INTO pedidos (numero, cliente_id, produto, valor, status, observacoes, info_adicional)
       VALUES ($1,$2,$3,$4,'pedido_recebido',$5,$6) RETURNING id`,
      [numero, clienteId, data.produto || null, data.valor ?? null,
       data.observacoes || null, JSON.stringify(data.info_adicional ?? {})]);
    const pedidoId = ped.rows[0].id;
    await client.query(
      `INSERT INTO historico_status (pedido_id, status, descricao, admin_id)
       VALUES ($1,'pedido_recebido','Pedido cadastrado no sistema',$2)`, [pedidoId, req.admin!.id]);
    const codigo = gerarCodigoUnico(numero);
    await client.query(`INSERT INTO qrcodes (pedido_id, codigo) VALUES ($1,$2)`, [pedidoId, codigo]);
    await client.query("COMMIT");
    await registrarLog(req, "criar_pedido", "pedido", pedidoId, { numero });
    res.status(201).json({ pedido: await detalharPedido("p.id=$1", pedidoId) });
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function listarPedidos(req: AuthRequest, res: Response) {
  const busca = (req.query.busca as string) || "";
  const status = (req.query.status as string) || "";
  const params: any[] = [];
  const cond: string[] = [];
  if (busca) {
    params.push(`%${soDigitos(busca) || busca}%`, `%${busca}%`);
    cond.push(`(c.documento ILIKE $${params.length - 1} OR p.numero ILIKE $${params.length} OR c.nome ILIKE $${params.length})`);
  }
  if (status && isStatusValido(status)) { params.push(status); cond.push(`p.status = $${params.length}`); }
  const where = cond.length ? `WHERE ${cond.join(" AND ")}` : "";
  const r = await query(`
    SELECT p.id, p.numero, p.status, p.valor, p.produto, p.data_pedido, p.data_prevista,
           c.nome AS cliente_nome, c.documento, c.tipo_doc
    FROM pedidos p JOIN clientes c ON c.id=p.cliente_id
    ${where} ORDER BY p.criado_em DESC LIMIT 200`, params);
  res.json({ pedidos: r.rows });
}

export async function obterPedido(req: AuthRequest, res: Response) {
  const det = await detalharPedido("p.id=$1", req.params.id);
  if (!det) return res.status(404).json({ erro: "Pedido não encontrado" });
  res.json({ pedido: det });
}

export async function editarPedido(req: AuthRequest, res: Response) {
  const id = req.params.id;
  const data = pedidoSchema.partial().parse(req.body);
  const r = await query(`SELECT cliente_id FROM pedidos WHERE id=$1`, [id]);
  if (!r.rows[0]) return res.status(404).json({ erro: "Pedido não encontrado" });

  if (data.nome || data.email !== undefined || data.whatsapp !== undefined ||
      data.notif_email !== undefined || data.notif_whats !== undefined) {
    await query(
      `UPDATE clientes SET nome=COALESCE($1,nome), email=$2, whatsapp=$3,
        notif_email=COALESCE($4,notif_email), notif_whats=COALESCE($5,notif_whats), atualizado_em=now()
       WHERE id=$6`,
      [data.nome ?? null, data.email || null, data.whatsapp ? soDigitos(data.whatsapp) : null,
       data.notif_email ?? null, data.notif_whats ?? null, r.rows[0].cliente_id]);
  }
  await query(
    `UPDATE pedidos SET produto=COALESCE($1,produto), valor=COALESCE($2,valor),
      observacoes=COALESCE($3,observacoes), info_adicional=COALESCE($4,info_adicional), atualizado_em=now()
     WHERE id=$5`,
    [data.produto ?? null, data.valor ?? null, data.observacoes ?? null,
     data.info_adicional ? JSON.stringify(data.info_adicional) : null, id]);

  await registrarLog(req, "editar_pedido", "pedido", id);
  res.json({ pedido: await detalharPedido("p.id=$1", id) });
}

export async function excluirPedido(req: AuthRequest, res: Response) {
  const id = req.params.id;
  const r = await query(`DELETE FROM pedidos WHERE id=$1 RETURNING numero`, [id]);
  if (!r.rows[0]) return res.status(404).json({ erro: "Pedido não encontrado" });
  await registrarLog(req, "excluir_pedido", "pedido", id, { numero: r.rows[0].numero });
  res.json({ ok: true });
}

const statusSchema = z.object({ status: z.string(), descricao: z.string().optional() });

export async function alterarStatus(req: AuthRequest, res: Response) {
  const id = req.params.id;
  const { status, descricao } = statusSchema.parse(req.body);
  if (!isStatusValido(status)) return res.status(400).json({ erro: "Status inválido" });

  const atual = await query(`SELECT status, data_confirmacao FROM pedidos WHERE id=$1`, [id]);
  if (!atual.rows[0]) return res.status(404).json({ erro: "Pedido não encontrado" });

  let setConfirma = "";
  if (status === "pedido_confirmado" && !atual.rows[0].data_confirmacao) setConfirma = ", data_confirmacao=now()";
  await query(`UPDATE pedidos SET status=$1${setConfirma}, atualizado_em=now() WHERE id=$2`, [status, id]);
  if (setConfirma) await recalcularPrazo(id);

  await query(`INSERT INTO historico_status (pedido_id, status, descricao, admin_id) VALUES ($1,$2,$3,$4)`,
    [id, status, descricao || null, req.admin!.id]);
  await registrarLog(req, "alterar_status", "pedido", id, { status });
  await dispararNotificacao(id, status as StatusKey);
  res.json({ pedido: await detalharPedido("p.id=$1", id) });
}

const reagendarSchema = z.object({
  data_prevista: z.string().optional(),
  prazo_horas_uteis: z.number().int().positive().optional(),
  motivo: z.string().optional(),
  marcar_reagendado: z.boolean().optional(),
});

export async function reagendarEntrega(req: AuthRequest, res: Response) {
  const id = req.params.id;
  const d = reagendarSchema.parse(req.body);
  if (d.data_prevista) {
    await query(`UPDATE pedidos SET data_prevista=$1, atualizado_em=now() WHERE id=$2`, [new Date(d.data_prevista), id]);
  } else if (d.prazo_horas_uteis) {
    await query(`UPDATE pedidos SET prazo_horas_uteis=$1, atualizado_em=now() WHERE id=$2`, [d.prazo_horas_uteis, id]);
    await recalcularPrazo(id);
  }
  await query(`UPDATE pedidos SET status='reagendado', atualizado_em=now() WHERE id=$1`, [id]);
  await query(`INSERT INTO historico_status (pedido_id, status, descricao, admin_id) VALUES ($1,'reagendado',$2,$3)`,
    [id, d.motivo || "Entrega reagendada", req.admin!.id]);
  await registrarLog(req, "reagendar", "pedido", id, d);
  await dispararNotificacao(id, "reagendado");
  res.json({ pedido: await detalharPedido("p.id=$1", id) });
}

export async function adicionarObservacao(req: AuthRequest, res: Response) {
  const id = req.params.id;
  const texto = z.object({ texto: z.string().min(1) }).parse(req.body).texto;
  await query(`UPDATE pedidos SET observacoes=$1, atualizado_em=now() WHERE id=$2`, [texto, id]);
  await registrarLog(req, "observacao", "pedido", id);
  res.json({ pedido: await detalharPedido("p.id=$1", id) });
}

export async function obterQr(req: AuthRequest, res: Response) {
  const id = req.params.id;
  const r = await query(`SELECT codigo FROM qrcodes WHERE pedido_id=$1 AND ativo=TRUE`, [id]);
  if (!r.rows[0]) return res.status(404).json({ erro: "QR não encontrado" });
  const url = `${env.publicBaseUrl}/qr/${r.rows[0].codigo}`;
  res.json({ codigo: r.rows[0].codigo, url, dataUrl: await gerarQrDataUrl(url) });
}

export async function reemitirQr(req: AuthRequest, res: Response) {
  const id = req.params.id;
  const ped = await query(`SELECT numero FROM pedidos WHERE id=$1`, [id]);
  if (!ped.rows[0]) return res.status(404).json({ erro: "Pedido não encontrado" });
  await query(`UPDATE qrcodes SET ativo=FALSE WHERE pedido_id=$1`, [id]);
  const codigo = gerarCodigoUnico(ped.rows[0].numero);
  const last = await query(`SELECT COALESCE(MAX(versao),0)+1 AS v FROM qrcodes WHERE pedido_id=$1`, [id]);
  await query(`INSERT INTO qrcodes (pedido_id, codigo, versao) VALUES ($1,$2,$3)`, [id, codigo, last.rows[0].v]);
  await registrarLog(req, "reemitir_qr", "pedido", id);
  const url = `${env.publicBaseUrl}/qr/${codigo}`;
  res.json({ codigo, url, dataUrl: await gerarQrDataUrl(url) });
}

async function dispararNotificacao(pedidoId: string, status: StatusKey) {
  const r = await query(`
    SELECT p.numero, p.data_prevista, c.id AS cliente_id, c.nome, c.email, c.whatsapp,
           c.notif_email, c.notif_whats, q.codigo
    FROM pedidos p JOIN clientes c ON c.id=p.cliente_id
    LEFT JOIN qrcodes q ON q.pedido_id=p.id AND q.ativo=TRUE
    WHERE p.id=$1`, [pedidoId]);
  const p = r.rows[0];
  if (!p) return;
  await notificarAtualizacao({
    pedidoId, clienteId: p.cliente_id, nome: p.nome, numero: p.numero, status,
    codigo: p.codigo ?? p.numero, dataPrevista: p.data_prevista,
    email: p.email, whatsapp: p.whatsapp, notifEmail: p.notif_email, notifWhats: p.notif_whats,
  });
}

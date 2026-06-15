import { Response } from "express";
import { z } from "zod";
import { query } from "../db/pool";
import { AuthRequest } from "../middleware/auth";
import { enviarTeste } from "../services/notification.service";

export async function dashboard(_req: AuthRequest, res: Response) {
  const total = await query(`SELECT COUNT(*)::int AS n FROM pedidos`);
  const entregues = await query(`SELECT COUNT(*)::int AS n FROM pedidos WHERE status='entregue'`);
  const atrasados = await query(`SELECT COUNT(*)::int AS n FROM pedidos WHERE status='atrasado'`);
  const andamento = await query(`SELECT COUNT(*)::int AS n FROM pedidos WHERE status NOT IN ('entregue','atrasado')`);
  const porStatus = await query(`SELECT status, COUNT(*)::int AS n FROM pedidos GROUP BY status ORDER BY n DESC`);
  const porDia = await query(`
    SELECT to_char(date_trunc('day', data_pedido),'YYYY-MM-DD') AS dia, COUNT(*)::int AS n
    FROM pedidos WHERE data_pedido > now() - interval '14 days' GROUP BY 1 ORDER BY 1`);
  const notif = await query(`SELECT status_envio, COUNT(*)::int AS n FROM notificacoes GROUP BY status_envio`);

  res.json({
    cards: { total: total.rows[0].n, em_andamento: andamento.rows[0].n,
      entregues: entregues.rows[0].n, atrasados: atrasados.rows[0].n },
    por_status: porStatus.rows, por_dia: porDia.rows, notificacoes: notif.rows,
  });
}

export async function listarClientes(req: AuthRequest, res: Response) {
  const busca = (req.query.busca as string) || "";
  const r = await query(`
    SELECT c.*, COUNT(p.id)::int AS total_pedidos
    FROM clientes c LEFT JOIN pedidos p ON p.cliente_id=c.id
    ${busca ? "WHERE c.nome ILIKE $1 OR c.documento ILIKE $1" : ""}
    GROUP BY c.id ORDER BY c.criado_em DESC LIMIT 200`, busca ? [`%${busca}%`] : []);
  res.json({ clientes: r.rows });
}

export async function listarNotificacoes(req: AuthRequest, res: Response) {
  const status = (req.query.status as string) || "";
  const params: any[] = [];
  let where = "";
  if (status) { params.push(status); where = `WHERE n.status_envio=$1`; }
  const r = await query(`
    SELECT n.*, p.numero AS pedido_numero
    FROM notificacoes n LEFT JOIN pedidos p ON p.id=n.pedido_id
    ${where} ORDER BY n.criado_em DESC LIMIT 200`, params);
  const resumo = await query(`SELECT status_envio, COUNT(*)::int AS n FROM notificacoes GROUP BY status_envio`);
  res.json({ notificacoes: r.rows, resumo: resumo.rows });
}

export async function testarNotificacao(req: AuthRequest, res: Response) {
  const { canal, destino } = z.object({
    canal: z.enum(["email", "whatsapp"]), destino: z.string().min(3),
  }).parse(req.body);
  const r = await enviarTeste(canal, destino);
  res.json({ resultado: r });
}

export async function obterConfiguracoes(_req: AuthRequest, res: Response) {
  const r = await query(`SELECT chave, valor FROM configuracoes`);
  const out: Record<string, any> = {};
  for (const row of r.rows) out[row.chave] = row.valor;
  res.json({ configuracoes: out });
}

export async function salvarConfiguracao(req: AuthRequest, res: Response) {
  const { chave, valor } = z.object({ chave: z.string(), valor: z.any() }).parse(req.body);
  await query(
    `INSERT INTO configuracoes (chave, valor) VALUES ($1,$2)
     ON CONFLICT (chave) DO UPDATE SET valor=EXCLUDED.valor, atualizado_em=now()`,
    [chave, JSON.stringify(valor)]);
  res.json({ ok: true });
}

export async function listarLogs(_req: AuthRequest, res: Response) {
  const r = await query(`
    SELECT l.*, a.nome AS admin_nome FROM logs_auditoria l
    LEFT JOIN admins a ON a.id=l.admin_id ORDER BY l.criado_em DESC LIMIT 300`);
  res.json({ logs: r.rows });
}

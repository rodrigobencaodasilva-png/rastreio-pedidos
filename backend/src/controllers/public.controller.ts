import { Request, Response } from "express";
import { z } from "zod";
import { query } from "../db/pool";
import { soDigitos, tipoDocumento } from "../utils/documento";
import { detalharPedido } from "../services/order.service";

const consultaSchema = z.object({ documento: z.string().min(11) });

export async function consultarPorDocumento(req: Request, res: Response) {
  const { documento } = consultaSchema.parse(req.body);
  const doc = soDigitos(documento);
  if (!tipoDocumento(doc)) return res.status(400).json({ erro: "CPF ou CNPJ inválido" });

  const cli = await query(`SELECT id FROM clientes WHERE documento=$1`, [doc]);
  if (!cli.rows[0]) return res.status(404).json({ erro: "Nenhum cadastro encontrado para este documento" });

  const pedidos = await query(`SELECT id FROM pedidos WHERE cliente_id=$1 ORDER BY data_pedido DESC`, [cli.rows[0].id]);
  const detalhes = [];
  for (const p of pedidos.rows) detalhes.push(await detalharPedido("p.id=$1", p.id));
  if (!detalhes.length) return res.status(404).json({ erro: "Nenhum pedido encontrado" });
  res.json({ pedidos: detalhes });
}

export async function consultarPorCodigo(req: Request, res: Response) {
  const codigo = req.params.codigo;
  const q = await query(`SELECT pedido_id FROM qrcodes WHERE codigo=$1`, [codigo]);
  if (!q.rows[0]) return res.status(404).json({ erro: "Código não encontrado" });
  const det = await detalharPedido("p.id=$1", q.rows[0].pedido_id);
  res.json({ pedido: det });
}

export async function validarQr(req: Request, res: Response) {
  const codigo = req.params.codigo;
  const det = await detalharPedido("p.id = (SELECT pedido_id FROM qrcodes WHERE codigo=$1)", codigo);
  if (!det) return res.status(404).json({ erro: "QR Code inválido" });
  res.json({
    valido: true, cliente: det.cliente.nome, numero: det.numero,
    status: det.status_label, data_entrega: det.data_prevista, codigo,
  });
}

import nodemailer from "nodemailer";
import { env } from "../config/env";
import { query } from "../db/pool";
import { STATUS, StatusKey } from "../utils/statuses";

interface DadosMsg {
  nome: string; numero: string; status: string;
  dataEntrega: string; link: string; codigo: string;
}

export function montarMensagem(d: DadosMsg): string {
  return `Olá, ${d.nome}.
Seu pedido Nº ${d.numero} foi atualizado.

Status Atual:
🚚 ${d.status}

Previsão:
📅 ${d.dataEntrega}

Acompanhe seu pedido:
${d.link}

PROTOCOLO:
${d.codigo}`;
}

async function enviarEmail(destino: string, assunto: string, corpo: string) {
  if (env.notificationsMode === "mock" || !env.smtp.host) {
    return { ok: true, mock: true, info: "E-mail simulado (modo mock)" };
  }
  const transporter = nodemailer.createTransport({
    host: env.smtp.host, port: env.smtp.port, secure: env.smtp.port === 465,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
  });
  const info = await transporter.sendMail({ from: env.smtp.from, to: destino, subject: assunto, text: corpo });
  return { ok: true, mock: false, info: info.messageId };
}

async function enviarWhatsApp(destino: string, corpo: string) {
  if (env.notificationsMode === "mock" || !env.whatsapp.token) {
    return { ok: true, mock: true, info: "WhatsApp simulado (modo mock)" };
  }
  const resp = await fetch(
    `https://graph.facebook.com/v20.0/${env.whatsapp.phoneId}/messages`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${env.whatsapp.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to: destino, type: "text", text: { body: corpo } }),
    }
  );
  const json: any = await resp.json();
  if (!resp.ok) throw new Error(json?.error?.message ?? "Falha no envio WhatsApp");
  return { ok: true, mock: false, info: json?.messages?.[0]?.id ?? "enviado" };
}

interface NotificarParams {
  pedidoId: string; clienteId: string;
  nome: string; numero: string; status: StatusKey; codigo: string;
  dataPrevista: Date | null;
  email?: string | null; whatsapp?: string | null;
  notifEmail: boolean; notifWhats: boolean;
}

export async function notificarAtualizacao(p: NotificarParams) {
  const link = `${env.publicBaseUrl}/rastreio/${p.codigo}`;
  const dataEntrega = p.dataPrevista
    ? new Date(p.dataPrevista).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
    : "a confirmar";
  const corpo = montarMensagem({
    nome: p.nome, numero: p.numero, status: STATUS[p.status], dataEntrega, link, codigo: p.codigo,
  });

  const canais: { canal: "email" | "whatsapp"; destino: string; enviar: () => Promise<any> }[] = [];
  if (p.notifEmail && p.email) {
    canais.push({ canal: "email", destino: p.email,
      enviar: () => enviarEmail(p.email!, `Atualização do pedido ${p.numero}`, corpo) });
  }
  if (p.notifWhats && p.whatsapp) {
    canais.push({ canal: "whatsapp", destino: p.whatsapp, enviar: () => enviarWhatsApp(p.whatsapp!, corpo) });
  }

  for (const c of canais) {
    const ins = await query<{ id: string }>(
      `INSERT INTO notificacoes (pedido_id, cliente_id, canal, destino, status_envio, template, mensagem)
       VALUES ($1,$2,$3,$4,'pendente',$5,$6) RETURNING id`,
      [p.pedidoId, p.clienteId, c.canal, c.destino, p.status, corpo]
    );
    const notifId = ins.rows[0].id;
    try {
      const r = await c.enviar();
      const status = r.mock ? "entregue" : "enviada";
      await query(`UPDATE notificacoes SET status_envio=$1, atualizado_em=now() WHERE id=$2`, [status, notifId]);
    } catch (e: any) {
      await query(`UPDATE notificacoes SET status_envio='erro', erro=$1, atualizado_em=now() WHERE id=$2`,
        [e.message ?? String(e), notifId]);
    }
  }
}

export async function enviarTeste(canal: "email" | "whatsapp", destino: string) {
  const corpo = "Mensagem de teste do sistema de rastreamento de pedidos.";
  if (canal === "email") return enviarEmail(destino, "Teste de notificação", corpo);
  return enviarWhatsApp(destino, corpo);
}

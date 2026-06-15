"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function Configuracoes() {
  const [cfg, setCfg] = useState<any>({});
  const [msg, setMsg] = useState("");

  useEffect(() => { api.configuracoes().then((r) => setCfg(r.configuracoes || {})).catch(() => {}); }, []);

  async function salvar(chave: string, valor: any) {
    try {
      await fetch(`${api.base}/api/admin/configuracoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("rp_token")}` },
        body: JSON.stringify({ chave, valor }),
      });
      setMsg("Configuração salva."); setTimeout(() => setMsg(""), 2000);
    } catch { setMsg("Erro ao salvar."); }
  }

  const wpp = cfg.whatsapp || {};
  const tmpl = cfg.template || {};

  return (
    <div className="p-6 sm:p-8 max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Configurações</h1>

      <div className="card p-6 space-y-3">
        <h3 className="font-semibold text-slate-700">WhatsApp Business API</h3>
        <p className="text-sm text-slate-400">Credenciais sensíveis ficam no servidor (.env). Aqui você ajusta dados operacionais.</p>
        <label className="label">Número oficial da empresa</label>
        <input className="input" defaultValue={wpp.numero || ""} onBlur={(e) => salvar("whatsapp", { ...wpp, numero: e.target.value })} />
        <label className="label">Horário de envio (ex: 08:00-20:00)</label>
        <input className="input" defaultValue={wpp.horario || "08:00-20:00"} onBlur={(e) => salvar("whatsapp", { ...wpp, horario: e.target.value })} />
      </div>

      <div className="card p-6 space-y-3">
        <h3 className="font-semibold text-slate-700">Template de mensagem</h3>
        <p className="text-sm text-slate-400">Variáveis: {"{NomeCliente} {NumeroPedido} {Status} {DataEntrega} {LinkRastreamento} {CodigoPedido}"}</p>
        <textarea className="input font-mono text-sm" rows={8} defaultValue={tmpl.corpo ||
`Olá, {NomeCliente}.
Seu pedido Nº {NumeroPedido} foi atualizado.
Status Atual: {Status}
Previsão: {DataEntrega}
Acompanhe: {LinkRastreamento}
PROTOCOLO: {CodigoPedido}`}
          onBlur={(e) => salvar("template", { ...tmpl, corpo: e.target.value })} />
      </div>

      {msg && <p className="text-emerald-600 text-sm">{msg}</p>}
    </div>
  );
}

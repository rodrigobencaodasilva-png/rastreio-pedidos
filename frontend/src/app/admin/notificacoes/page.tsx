"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const CORES: Record<string, string> = {
  enviada: "bg-blue-100 text-blue-700", entregue: "bg-emerald-100 text-emerald-700",
  lida: "bg-indigo-100 text-indigo-700", pendente: "bg-amber-100 text-amber-700",
  erro: "bg-red-100 text-red-700",
};

export default function Notificacoes() {
  const [data, setData] = useState<any>(null);
  const [filtro, setFiltro] = useState("");
  const [canal, setCanal] = useState("email");
  const [destino, setDestino] = useState("");
  const [teste, setTeste] = useState("");

  async function carregar() {
    const r = await api.notificacoes(filtro ? `?status=${filtro}` : "");
    setData(r);
  }
  useEffect(() => { carregar(); /* eslint-disable-next-line */ }, [filtro]);

  const resumo: Record<string, number> = {};
  data?.resumo?.forEach((r: any) => (resumo[r.status_envio] = r.n));

  async function enviarTeste() {
    try { await api.testarNotificacao(canal, destino); setTeste("Teste enviado (verifique o modo de envio)."); }
    catch (e: any) { setTeste(e.message); }
  }

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Central de Notificações</h1>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {["enviada", "entregue", "lida", "pendente", "erro"].map((s) => (
          <button key={s} onClick={() => setFiltro(filtro === s ? "" : s)}
            className={`card p-4 text-left ${filtro === s ? "ring-2 ring-brand-500" : ""}`}>
            <p className="text-2xl font-bold text-slate-800">{resumo[s] ?? 0}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full ${CORES[s]}`}>{s}</span>
          </button>
        ))}
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-slate-700 mb-3">Teste de envio</h3>
        <div className="flex flex-wrap gap-2">
          <select className="input max-w-[160px]" value={canal} onChange={(e) => setCanal(e.target.value)}>
            <option value="email">E-mail</option><option value="whatsapp">WhatsApp</option>
          </select>
          <input className="input flex-1 min-w-[200px]" placeholder="destino (e-mail ou nº)"
            value={destino} onChange={(e) => setDestino(e.target.value)} />
          <button className="btn-primary" onClick={enviarTeste}>Enviar teste</button>
        </div>
        {teste && <p className="mt-2 text-sm text-slate-500">{teste}</p>}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr><th className="px-4 py-3">Pedido</th><th className="px-4 py-3">Canal</th>
              <th className="px-4 py-3">Destino</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Data</th></tr>
          </thead>
          <tbody>
            {data?.notificacoes?.map((n: any) => (
              <tr key={n.id} className="border-t border-slate-100">
                <td className="px-4 py-3">Nº {n.pedido_numero ?? "—"}</td>
                <td className="px-4 py-3">{n.canal === "email" ? "✉️ E-mail" : "💬 WhatsApp"}</td>
                <td className="px-4 py-3 text-slate-500">{n.destino}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${CORES[n.status_envio]}`}>{n.status_envio}</span></td>
                <td className="px-4 py-3 text-slate-500">{new Date(n.criado_em).toLocaleString("pt-BR")}</td>
              </tr>
            ))}
            {!data?.notificacoes?.length && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">Sem notificações.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

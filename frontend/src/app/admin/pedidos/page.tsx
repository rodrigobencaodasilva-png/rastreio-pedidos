"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import { STATUS_LABELS, STATUS_KEYS } from "@/lib/status";

export default function Pedidos() {
  const [lista, setLista] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("");
  const [sel, setSel] = useState<any>(null);
  const [msg, setMsg] = useState("");

  async function carregar() {
    const q = new URLSearchParams();
    if (busca) q.set("busca", busca);
    if (filtro) q.set("status", filtro);
    const r = await api.pedidos(q.toString() ? `?${q}` : "");
    setLista(r.pedidos);
  }
  useEffect(() => { carregar(); /* eslint-disable-next-line */ }, [filtro]);

  async function abrir(id: string) {
    const r = await api.pedido(id);
    setSel(r.pedido);
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h1 className="text-2xl font-bold text-slate-800">Pedidos</h1>
        <div className="flex gap-2">
          <a href={`${api.base}/api/admin/exportar/excel`} className="btn-ghost text-sm">⬇ Excel</a>
          <a href={`${api.base}/api/admin/exportar/pdf`} className="btn-ghost text-sm">⬇ PDF</a>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <form onSubmit={(e) => { e.preventDefault(); carregar(); }} className="flex gap-2 flex-1 min-w-[260px]">
          <input className="input" placeholder="Buscar por nome, CPF/CNPJ ou nº do pedido"
            value={busca} onChange={(e) => setBusca(e.target.value)} />
          <button className="btn-primary">Buscar</button>
        </form>
        <select className="input max-w-[220px]" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
          <option value="">Todos os status</option>
          {STATUS_KEYS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-3">Pedido</th><th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Status</th><th className="px-4 py-3">Previsão</th><th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {lista.map((p) => (
              <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">Nº {p.numero}</td>
                <td className="px-4 py-3">{p.cliente_nome}</td>
                <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                <td className="px-4 py-3 text-slate-500">
                  {p.data_prevista ? new Date(p.data_prevista).toLocaleDateString("pt-BR") : "—"}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => abrir(p.id)} className="text-brand-600 hover:underline">Gerenciar</button>
                </td>
              </tr>
            ))}
            {!lista.length && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">Nenhum pedido encontrado.</td></tr>}
          </tbody>
        </table>
      </div>

      {sel && <Drawer pedido={sel} onClose={() => { setSel(null); carregar(); }} onMsg={setMsg} reload={() => abrir(sel.id)} />}
      {msg && <div className="fixed bottom-6 right-6 bg-slate-800 text-white px-4 py-2 rounded-xl text-sm shadow-lg">{msg}</div>}
    </div>
  );
}

function Drawer({ pedido, onClose, onMsg, reload }:
  { pedido: any; onClose: () => void; onMsg: (s: string) => void; reload: () => void }) {
  const [status, setStatus] = useState(pedido.status);
  const [descricao, setDescricao] = useState("");
  const [novaData, setNovaData] = useState("");
  const [obs, setObs] = useState(pedido.observacoes || "");
  const [qr, setQr] = useState<string | null>(null);

  function flash(s: string) { onMsg(s); setTimeout(() => onMsg(""), 2500); }

  async function salvarStatus() {
    await api.alterarStatus(pedido.id, status, descricao);
    flash("Status atualizado e notificação disparada."); reload();
  }
  async function reagendar() {
    if (!novaData) return;
    await api.reagendar(pedido.id, { data_prevista: new Date(novaData).toISOString(), motivo: descricao });
    flash("Entrega reagendada."); reload();
  }
  async function salvarObs() {
    await api.editarPedido(pedido.id, { observacoes: obs });
    flash("Observações salvas."); reload();
  }
  async function gerarQr(reemitir = false) {
    const r = reemitir ? await api.reemitirQr(pedido.id) : await api.qr(pedido.id);
    setQr(r.dataUrl); if (reemitir) flash("QR reemitido.");
  }
  async function excluir() {
    if (!confirm("Excluir este pedido?")) return;
    await api.excluirPedido(pedido.id); onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex justify-end z-50" onClick={onClose}>
      <div className="w-full max-w-lg bg-white h-full overflow-auto p-6 space-y-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold">Pedido Nº {pedido.numero}</h2>
            <p className="text-slate-500 text-sm">{pedido.cliente.nome} • {pedido.cliente.documento}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 text-2xl leading-none">×</button>
        </div>

        <section className="space-y-2">
          <label className="label">Alterar status</label>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_KEYS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <input className="input" placeholder="Descrição / observação do status (opcional)"
            value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          <button className="btn-primary w-full" onClick={salvarStatus}>Salvar status + notificar</button>
        </section>

        <section className="space-y-2">
          <label className="label">Adiar / Reagendar entrega</label>
          <input type="datetime-local" className="input" value={novaData} onChange={(e) => setNovaData(e.target.value)} />
          <button className="btn-ghost w-full" onClick={reagendar}>Reagendar entrega</button>
        </section>

        <section className="space-y-2">
          <label className="label">Observações</label>
          <textarea className="input" rows={3} value={obs} onChange={(e) => setObs(e.target.value)} />
          <button className="btn-ghost w-full" onClick={salvarObs}>Salvar observações</button>
        </section>

        <section className="space-y-2">
          <label className="label">QR Code de recebimento</label>
          <div className="flex gap-2">
            <button className="btn-ghost flex-1" onClick={() => gerarQr(false)}>Gerar / ver QR</button>
            <button className="btn-ghost flex-1" onClick={() => gerarQr(true)}>Reemitir QR</button>
          </div>
          {qr && <img src={qr} alt="QR" className="mx-auto mt-3 w-44 border rounded-xl p-2" />}
        </section>

        <button onClick={excluir} className="text-red-600 text-sm hover:underline">Excluir pedido</button>
      </div>
    </div>
  );
}

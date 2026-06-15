"use client";
import ProgressBar from "./ProgressBar";
import StatusBadge from "./StatusBadge";

function fmtData(d?: string | null) {
  return d ? new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";
}

export default function OrderCard({ pedido }: { pedido: any }) {
  return (
    <div className="card p-6 sm:p-8 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">Pedido</p>
          <h2 className="text-2xl font-bold text-slate-800">Nº {pedido.numero}</h2>
          <p className="text-slate-500">{pedido.cliente.nome} • {pedido.cliente.documento}</p>
        </div>
        <StatusBadge status={pedido.status} />
      </div>

      <ProgressBar fluxo={pedido.fluxo} statusAtual={pedido.status} progresso={pedido.progresso} />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Info titulo="Data do pedido" valor={fmtData(pedido.data_pedido)} />
        <Info titulo="Previsão de entrega" valor={fmtData(pedido.data_prevista)} destaque />
        <Info titulo="Prazo restante" valor={pedido.horas_uteis_restantes != null
          ? `${pedido.horas_uteis_restantes}h úteis` : "—"} />
        <Info titulo="Produto" valor={pedido.produto || "—"} />
      </div>

      {pedido.observacoes && (
        <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-800">
          <strong>Observações:</strong> {pedido.observacoes}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <h3 className="font-semibold text-slate-700 mb-3">Histórico do pedido</h3>
          <ol className="relative border-l-2 border-slate-100 ml-2 space-y-4">
            {pedido.historico.map((h: any, i: number) => (
              <li key={i} className="ml-4">
                <span className="absolute -left-[7px] w-3 h-3 rounded-full bg-brand-500" />
                <p className="text-sm font-medium text-slate-700">{h.label}</p>
                {h.descricao && <p className="text-xs text-slate-500">{h.descricao}</p>}
                <p className="text-xs text-slate-400">{fmtData(h.data)}</p>
              </li>
            ))}
          </ol>
        </div>
        {pedido.qr?.codigo && (
          <div className="flex flex-col items-center justify-start">
            <h3 className="font-semibold text-slate-700 mb-3">QR de recebimento</h3>
            <img alt="QR Code"
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                `${typeof window !== "undefined" ? window.location.origin : ""}/qr/${pedido.qr.codigo}`)}`}
              className="rounded-xl border border-slate-100 p-2 bg-white" />
            <p className="mt-2 text-xs text-slate-400 break-all text-center">{pedido.qr.codigo}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Info({ titulo, valor, destaque }: { titulo: string; valor: string; destaque?: boolean }) {
  return (
    <div className={`rounded-xl p-4 ${destaque ? "bg-brand-50" : "bg-slate-50"}`}>
      <p className="text-xs text-slate-400">{titulo}</p>
      <p className={`font-semibold ${destaque ? "text-brand-700" : "text-slate-700"}`}>{valor}</p>
    </div>
  );
}

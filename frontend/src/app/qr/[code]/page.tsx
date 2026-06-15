"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function QrPage({ params }: { params: { code: string } }) {
  const [info, setInfo] = useState<any>(null);
  const [erro, setErro] = useState("");
  useEffect(() => {
    api.validarQr(params.code).then(setInfo).catch((e) => setErro(e.message));
  }, [params.code]);

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-brand-700 to-brand-900">
      <div className="card p-8 max-w-md w-full text-center">
        {erro && <p className="text-red-600">⚠️ {erro}</p>}
        {!info && !erro && <p className="text-slate-400">Validando QR Code...</p>}
        {info && (
          <>
            <div className="text-5xl">✅</div>
            <h1 className="mt-3 text-xl font-bold text-slate-800">Comprovante de Recebimento</h1>
            <p className="text-sm text-slate-400">QR Code válido</p>
            <dl className="mt-6 text-left space-y-3">
              <Linha t="Cliente" v={info.cliente} />
              <Linha t="Pedido" v={`Nº ${info.numero}`} />
              <Linha t="Status" v={info.status} />
              <Linha t="Entrega prevista" v={info.data_entrega
                ? new Date(info.data_entrega).toLocaleString("pt-BR") : "—"} />
              <Linha t="Código de validação" v={info.codigo} mono />
            </dl>
          </>
        )}
      </div>
    </main>
  );
}
function Linha({ t, v, mono }: { t: string; v: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
      <dt className="text-slate-400 text-sm">{t}</dt>
      <dd className={`font-medium text-slate-700 text-right ${mono ? "font-mono text-xs break-all" : ""}`}>{v}</dd>
    </div>
  );
}

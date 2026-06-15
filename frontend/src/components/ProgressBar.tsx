"use client";
import { STATUS_ICONE, STATUS_LABELS } from "@/lib/status";

export default function ProgressBar({ fluxo, statusAtual, progresso }:
  { fluxo: { status: string; label: string }[]; statusAtual: string; progresso: number }) {
  const idxAtual = fluxo.findIndex((f) => f.status === statusAtual);
  return (
    <div className="w-full">
      <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700 transition-all"
          style={{ width: `${progresso}%` }} />
      </div>
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {fluxo.map((f, i) => {
          const feito = idxAtual >= i && idxAtual >= 0;
          return (
            <div key={f.status} className="flex flex-col items-center text-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm
                ${feito ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                {STATUS_ICONE[f.status] ?? "•"}
              </div>
              <span className={`mt-1 text-[11px] leading-tight ${feito ? "text-slate-700 font-medium" : "text-slate-400"}`}>
                {STATUS_LABELS[f.status] ?? f.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

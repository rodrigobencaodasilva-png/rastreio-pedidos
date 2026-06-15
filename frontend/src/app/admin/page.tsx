"use client";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { api } from "@/lib/api";
import { STATUS_LABELS } from "@/lib/status";

export default function Dashboard() {
  const [d, setD] = useState<any>(null);
  const [erro, setErro] = useState("");
  useEffect(() => { api.dashboard().then(setD).catch((e) => setErro(e.message)); }, []);

  if (erro) return <div className="p-8 text-red-600">{erro}</div>;
  if (!d) return <div className="p-8 text-slate-400">Carregando...</div>;

  const cards = [
    { t: "Total de pedidos", v: d.cards.total, c: "bg-brand-50 text-brand-700", i: "📦" },
    { t: "Em andamento", v: d.cards.em_andamento, c: "bg-indigo-50 text-indigo-700", i: "🚚" },
    { t: "Entregues", v: d.cards.entregues, c: "bg-emerald-50 text-emerald-700", i: "🎉" },
    { t: "Atrasados", v: d.cards.atrasados, c: "bg-red-50 text-red-700", i: "⚠️" },
  ];
  const porStatus = d.por_status.map((s: any) => ({ nome: STATUS_LABELS[s.status] ?? s.status, n: s.n }));

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.t} className="card p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${c.c}`}>{c.i}</div>
            <p className="mt-3 text-3xl font-bold text-slate-800">{c.v}</p>
            <p className="text-sm text-slate-400">{c.t}</p>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-semibold text-slate-700 mb-4">Pedidos por status</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={porStatus} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="nome" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="n" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-6">
          <h3 className="font-semibold text-slate-700 mb-4">Pedidos nos últimos 14 dias</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={d.por_dia} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="dia" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="n" stroke="#1d4ed8" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

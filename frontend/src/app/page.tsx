"use client";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import OrderCard from "@/components/OrderCard";

function mascara(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 11)
    return d.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  return d.replace(/(\d{2})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1/$2").replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

export default function Home() {
  const [doc, setDoc] = useState("");
  const [pedidos, setPedidos] = useState<any[] | null>(null);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    setErro(""); setPedidos(null); setLoading(true);
    try {
      const r = await api.consulta(doc.replace(/\D/g, ""));
      setPedidos(r.pedidos);
    } catch (e: any) { setErro(e.message); }
    finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen">
      <header className="bg-gradient-to-br from-brand-700 to-brand-900 text-white">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">🚚 Rastreio de Pedidos</div>
          <Link href="/admin/login" className="text-sm text-white/80 hover:text-white">Área administrativa</Link>
        </div>
        <div className="max-w-3xl mx-auto px-6 pb-16 pt-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold">Acompanhe sua entrega</h1>
          <p className="mt-3 text-white/80">Informe seu CPF ou CNPJ para consultar a situação do seu pedido em tempo real.</p>
          <form onSubmit={buscar} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <input className="input bg-white text-slate-800" placeholder="000.000.000-00 ou 00.000.000/0000-00"
              value={doc} onChange={(e) => setDoc(mascara(e.target.value))} inputMode="numeric" />
            <button className="btn-primary bg-white !text-brand-700 hover:!bg-brand-50 whitespace-nowrap"
              disabled={loading}>{loading ? "Buscando..." : "Consultar pedido"}</button>
          </form>
          {erro && <p className="mt-4 text-amber-200 bg-white/10 inline-block px-4 py-2 rounded-lg">{erro}</p>}
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 -mt-8 pb-16 space-y-6">
        {pedidos?.map((p) => <OrderCard key={p.id} pedido={p} />)}
        {pedidos === null && !erro && (
          <div className="grid sm:grid-cols-3 gap-4 mt-12">
            {[["🔒","Consulta segura","Seus dados protegidos."],
              ["⏱️","Tempo real","Status sempre atualizado."],
              ["📦","Histórico completo","Toda a jornada do pedido."]].map(([i,t,d]) => (
              <div key={t} className="card p-6 text-center">
                <div className="text-3xl">{i}</div>
                <h3 className="mt-2 font-semibold text-slate-700">{t}</h3>
                <p className="text-sm text-slate-500">{d}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

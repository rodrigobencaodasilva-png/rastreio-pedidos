"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import OrderCard from "@/components/OrderCard";

export default function RastreioPage({ params }: { params: { code: string } }) {
  const [pedido, setPedido] = useState<any>(null);
  const [erro, setErro] = useState("");
  useEffect(() => {
    api.rastreio(params.code).then((r) => setPedido(r.pedido)).catch((e) => setErro(e.message));
  }, [params.code]);

  return (
    <main className="min-h-screen">
      <header className="bg-gradient-to-br from-brand-700 to-brand-900 text-white py-6">
        <div className="max-w-4xl mx-auto px-6 font-bold text-lg">🚚 Rastreio de Pedidos</div>
      </header>
      <section className="max-w-4xl mx-auto px-6 py-10">
        {erro && <div className="card p-8 text-center text-red-600">{erro}</div>}
        {pedido && <OrderCard pedido={pedido} />}
        {!pedido && !erro && <div className="card p-8 text-center text-slate-400">Carregando...</div>}
      </section>
    </main>
  );
}

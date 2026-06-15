"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const EXEMPLO = `Nome: João Silva
CPF: 123.456.789-00
Pedido: 654321
Produto: 4 Pneus
Valor: R$ 3.000,00
E-mail: joao@exemplo.com
WhatsApp: (11) 99999-0000`;

export default function CadastroRapido() {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [form, setForm] = useState<any>(null);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");

  async function analisar() {
    setErro("");
    try {
      const r = await api.preview(texto);
      setForm({
        nome: r.nome || "", documento: r.documento || "", numero: r.numero || "",
        produto: r.produto || "", valor: r.valor ?? "", email: r.email || "",
        whatsapp: r.whatsapp || "", notif_email: !!r.email, notif_whats: !!r.whatsapp,
        observacoes: r.observacoes || "", extras: r.extras || {},
      });
    } catch (e: any) { setErro(e.message); }
  }

  async function salvar() {
    setErro(""); setOk("");
    try {
      const payload = { ...form, valor: form.valor ? Number(form.valor) : undefined, info_adicional: form.extras };
      delete payload.extras;
      await api.criarPedido(payload);
      setOk("Pedido criado com sucesso!");
      setTimeout(() => router.push("/admin/pedidos"), 1000);
    } catch (e: any) { setErro(e.message); }
  }

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <div className="p-6 sm:p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Cadastro Rápido</h1>
      <p className="text-slate-500 mb-6">Cole a ficha do pedido. O sistema identifica os campos automaticamente.</p>

      <div className="card p-6 space-y-3">
        <div className="flex justify-between items-center">
          <label className="label mb-0">Ficha do pedido</label>
          <button className="text-xs text-brand-600 hover:underline" onClick={() => setTexto(EXEMPLO)}>usar exemplo</button>
        </div>
        <textarea className="input font-mono text-sm" rows={8} value={texto}
          onChange={(e) => setTexto(e.target.value)} placeholder={EXEMPLO} />
        <button className="btn-primary w-full" onClick={analisar} disabled={!texto.trim()}>⚡ Identificar campos</button>
      </div>

      {form && (
        <div className="card p-6 mt-6 space-y-4">
          <h3 className="font-semibold text-slate-700">Confira os dados identificados</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Campo l="Nome" v={form.nome} on={(v) => set("nome", v)} />
            <Campo l="CPF/CNPJ" v={form.documento} on={(v) => set("documento", v)} />
            <Campo l="Nº do pedido" v={form.numero} on={(v) => set("numero", v)} />
            <Campo l="Produto" v={form.produto} on={(v) => set("produto", v)} />
            <Campo l="Valor (R$)" v={form.valor} on={(v) => set("valor", v)} />
            <Campo l="E-mail" v={form.email} on={(v) => set("email", v)} />
            <Campo l="WhatsApp" v={form.whatsapp} on={(v) => set("whatsapp", v)} />
          </div>
          <div className="flex gap-6 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.notif_email}
              onChange={(e) => set("notif_email", e.target.checked)} /> Notificar por e-mail</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.notif_whats}
              onChange={(e) => set("notif_whats", e.target.checked)} /> Notificar por WhatsApp</label>
          </div>
          {Object.keys(form.extras).length > 0 && (
            <p className="text-xs text-slate-400">Campos extras salvos: {Object.keys(form.extras).join(", ")}</p>
          )}
          <button className="btn-primary w-full" onClick={salvar}>Criar pedido</button>
        </div>
      )}

      {erro && <p className="mt-4 text-red-600">{erro}</p>}
      {ok && <p className="mt-4 text-emerald-600">{ok}</p>}
    </div>
  );
}

function Campo({ l, v, on }: { l: string; v: any; on: (v: string) => void }) {
  return (
    <div><label className="label">{l}</label>
      <input className="input" value={v} onChange={(e) => on(e.target.value)} /></div>
  );
}

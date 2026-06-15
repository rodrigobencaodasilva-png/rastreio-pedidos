"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, setSession } from "@/lib/api";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(""); setLoading(true);
    try {
      const r = await api.login(email, senha);
      setSession(r.token, r.admin);
      router.push("/admin");
    } catch (e: any) { setErro(e.message); }
    finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-700 to-brand-900 px-6">
      <form onSubmit={entrar} className="card p-8 w-full max-w-sm space-y-4">
        <div className="text-center">
          <div className="text-3xl">🔐</div>
          <h1 className="text-xl font-bold text-slate-800 mt-2">Painel Administrativo</h1>
          <p className="text-sm text-slate-400">Acesso restrito</p>
        </div>
        <div>
          <label className="label">E-mail</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="label">Senha</label>
          <input className="input" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        </div>
        {erro && <p className="text-red-600 text-sm">{erro}</p>}
        <button className="btn-primary w-full" disabled={loading}>{loading ? "Entrando..." : "Entrar"}</button>
      </form>
    </main>
  );
}

"use client";
const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("rp_token");
}
export function setSession(token: string, admin: any) {
  localStorage.setItem("rp_token", token);
  localStorage.setItem("rp_admin", JSON.stringify(admin));
}
export function getAdmin(): any | null {
  if (typeof window === "undefined") return null;
  const a = localStorage.getItem("rp_admin");
  return a ? JSON.parse(a) : null;
}
export function logout() {
  localStorage.removeItem("rp_token");
  localStorage.removeItem("rp_admin");
}

async function req<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(opts.headers as any) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...opts, headers });
  if (!res.ok) {
    const e = await res.json().catch(() => ({ erro: "Erro de rede" }));
    throw new Error(e.erro || "Erro");
  }
  return res.json();
}

export const api = {
  base: BASE,
  configuracoes: () => req("/api/admin/configuracoes"),
  consulta: (documento: string) => req("/api/public/consulta", { method: "POST", body: JSON.stringify({ documento }) }),
  rastreio: (codigo: string) => req(`/api/public/rastreio/${codigo}`),
  validarQr: (codigo: string) => req(`/api/public/qr/${codigo}`),
  login: (email: string, senha: string) => req("/api/auth/login", { method: "POST", body: JSON.stringify({ email, senha }) }),
  dashboard: () => req("/api/admin/dashboard"),
  pedidos: (q = "") => req(`/api/admin/pedidos${q}`),
  pedido: (id: string) => req(`/api/admin/pedidos/${id}`),
  criarPedido: (data: any) => req("/api/admin/pedidos", { method: "POST", body: JSON.stringify(data) }),
  editarPedido: (id: string, data: any) => req(`/api/admin/pedidos/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  excluirPedido: (id: string) => req(`/api/admin/pedidos/${id}`, { method: "DELETE" }),
  alterarStatus: (id: string, status: string, descricao?: string) =>
    req(`/api/admin/pedidos/${id}/status`, { method: "POST", body: JSON.stringify({ status, descricao }) }),
  reagendar: (id: string, data: any) => req(`/api/admin/pedidos/${id}/reagendar`, { method: "POST", body: JSON.stringify(data) }),
  preview: (texto: string) => req("/api/admin/ficha/preview", { method: "POST", body: JSON.stringify({ texto }) }),
  qr: (id: string) => req(`/api/admin/pedidos/${id}/qr`),
  reemitirQr: (id: string) => req(`/api/admin/pedidos/${id}/qr/reemitir`, { method: "POST" }),
  clientes: (q = "") => req(`/api/admin/clientes${q}`),
  notificacoes: (q = "") => req(`/api/admin/notificacoes${q}`),
  testarNotificacao: (canal: string, destino: string) =>
    req("/api/admin/notificacoes/testar", { method: "POST", body: JSON.stringify({ canal, destino }) }),
  logs: () => req("/api/admin/logs"),
};

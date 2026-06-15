"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAdmin, logout } from "@/lib/api";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/pedidos", label: "Pedidos", icon: "📦" },
  { href: "/admin/novo", label: "Cadastro Rápido", icon: "⚡" },
  { href: "/admin/notificacoes", label: "Notificações", icon: "🔔" },
  { href: "/admin/configuracoes", label: "Configurações", icon: "⚙️" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);

  useEffect(() => {
    if (pathname === "/admin/login") return;
    const a = getAdmin();
    if (!a) { router.push("/admin/login"); return; }
    setAdmin(a);
  }, [pathname, router]);

  if (pathname === "/admin/login") return <>{children}</>;
  if (!admin) return <div className="min-h-screen flex items-center justify-center text-slate-400">Carregando...</div>;

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 bg-brand-900 text-white flex flex-col">
        <div className="p-5 font-bold text-lg border-b border-white/10">🚚 Rastreio Admin</div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((n) => {
            const ativo = pathname === n.href;
            return (
              <Link key={n.href} href={n.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition
                  ${ativo ? "bg-white/15 font-medium" : "text-white/70 hover:bg-white/10"}`}>
                <span>{n.icon}</span> {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10 text-sm">
          <p className="text-white/60 truncate">{admin.nome}</p>
          <button onClick={() => { logout(); router.push("/admin/login"); }}
            className="mt-2 text-white/70 hover:text-white text-xs">Sair →</button>
        </div>
      </aside>
      <main className="flex-1 bg-slate-50 overflow-auto">{children}</main>
    </div>
  );
}

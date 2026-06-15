import { Request, Response } from "express";
import { z } from "zod";
import { query } from "../db/pool";
import { verificarSenha, gerarToken } from "../utils/security";
import { registrarLog } from "../middleware/audit";

const loginSchema = z.object({ email: z.string().email(), senha: z.string().min(1) });

export async function login(req: Request, res: Response) {
  const { email, senha } = loginSchema.parse(req.body);
  const r = await query(`SELECT id, nome, email, senha_hash, role, ativo FROM admins WHERE email=$1`, [email]);
  const admin = r.rows[0];
  if (!admin || !admin.ativo) return res.status(401).json({ erro: "Credenciais inválidas" });
  const ok = await verificarSenha(senha, admin.senha_hash);
  if (!ok) return res.status(401).json({ erro: "Credenciais inválidas" });

  const token = gerarToken({ id: admin.id, email: admin.email, role: admin.role });
  await registrarLog(req as any, "login", "admin", admin.id);
  res.json({ token, admin: { id: admin.id, nome: admin.nome, email: admin.email, role: admin.role } });
}

export async function eu(req: any, res: Response) {
  res.json({ admin: req.admin });
}

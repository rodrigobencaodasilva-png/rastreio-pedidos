import { query } from "../db/pool";
import { AuthRequest } from "./auth";

export async function registrarLog(
  req: AuthRequest, acao: string, entidade?: string, entidadeId?: string, detalhes?: any
) {
  try {
    await query(
      `INSERT INTO logs_auditoria (admin_id, acao, entidade, entidade_id, detalhes, ip)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.admin?.id ?? null, acao, entidade ?? null, entidadeId ?? null,
       detalhes ? JSON.stringify(detalhes) : null,
       req.ip ?? req.socket?.remoteAddress ?? null]
    );
  } catch (e) {
    console.error("Falha ao registrar log de auditoria:", e);
  }
}

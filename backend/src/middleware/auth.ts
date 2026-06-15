import { Request, Response, NextFunction } from "express";
import { verificarToken, TokenPayload } from "../utils/security";

export interface AuthRequest extends Request {
  admin?: TokenPayload;
}

export function autenticar(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ erro: "Token ausente" });
  }
  try {
    req.admin = verificarToken(header.slice(7));
    next();
  } catch {
    return res.status(401).json({ erro: "Token inválido ou expirado" });
  }
}

export function autorizar(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      return res.status(403).json({ erro: "Permissão insuficiente" });
    }
    next();
  };
}

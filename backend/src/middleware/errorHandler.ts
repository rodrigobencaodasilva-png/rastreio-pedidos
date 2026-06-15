import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ erro: "Recurso não encontrado" });
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ erro: "Dados inválidos", detalhes: err.flatten() });
  }
  if (err?.code === "23505") {
    return res.status(409).json({ erro: "Registro duplicado", detalhe: err.detail });
  }
  console.error(err);
  res.status(err.status ?? 500).json({ erro: err.message ?? "Erro interno do servidor" });
}

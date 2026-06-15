import { Router } from "express";
import rateLimit from "express-rate-limit";
import { autenticar, autorizar } from "../middleware/auth";
import * as auth from "../controllers/auth.controller";
import * as pub from "../controllers/public.controller";
import * as ord from "../controllers/orders.controller";
import * as adm from "../controllers/admin.controller";
import * as exp from "../controllers/export.controller";

const router = Router();
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10,
  message: { erro: "Muitas tentativas. Tente novamente mais tarde." } });

router.post("/api/public/consulta", pub.consultarPorDocumento);
router.get("/api/public/rastreio/:codigo", pub.consultarPorCodigo);
router.get("/api/public/qr/:codigo", pub.validarQr);

router.post("/api/auth/login", loginLimiter, auth.login);
router.get("/api/auth/me", autenticar, auth.eu);

const adminRW = [autenticar, autorizar("admin", "operador")];
router.post("/api/admin/ficha/preview", adminRW, ord.previewFicha);
router.get("/api/admin/pedidos", autenticar, ord.listarPedidos);
router.post("/api/admin/pedidos", adminRW, ord.criarPedido);
router.get("/api/admin/pedidos/:id", autenticar, ord.obterPedido);
router.put("/api/admin/pedidos/:id", adminRW, ord.editarPedido);
router.delete("/api/admin/pedidos/:id", autenticar, autorizar("admin"), ord.excluirPedido);
router.post("/api/admin/pedidos/:id/status", adminRW, ord.alterarStatus);
router.post("/api/admin/pedidos/:id/reagendar", adminRW, ord.reagendarEntrega);
router.post("/api/admin/pedidos/:id/observacao", adminRW, ord.adicionarObservacao);
router.get("/api/admin/pedidos/:id/qr", autenticar, ord.obterQr);
router.post("/api/admin/pedidos/:id/qr/reemitir", adminRW, ord.reemitirQr);

router.get("/api/admin/dashboard", autenticar, adm.dashboard);
router.get("/api/admin/clientes", autenticar, adm.listarClientes);
router.get("/api/admin/notificacoes", autenticar, adm.listarNotificacoes);
router.post("/api/admin/notificacoes/testar", adminRW, adm.testarNotificacao);
router.get("/api/admin/configuracoes", autenticar, adm.obterConfiguracoes);
router.post("/api/admin/configuracoes", autenticar, autorizar("admin"), adm.salvarConfiguracao);
router.get("/api/admin/logs", autenticar, autorizar("admin"), adm.listarLogs);

router.get("/api/admin/exportar/excel", autenticar, exp.exportarExcel);
router.get("/api/admin/exportar/pdf", autenticar, exp.exportarPdf);

export default router;

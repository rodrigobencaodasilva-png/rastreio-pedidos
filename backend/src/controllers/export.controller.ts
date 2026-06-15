import { Response } from "express";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { query } from "../db/pool";
import { AuthRequest } from "../middleware/auth";
import { STATUS, StatusKey } from "../utils/statuses";
import { formatarDocumento } from "../utils/documento";

async function buscarPedidos() {
  const r = await query(`
    SELECT p.numero, c.nome, c.documento, p.produto, p.valor, p.status, p.data_pedido, p.data_prevista
    FROM pedidos p JOIN clientes c ON c.id=p.cliente_id ORDER BY p.criado_em DESC`);
  return r.rows;
}

export async function exportarExcel(_req: AuthRequest, res: Response) {
  const rows = await buscarPedidos();
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Pedidos");
  ws.columns = [
    { header: "Pedido", key: "numero", width: 16 },
    { header: "Cliente", key: "nome", width: 28 },
    { header: "Documento", key: "doc", width: 20 },
    { header: "Produto", key: "produto", width: 28 },
    { header: "Valor", key: "valor", width: 14 },
    { header: "Status", key: "status", width: 22 },
    { header: "Data Pedido", key: "data_pedido", width: 20 },
    { header: "Previsão", key: "data_prevista", width: 20 },
  ];
  ws.getRow(1).font = { bold: true };
  for (const p of rows) {
    ws.addRow({
      numero: p.numero, nome: p.nome, doc: formatarDocumento(p.documento), produto: p.produto,
      valor: p.valor != null ? Number(p.valor) : null,
      status: STATUS[p.status as StatusKey] ?? p.status,
      data_pedido: p.data_pedido ? new Date(p.data_pedido).toLocaleString("pt-BR") : "",
      data_prevista: p.data_prevista ? new Date(p.data_prevista).toLocaleString("pt-BR") : "",
    });
  }
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", 'attachment; filename="pedidos.xlsx"');
  await wb.xlsx.write(res);
  res.end();
}

export async function exportarPdf(_req: AuthRequest, res: Response) {
  const rows = await buscarPedidos();
  const doc = new PDFDocument({ margin: 36, size: "A4", layout: "landscape" });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="relatorio-pedidos.pdf"');
  doc.pipe(res);

  doc.fontSize(18).text("Relatório de Pedidos", { align: "center" });
  doc.fontSize(9).fillColor("#666")
    .text(`Gerado em ${new Date().toLocaleString("pt-BR")} • ${rows.length} pedidos`, { align: "center" });
  doc.moveDown();

  const headers = ["Pedido", "Cliente", "Documento", "Status", "Valor", "Previsão"];
  const widths = [70, 160, 120, 130, 80, 110];
  let y = doc.y + 6;
  const drawRow = (cells: string[], bold = false) => {
    let x = 36;
    doc.fontSize(9).fillColor(bold ? "#000" : "#222").font(bold ? "Helvetica-Bold" : "Helvetica");
    cells.forEach((c, i) => { doc.text(c, x, y, { width: widths[i] - 4, ellipsis: true }); x += widths[i]; });
    y += 18;
    if (y > 520) { doc.addPage(); y = 50; }
  };
  drawRow(headers, true);
  for (const p of rows) {
    drawRow([
      p.numero, p.nome, formatarDocumento(p.documento),
      STATUS[p.status as StatusKey] ?? p.status,
      p.valor != null ? `R$ ${Number(p.valor).toFixed(2)}` : "-",
      p.data_prevista ? new Date(p.data_prevista).toLocaleDateString("pt-BR") : "-",
    ]);
  }
  doc.end();
}

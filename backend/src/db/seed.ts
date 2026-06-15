import { pool, query } from "./pool";
import { env } from "../config/env";
import { hashSenha } from "../utils/security";
import { gerarCodigoUnico } from "../utils/qrcode";
import { adicionarHorasUteis } from "../utils/businessHours";
import fs from "fs";
import path from "path";

async function aplicarSchema() {
  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await pool.query(sql);
}

async function seed() {
  await aplicarSchema();

  const existe = await query(`SELECT id FROM admins WHERE email=$1`, [env.adminEmail]);
  if (!existe.rows[0]) {
    const hash = await hashSenha(env.adminPassword);
    await query(`INSERT INTO admins (nome, email, senha_hash, role) VALUES ($1,$2,$3,'admin')`,
      ["Administrador", env.adminEmail, hash]);
    console.log(`Admin criado: ${env.adminEmail}`);
  }

  const temPedidos = await query(`SELECT COUNT(*)::int AS n FROM pedidos`);
  if (temPedidos.rows[0].n === 0) {
    const exemplos = [
      { nome: "João Silva", doc: "52998224725", tipo: "cpf", num: "654321",
        produto: "4 Pneus", valor: 3000, status: "em_rota", email: "joao@exemplo.com", whats: "5511999990000" },
      { nome: "Maria Souza", doc: "11444777000161", tipo: "cnpj", num: "654322",
        produto: "Notebook Dell", valor: 4500, status: "em_processamento", email: "maria@exemplo.com", whats: "" },
      { nome: "Carlos Pereira", doc: "39053344705", tipo: "cpf", num: "654323",
        produto: "Geladeira Frost Free", valor: 2800, status: "entregue", email: "", whats: "5521988887777" },
    ];
    for (const e of exemplos) {
      const c = await query(
        `INSERT INTO clientes (nome, documento, tipo_doc, email, whatsapp, notif_email, notif_whats)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [e.nome, e.doc, e.tipo, e.email || null, e.whats || null, !!e.email, !!e.whats]);
      const confirmacao = new Date();
      const prevista = adicionarHorasUteis(confirmacao, 72);
      const p = await query(
        `INSERT INTO pedidos (numero, cliente_id, produto, valor, status, data_confirmacao, data_prevista)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [e.num, c.rows[0].id, e.produto, e.valor, e.status, confirmacao, prevista]);
      await query(`INSERT INTO qrcodes (pedido_id, codigo) VALUES ($1,$2)`, [p.rows[0].id, gerarCodigoUnico(e.num)]);
      await query(
        `INSERT INTO historico_status (pedido_id, status, descricao)
         VALUES ($1,'pedido_recebido','Pedido cadastrado'), ($1,'pedido_confirmado','Pagamento confirmado'), ($1,$2,'Atualização de status')`,
        [p.rows[0].id, e.status]);
    }
    console.log("Dados de exemplo inseridos.");
  }
  console.log("Seed concluído.");
  await pool.end();
}

seed().catch((e) => { console.error(e); process.exit(1); });

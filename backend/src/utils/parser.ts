import { soDigitos, tipoDocumento } from "./documento";

export interface FichaParseada {
  nome?: string;
  documento?: string;
  tipo_doc?: "cpf" | "cnpj";
  numero?: string;
  produto?: string;
  valor?: number;
  email?: string;
  whatsapp?: string;
  observacoes?: string;
  extras: Record<string, string>;
}

const ROTULOS: Record<string, keyof FichaParseada> = {
  nome: "nome", cliente: "nome", "nome do cliente": "nome", "nome completo": "nome",
  cpf: "documento", cnpj: "documento", "cpf/cnpj": "documento", "cnpj/cpf": "documento", documento: "documento", doc: "documento",
  pedido: "numero", "numero do pedido": "numero", "numero": "numero", protocolo: "numero",
  produto: "produto", item: "produto", itens: "produto", mercadoria: "produto", produtos: "produto",
  valor: "valor", total: "valor", "valor total": "valor", "total do pedido": "valor",
  email: "email", "e-mail": "email",
  whatsapp: "whatsapp", celular: "whatsapp", telefone: "whatsapp", whats: "whatsapp", fone: "whatsapp", contato: "whatsapp", tel: "whatsapp",
  obs: "observacoes", observacao: "observacoes", observacoes: "observacoes",
};

const ROTULOS_ENTREGA = new Set([
  "cep", "endereco", "endereço", "complemento", "cidade/uf", "cidade", "uf",
  "bairro", "quem vai receber", "recebedor", "referencia", "referência",
]);

function limparMarkdown(s: string): string {
  return s.replace(/[*_`>~]/g, "").trim();
}

function normalizarChave(k: string): string {
  return limparMarkdown(k).toLowerCase().replace(/\s+/g, " ").trim();
}

function parseValor(v: string): number | undefined {
  const limpo = v.replace(/[^\d.,]/g, "");
  if (!limpo) return undefined;
  const n = limpo.includes(",") ? limpo.replace(/\./g, "").replace(",", ".") : limpo;
  const num = parseFloat(n);
  return isNaN(num) ? undefined : num;
}

export function parseFicha(texto: string): FichaParseada {
  const out: FichaParseada = { extras: {} };
  const itens: string[] = [];
  const entrega: string[] = [];

  for (const raw of texto.split(/\r?\n/)) {
    const linha = limparMarkdown(raw);
    if (!linha) continue;

    const bullet = linha.match(/^[•–—\-]\s*(.+)$/);
    if (bullet) { itens.push(bullet[1].trim()); continue; }

    const m = linha.match(/^\s*([^:]{1,40}?)\s*:\s*(.+?)\s*$/);
    if (!m) continue;
    const chaveOrig = limparMarkdown(m[1]);
    const chave = normalizarChave(m[1]);
    const valorTxt = limparMarkdown(m[2]);
    if (!valorTxt) continue;

    if (ROTULOS_ENTREGA.has(chave)) {
      entrega.push(chaveOrig + ": " + valorTxt);
      out.extras[chaveOrig] = valorTxt;
      continue;
    }

    const campo = ROTULOS[chave];
    if (!campo) { out.extras[chaveOrig] = valorTxt; continue; }

    switch (campo) {
      case "documento": {
        out.documento = soDigitos(valorTxt);
        const t = tipoDocumento(out.documento);
        if (t) out.tipo_doc = t;
        break;
      }
      case "valor": {
        const val = parseValor(valorTxt);
        if (val !== undefined && (chave.includes("total") || out.valor === undefined)) out.valor = val;
        break;
      }
      case "whatsapp": out.whatsapp = soDigitos(valorTxt); break;
      case "numero": out.numero = valorTxt.replace(/[^\w\-]/g, ""); break;
      default: (out as any)[campo] = valorTxt;
    }
  }

  if (itens.length && !out.produto) out.produto = itens.join(" | ");
  if (entrega.length) out.observacoes = "Entrega: " + entrega.join(" | ");

  if (!out.documento) {
    const docMatch = texto.match(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b|\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/);
    if (docMatch) {
      out.documento = soDigitos(docMatch[0]);
      const t = tipoDocumento(out.documento);
      if (t) out.tipo_doc = t;
    }
  }
  if (!out.email) {
    const e = texto.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
    if (e) out.email = e[0];
  }
  return out;
}

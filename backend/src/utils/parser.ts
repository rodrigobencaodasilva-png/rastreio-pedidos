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

const ROTULOS: Record<string, keyof FichaParseada | "extra"> = {
  nome: "nome", cliente: "nome", "nome do cliente": "nome",
  cpf: "documento", cnpj: "documento", "cpf/cnpj": "documento", documento: "documento", doc: "documento",
  pedido: "numero", "numero do pedido": "numero", "nº pedido": "numero", "n pedido": "numero", "numero": "numero",
  produto: "produto", item: "produto", itens: "produto", mercadoria: "produto",
  valor: "valor", total: "valor", preco: "valor", "preço": "valor",
  email: "email", "e-mail": "email",
  whatsapp: "whatsapp", celular: "whatsapp", telefone: "whatsapp", whats: "whatsapp", fone: "whatsapp",
  obs: "observacoes", observacao: "observacoes", "observação": "observacoes", observacoes: "observacoes",
};

function normalizarChave(k: string): string {
  return k.trim().toLowerCase().replace(/\s+/g, " ");
}

function parseValor(v: string): number | undefined {
  const limpo = v.replace(/[^\d.,]/g, "");
  if (!limpo) return undefined;
  let n: string;
  if (limpo.includes(",")) n = limpo.replace(/\./g, "").replace(",", ".");
  else n = limpo;
  const num = parseFloat(n);
  return isNaN(num) ? undefined : num;
}

export function parseFicha(texto: string): FichaParseada {
  const out: FichaParseada = { extras: {} };
  const linhas = texto.split(/\r?\n/);

  for (const linha of linhas) {
    if (!linha.trim()) continue;
    const m = linha.match(/^\s*([^:]{1,40}?)\s*[:\-]\s*(.+?)\s*$/);
    if (!m) continue;
    const chave = normalizarChave(m[1]);
    const valorTxt = m[2].trim();
    const campo = ROTULOS[chave];

    if (!campo || campo === "extra") {
      out.extras[m[1].trim()] = valorTxt;
      continue;
    }
    switch (campo) {
      case "documento": {
        const dig = soDigitos(valorTxt);
        out.documento = dig;
        const t = tipoDocumento(dig);
        if (t) out.tipo_doc = t;
        break;
      }
      case "valor": out.valor = parseValor(valorTxt); break;
      case "whatsapp": out.whatsapp = soDigitos(valorTxt); break;
      case "numero": out.numero = valorTxt.replace(/[^\w\-]/g, ""); break;
      default: (out as any)[campo] = valorTxt;
    }
  }

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

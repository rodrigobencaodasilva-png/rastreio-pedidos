import { test } from "node:test";
import assert from "node:assert";
import { parseFicha } from "../utils/parser";
import { adicionarHorasUteis } from "../utils/businessHours";
import { validarCPF, validarCNPJ, tipoDocumento } from "../utils/documento";

test("parser identifica campos da ficha", () => {
  const ficha = `Nome: João Silva
CPF: 123.456.789-00
Pedido: 654321
Produto: 4 Pneus
Valor: R$ 3.000,00`;
  const r = parseFicha(ficha);
  assert.strictEqual(r.nome, "João Silva");
  assert.strictEqual(r.documento, "12345678900");
  assert.strictEqual(r.numero, "654321");
  assert.strictEqual(r.produto, "4 Pneus");
  assert.strictEqual(r.valor, 3000);
});

test("validação de CPF e CNPJ", () => {
  assert.ok(validarCPF("529.982.247-25"));
  assert.ok(!validarCPF("111.111.111-11"));
  assert.ok(validarCNPJ("11.444.777/0001-61"));
  assert.strictEqual(tipoDocumento("52998224725"), "cpf");
});

test("72h úteis pulam fim de semana", () => {
  const sexta = new Date("2026-06-12T10:00:00");
  const prev = adicionarHorasUteis(sexta, 72);
  assert.ok(prev.getDay() !== 0 && prev.getDay() !== 6);
  assert.ok(prev > sexta);
});

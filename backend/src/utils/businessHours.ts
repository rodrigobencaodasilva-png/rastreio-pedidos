const HORA_INICIO = 8;
const HORA_FIM = 18;
const HORAS_POR_DIA = HORA_FIM - HORA_INICIO;

function ehDiaUtil(d: Date): boolean {
  const dia = d.getDay();
  return dia >= 1 && dia <= 5;
}

export function adicionarHorasUteis(inicio: Date, horasUteis: number): Date {
  let restante = horasUteis;
  const cursor = new Date(inicio);

  const ajustaParaExpediente = (c: Date) => {
    if (!ehDiaUtil(c)) {
      c.setHours(HORA_INICIO, 0, 0, 0);
      while (!ehDiaUtil(c)) c.setDate(c.getDate() + 1);
      return;
    }
    if (c.getHours() < HORA_INICIO) c.setHours(HORA_INICIO, 0, 0, 0);
    if (c.getHours() >= HORA_FIM) {
      c.setDate(c.getDate() + 1);
      c.setHours(HORA_INICIO, 0, 0, 0);
      while (!ehDiaUtil(c)) c.setDate(c.getDate() + 1);
    }
  };
  ajustaParaExpediente(cursor);

  while (restante > 0) {
    const fimDoDia = new Date(cursor);
    fimDoDia.setHours(HORA_FIM, 0, 0, 0);
    const horasDisponiveis = (fimDoDia.getTime() - cursor.getTime()) / 3_600_000;
    if (restante <= horasDisponiveis) {
      cursor.setTime(cursor.getTime() + restante * 3_600_000);
      restante = 0;
    } else {
      restante -= horasDisponiveis;
      cursor.setDate(cursor.getDate() + 1);
      cursor.setHours(HORA_INICIO, 0, 0, 0);
      while (!ehDiaUtil(cursor)) cursor.setDate(cursor.getDate() + 1);
    }
  }
  return cursor;
}

export function horasUteisRestantes(prevista: Date, agora = new Date()): number {
  if (prevista <= agora) return 0;
  let total = 0;
  const cursor = new Date(agora);
  while (cursor < prevista) {
    if (ehDiaUtil(cursor)) {
      const h = cursor.getHours();
      if (h >= HORA_INICIO && h < HORA_FIM) total += 1 / 60;
    }
    cursor.setMinutes(cursor.getMinutes() + 1);
  }
  return Math.round(total);
}

export const PRAZO_PADRAO_HORAS = 72;
export { HORAS_POR_DIA };

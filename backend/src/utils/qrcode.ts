import QRCode from "qrcode";
import crypto from "crypto";

export function gerarCodigoUnico(numeroPedido: string): string {
  const rand = crypto.randomBytes(6).toString("hex").toUpperCase();
  return `RP-${numeroPedido}-${rand}`;
}

export async function gerarQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, { width: 320, margin: 1, errorCorrectionLevel: "M" });
}

import dotenv from "dotenv";
dotenv.config();

function req(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`Variável de ambiente ausente: ${name}`);
  return v;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.PORT ?? "4000", 10),
  databaseUrl: req("DATABASE_URL", "postgres://rastreio:rastreio_pass@localhost:5432/rastreio"),
  jwtSecret: req("JWT_SECRET", "dev-secret-troque"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "8h",
  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? "http://localhost:3000",
  adminEmail: process.env.ADMIN_EMAIL ?? "admin@empresa.com",
  adminPassword: process.env.ADMIN_PASSWORD ?? "Admin@123",
  notificationsMode: (process.env.NOTIFICATIONS_MODE ?? "mock") as "mock" | "live",
  smtp: {
    host: process.env.SMTP_HOST ?? "",
    port: parseInt(process.env.SMTP_PORT ?? "587", 10),
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    from: process.env.SMTP_FROM ?? "no-reply@empresa.com",
  },
  whatsapp: {
    token: process.env.WHATSAPP_TOKEN ?? "",
    phoneId: process.env.WHATSAPP_PHONE_ID ?? "",
  },
};

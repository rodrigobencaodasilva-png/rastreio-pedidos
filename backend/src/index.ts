import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import routes from "./routes";
import { notFound, errorHandler } from "./middleware/errorHandler";

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(rateLimit({ windowMs: 60 * 1000, max: 120 }));

app.get("/health", (_req, res) => res.json({ status: "ok", ts: Date.now() }));
app.use(routes);
app.use(notFound);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`API rodando em http://localhost:${env.port} [${env.nodeEnv}]`);
});

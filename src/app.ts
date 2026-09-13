import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorMiddleware } from "./api/middleware/error.middleware.js";
import { authRouter } from "./api/routes/auth.routes.js";
import { healthRouter } from "./api/routes/health.routes.js";
import { productosRouter } from "./api/routes/productos/productos.routes.js";
import { unidadesMedidaRouter } from "./api/routes/unidadesMedida/unidadesMedida.routes.js";
import { ventasRouter } from "./api/routes/ventas/ventas.routes.js";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN }));
app.use(express.json({ limit: "1mb" }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 }));

app.get("/", (_request, response) => {
  response.json({ service: "jessoft-sales-back", status: "running" });
});

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/unidadesMedida", unidadesMedidaRouter);
app.use("/api/productos", productosRouter);
app.use("/api/ventas", ventasRouter);
app.use(errorMiddleware);

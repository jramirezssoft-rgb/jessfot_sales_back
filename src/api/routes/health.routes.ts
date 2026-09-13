import { Router } from "express";
import { HealthController } from "../controllers/health.controller.js";
import { HealthService } from "../../application/services/health.service.js";

const healthRouter = Router();
const healthController = new HealthController(new HealthService());

healthRouter.get("/", healthController.getStatus);

export { healthRouter };

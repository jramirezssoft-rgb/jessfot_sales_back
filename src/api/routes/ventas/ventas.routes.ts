import { Router } from "express";
import { VentasController } from "../../controllers/ventas/ventas.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { VentasService } from "../../../application/services/ventas/ventas.service.js";

const ventasRouter = Router();
const ventasController = new VentasController(new VentasService());

ventasRouter.use(authMiddleware);
ventasRouter.post("/", ventasController.create);

export { ventasRouter };

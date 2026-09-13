import { Router } from "express";
import { UnidadesMedidaController } from "../../controllers/unidadesMedida/unidadesMedida.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { UnidadesMedidaService } from "../../../application/services/unidadesMedida/unidadesMedida.service.js";

const unidadesMedidaRouter = Router();
const unidadesMedidaController = new UnidadesMedidaController(
  new UnidadesMedidaService(),
);

unidadesMedidaRouter.use(authMiddleware);
unidadesMedidaRouter.get("/", unidadesMedidaController.getAll);

export { unidadesMedidaRouter };

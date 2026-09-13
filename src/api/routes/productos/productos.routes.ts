import { Router } from "express";
import { ProductosController } from "../../controllers/productos/productos.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { ProductosService } from "../../../application/services/productos/productos.service.js";

const productosRouter = Router();
const productosController = new ProductosController(new ProductosService());

productosRouter.use(authMiddleware);
productosRouter.get("/buscar", productosController.search);
productosRouter.get("/", productosController.getAll);
productosRouter.post("/", productosController.create);
productosRouter.put("/", productosController.update);

export { productosRouter };

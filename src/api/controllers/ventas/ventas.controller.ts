import type { Request, Response } from "express";
import { z } from "zod";
import { VentasService } from "../../../application/services/ventas/ventas.service.js";

const detalleVentaSchema = z.object({
  id_producto: z.number().int().positive(),
  cantidad: z.number().positive(),
  subtotal: z.number().positive(),
});

const createVentaSchema = z.object({
  total: z.number().positive(),
  detalle: z.array(detalleVentaSchema).min(1),
});

export class VentasController {
  constructor(private readonly ventasService: VentasService) {}

  create = async (request: Request, response: Response): Promise<void> => {
    const parsed = createVentaSchema.safeParse(request.body);

    if (!parsed.success) {
      response.status(400).json({
        message: "Datos inválidos",
        errors: parsed.error.flatten(),
      });
      return;
    }

    const venta = await this.ventasService.create(parsed.data);
    response.status(201).json(venta);
  };
}
